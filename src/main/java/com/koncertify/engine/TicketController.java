package com.koncertify.engine;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
import java.util.Optional;

@RestController
@RequestMapping("/tickets")
public class TicketController {

    private final SeatRepository seatRepository;
    private final StringRedisTemplate redisTemplate;

    public TicketController(SeatRepository seatRepository, StringRedisTemplate redisTemplate) {
        this.seatRepository = seatRepository;
        this.redisTemplate = redisTemplate;
    }

    @PostMapping("/book")
    public String purchaseTicket(@RequestParam Long seatNum) {
        String lockKey = "lock:seat:" + seatNum;

        Boolean lockAcquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", Duration.ofSeconds(10));

        if (lockAcquired == null || !lockAcquired) {
            return "Error: Transaction Failed. Seat " + seatNum + " is currently processing in another user's checkout queue.";
        }

        try {
            Optional<Seat> optionalSeat = seatRepository.findById(seatNum);
            Seat seat;

            if (optionalSeat.isPresent()) {
                seat = optionalSeat.get();
            } else {
                seat = new Seat(seatNum);
            }

            boolean success = seat.bookSeat();

            if (success) {
                seatRepository.save(seat);
                return "Success: Seat " + seatNum + " has been locked, verified, and saved to the database!";
            } else {
                return "Error: Seat " + seatNum + " is already completely booked.";
            }

        } finally {
            redisTemplate.delete(lockKey);
        }
    }
}