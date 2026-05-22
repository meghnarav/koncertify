package com.koncertify.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "https://koncert-ify.vercel.app") // Crucial: Allows your Vercel frontend to read this data
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
    public ResponseEntity<Order> bookTickets(@RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.processBooking(request));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> getDashboardSummary() {
        Map<String, Long> summary = new HashMap<>();
        summary.put("activeBookings", bookingRepository.count());
        summary.put("availableSeats", seatRepository.countByIsBookedFalse());
        
        return ResponseEntity.ok(summary);
    }
}