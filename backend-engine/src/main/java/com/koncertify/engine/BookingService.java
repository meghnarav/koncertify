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
    private final StringRedisTemplate redisTemplate;

    private static final String RELEASE_LOCK_LUA =
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

    public BookingService(SeatRepository seatRepository, OrderRepository orderRepository, StringRedisTemplate redisTemplate) {
        this.seatRepository = seatRepository;
        this.orderRepository = orderRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public Order processBooking(BookingRequest request) {
        if (request.getSeatNums() == null || request.getSeatNums().isEmpty()) {
            throw new IllegalArgumentException("No seats requested for booking.");
        }

        // 1. Sort seat IDs numerically to guarantee deterministic lock acquisition
        List<Long> sortedSeatNums = request.getSeatNums().stream()
                .filter(Objects::nonNull)
                .sorted()
                .distinct()
                .toList();

        List<String> acquiredLockKeys = new ArrayList<>();
        String lockToken = UUID.randomUUID().toString();

        try {
            // Redis Distributed Lock pre-validation
            for (Long seatNum : sortedSeatNums) {
                String lockKey = "lock:seat:" + seatNum;
                boolean locked = acquireRedisLockWithFallback(lockKey, lockToken, Duration.ofSeconds(10));
                if (locked) {
                    acquiredLockKeys.add(lockKey);
                } else {
                    throw new RuntimeException("CONCURRENCY CONFLICT DETECTED: Seat ID " + seatNum + " is locked by another transaction.");
                }
            }

            // 2. Acquire PostgreSQL Pessimistic Write Lock in deterministic sorted order
            List<Seat> seats = seatRepository.findAllByIdWithLock(sortedSeatNums);

            if (seats.size() != sortedSeatNums.size()) {
                throw new RuntimeException("CONCURRENCY CONFLICT DETECTED: One or more requested seat IDs do not exist.");
            }

            for (Seat seat : seats) {
                if (seat.isBooked()) {
                    throw new RuntimeException("CONCURRENCY CONFLICT DETECTED: Seat " + seat.getSeatNumber() + " (ID: " + seat.getId() + ") is already booked.");
                }
                seat.setBooked(true);
            }

            seatRepository.saveAll(seats);

            String confirmationCode = "KNC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty()) 
                    ? request.getEmail() 
                    : "fan-" + confirmationCode.toLowerCase() + "@koncertify.io";

            Order order = new Order(email, confirmationCode, sortedSeatNums);
            return orderRepository.save(order);

        } finally {
            // Safe release of Redis locks via Lua Script matching unique ownership token
            for (String lockKey : acquiredLockKeys) {
                releaseRedisLockSafe(lockKey, lockToken);
            }
        }
    }

    private boolean acquireRedisLockWithFallback(String lockKey, String lockToken, Duration ttl) {
        try {
            Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, lockToken, ttl);
            return Boolean.TRUE.equals(success);
        } catch (Exception e) {
            // Fallback cleanly to DB pessimistic locking if Redis connection fails or is unavailable
            return true;
        }
    }

    private void releaseRedisLockSafe(String lockKey, String lockToken) {
        try {
            DefaultRedisScript<Long> script = new DefaultRedisScript<>(RELEASE_LOCK_LUA, Long.class);
            redisTemplate.execute(script, Collections.singletonList(lockKey), lockToken);
        } catch (Exception ignored) {
            // Gracefully ignore Redis errors on release
        }
    }
}