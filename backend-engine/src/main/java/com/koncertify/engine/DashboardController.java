package com.koncertify.engine;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
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
            "activeBookings", seatRepository.countByEventIdAndIsBookedTrue(eventId),
            "availableSeats", seatRepository.countByEventIdAndIsBookedFalse(eventId),
            "totalOrders", bookingRepository.count()
        );
    }

    @GetMapping("/summary")
    public Map<String, Long> getSummary() {
        return Map.of(
            "activeBookings", seatRepository.countByIsBookedTrue(),
            "availableSeats", seatRepository.countByIsBookedFalse(),
            "totalOrders", bookingRepository.count()
        );
    }
}