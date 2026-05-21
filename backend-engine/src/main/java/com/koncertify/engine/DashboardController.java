package com.koncertify.engine;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SeatRepository seatRepository;

    @GetMapping("/stats/{eventId}")
    public Map<String, Long> getEventStats(@PathVariable Long eventId) {
        return Map.of(
            "totalBookings", orderRepository.countByEventId(eventId),
            "availableSeats", seatRepository.countByEvent_IdAndIsBookedFalse(eventId)
        );
    }
}