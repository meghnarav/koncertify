package com.koncertify.engine;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final SeatRepository seatRepository;
    private final OrderRepository orderRepository;
    private final StringRedisTemplate redisTemplate;

    public BookingService(SeatRepository seatRepository, OrderRepository orderRepository, StringRedisTemplate redisTemplate) {
        this.seatRepository = seatRepository;
        this.orderRepository = orderRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public Order processBooking(BookingRequest request) {
        List<String> acquiredLocks = new ArrayList<>();
        List<Long> seatNums = request.getSeatNums();

        try {
            for (Long seatNum : seatNums) {
                String lockKey = "lock:seat:" + seatNum;
                Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", Duration.ofSeconds(10));
                if (Boolean.TRUE.equals(success)) {
                    acquiredLocks.add(lockKey);
                } else {
                    throw new RuntimeException("Seat " + seatNum + " is currently locked.");
                }
            }

            for (Long seatNum : seatNums) {
                // Fetch the existing seat. If not found, throw error.
                Seat seat = seatRepository.findById(seatNum)
                        .orElseThrow(() -> new RuntimeException("Seat " + seatNum + " does not exist."));

                if (!seat.bookSeat()) {
                    throw new RuntimeException("Seat " + seatNum + " is already booked.");
                }
                seatRepository.save(seat);
            }

            String confirmationCode = "KNC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Order order = new Order(request.getEmail(), confirmationCode, seatNums);
            return orderRepository.save(order);

        } finally {
            for (String lockKey : acquiredLocks) {
                redisTemplate.delete(lockKey);
            }
        }
    }
}