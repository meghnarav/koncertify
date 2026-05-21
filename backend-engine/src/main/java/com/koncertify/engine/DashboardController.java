package com.koncertify.engine;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;

    public DashboardController(SeatRepository seatRepository, BookingRepository bookingRepository) {
        this.seatRepository = seatRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/stats/{eventId}")
    public Map<String, Long> getStats(@PathVariable Long eventId) {
        return Map.of(
            "activeBookings", bookingRepository.count(),
            "availableSeats", seatRepository.countByEventIdAndIsBookedFalse(eventId)
        );
    }
}