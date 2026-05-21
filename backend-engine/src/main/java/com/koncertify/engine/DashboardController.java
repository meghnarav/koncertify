package com.koncertify.engine;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SeatRepository seatRepository;

    @GetMapping("/stats")
    public Map<String, Long> getDashboardStats() {
        return Map.of(
            "activeBookings", orderRepository.count(),
            "availableSeats", seatRepository.countByIsBookedFalse()
        );
    }
}