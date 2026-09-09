package com.koncertify.engine;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.util.*;

@Service
public class BookingService {

    private final SeatRepository seatRepository;
    private final OrderRepository orderRepository;
    private final OutboxRepository outboxRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String RELEASE_LOCK_LUA =
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

    public BookingService(SeatRepository seatRepository,
                          OrderRepository orderRepository,
                          OutboxRepository outboxRepository,
                          StringRedisTemplate redisTemplate) {
        this.seatRepository = seatRepository;
        this.orderRepository = orderRepository;
        this.outboxRepository = outboxRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Processes a booking atomically.
     *
     * Lock ordering strategy:
     *   1. Redis distributed locks acquired in deterministic (sorted) seat-ID order to
     *      prevent inter-process races before hitting the database.
     *   2. PostgreSQL PESSIMISTIC_WRITE locks acquired in the same sorted order inside
     *      the @Transactional boundary — last line of defence against double-booking.
     *   3. Redis locks are released AFTER the Spring @Transactional proxy commits the
     *      DB transaction.  We achieve this by separating the Redis-lock lifecycle from
     *      the DB work: acquire before, release via a TransactionSynchronization
     *      afterCommit callback so another thread cannot sneak in between the Redis
     *      release and the DB commit.
     */
    public Order processBooking(BookingRequest request) {
        if (request.getSeatNums() == null || request.getSeatNums().isEmpty()) {
            throw new IllegalArgumentException("No seats requested for booking.");
        }

        // 1. Sort seat IDs to guarantee deterministic lock acquisition order (deadlock freedom)
        List<Long> sortedSeatNums = request.getSeatNums().stream()
                .filter(Objects::nonNull)
                .sorted()
                .distinct()
                .toList();

        List<String> acquiredLockKeys = new ArrayList<>();
        String lockToken = UUID.randomUUID().toString();

        // 2. Acquire Redis distributed locks BEFORE the DB transaction begins
        try {
            for (Long seatNum : sortedSeatNums) {
                String lockKey = "lock:seat:" + seatNum;
                boolean locked = acquireRedisLockWithFallback(lockKey, lockToken, Duration.ofSeconds(15));
                if (locked) {
                    acquiredLockKeys.add(lockKey);
                } else {
                    throw new RuntimeException(
                            "CONCURRENCY CONFLICT DETECTED: Seat ID " + seatNum + " is locked by another transaction.");
                }
            }

            // 3. Execute the DB work inside a @Transactional boundary.
            //    Redis locks are released only AFTER this method returns and the
            //    transaction commits (see releaseLocksAfterCommit).
            return executeBookingTransaction(sortedSeatNums, request, acquiredLockKeys, lockToken);

        } catch (Exception e) {
            // If we never reached the transactional method (or it threw before commit),
            // release the Redis locks immediately.
            releaseAll(acquiredLockKeys, lockToken);
            throw e;
        }
    }

    /**
     * All DB work lives here so the @Transactional proxy wraps exactly this scope.
     * Redis locks are released via afterCommit so no window exists between Redis
     * release and the actual DB commit becoming visible to other threads.
     */
    @Transactional
    protected Order executeBookingTransaction(List<Long> sortedSeatNums,
                                              BookingRequest request,
                                              List<String> acquiredLockKeys,
                                              String lockToken) {

        // Acquire PostgreSQL PESSIMISTIC_WRITE locks in sorted order
        List<Seat> seats = seatRepository.findAllByIdWithLock(sortedSeatNums);

        if (seats.size() != sortedSeatNums.size()) {
            throw new RuntimeException(
                    "CONCURRENCY CONFLICT DETECTED: One or more requested seat IDs do not exist.");
        }

        for (Seat seat : seats) {
            if (seat.isBooked()) {
                throw new RuntimeException(
                        "CONCURRENCY CONFLICT DETECTED: Seat " + seat.getSeatNumber()
                                + " (ID: " + seat.getId() + ") is already booked.");
            }
            seat.setBooked(true);
        }

        seatRepository.saveAll(seats);

        // Derive event from the first seat (all seats belong to the same event)
        Event event = seats.get(0).getEvent();

        String confirmationCode = "KNC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty())
                ? request.getEmail()
                : "fan-" + confirmationCode.toLowerCase() + "@koncertify.io";

        Order order = new Order(email, confirmationCode, sortedSeatNums);
        order.setEvent(event);   // fixes: orders previously had NULL event_id
        Order savedOrder = orderRepository.save(order);

        // Transactional Outbox Pattern — written atomically in the same DB transaction
        String payload = String.format(
                "{\"orderId\":%d,\"userEmail\":\"%s\",\"confirmationCode\":\"%s\",\"bookedSeats\":%s}",
                savedOrder.getId(), savedOrder.getUserEmail(),
                savedOrder.getConfirmationCode(), sortedSeatNums);
        outboxRepository.save(
                new OutboxMessage("ORDER", savedOrder.getConfirmationCode(), "ORDER_CREATED", payload));

        // Register the Redis lock release to run AFTER the DB transaction commits.
        // This closes the window where a concurrent thread could acquire a Redis lock,
        // read the seat as unbooked (commit not yet visible), and attempt a double-book.
        org.springframework.transaction.support.TransactionSynchronizationManager
                .registerSynchronization(
                        new org.springframework.transaction.support.TransactionSynchronization() {
                            @Override
                            public void afterCommit() {
                                releaseAll(acquiredLockKeys, lockToken);
                            }

                            @Override
                            public void afterCompletion(int status) {
                                // Ensure locks are always released even on rollback
                                if (status != org.springframework.transaction.support
                                        .TransactionSynchronization.STATUS_COMMITTED) {
                                    releaseAll(acquiredLockKeys, lockToken);
                                }
                            }
                        });

        return savedOrder;
    }

    // ── Redis helpers ─────────────────────────────────────────────────────────

    private boolean acquireRedisLockWithFallback(String lockKey, String lockToken, Duration ttl) {
        try {
            Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, lockToken, ttl);
            return Boolean.TRUE.equals(success);
        } catch (Exception e) {
            // Redis unavailable — fall back to DB-only pessimistic locking
            return true;
        }
    }

    private void releaseAll(List<String> lockKeys, String lockToken) {
        for (String lockKey : lockKeys) {
            releaseRedisLockSafe(lockKey, lockToken);
        }
    }

    private void releaseRedisLockSafe(String lockKey, String lockToken) {
        try {
            DefaultRedisScript<Long> script = new DefaultRedisScript<>(RELEASE_LOCK_LUA, Long.class);
            redisTemplate.execute(script, Collections.singletonList(lockKey), lockToken);
        } catch (Exception ignored) {
            // Gracefully ignore Redis errors on release — DB lock already released by commit
        }
    }
}
