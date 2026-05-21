package com.koncertify.engine;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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
    @Transactional
    public String purchaseTickets(@RequestParam List<Long> seatNums) {
        List<String> acquiredLocks = new ArrayList<>();

        try {
            for (Long seatNum : seatNums) {
                String lockKey = "lock:seat:" + seatNum;
                Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", Duration.ofSeconds(10));
                
                if (success != null && success) {
                    acquiredLocks.add(lockKey);
                } else {
                    throw new RuntimeException("Seat " + seatNum + " is currently processing in another queue.");
                }
            }

            for (Long seatNum : seatNums) {
                Optional<Seat> optionalSeat = seatRepository.findById(seatNum);
                Seat seat = optionalSeat.orElseGet(() -> new Seat(seatNum));

                boolean isStateFlipped = seat.bookSeat();

                if (!isStateFlipped) {
                    throw new RuntimeException("Seat " + seatNum + " is already permanently booked.");
                }

                seatRepository.save(seat);
            }

            return "Success: Seats " + seatNums + " have been successfully reserved!";

        } catch (RuntimeException e) {
            throw e; 
        } finally {
            for (String lockKey : acquiredLocks) {
                redisTemplate.delete(lockKey);
            }
        }
    }
}