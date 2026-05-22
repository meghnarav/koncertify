package com.koncertify.engine;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "https://koncert-ify.vercel.app") // Crucial: Keeps your dashboard endpoints uniform
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