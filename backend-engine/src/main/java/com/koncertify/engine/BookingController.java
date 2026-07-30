package com.koncertify.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;

    public BookingController(BookingService bookingService, 
                              BookingRepository bookingRepository, 
                              SeatRepository seatRepository) {
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.seatRepository = seatRepository;
    }

    @PostMapping
    public ResponseEntity<?> bookTickets(@RequestBody BookingRequest request) {
        try {
            Order order = bookingService.processBooking(request);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> getDashboardSummary() {
        Map<String, Long> summary = new HashMap<>();
        summary.put("activeBookings", seatRepository.countByIsBookedTrue());
        summary.put("availableSeats", seatRepository.countByIsBookedFalse());
        summary.put("totalOrders", bookingRepository.count());
        return ResponseEntity.ok(summary);
    }
}