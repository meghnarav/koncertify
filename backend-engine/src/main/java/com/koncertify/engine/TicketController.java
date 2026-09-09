package com.koncertify.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Secondary booking entry-point at /tickets/book.
 * Delegates entirely to BookingService — same atomicity guarantees as /api/bookings.
 */
@RestController
@RequestMapping("/tickets")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class TicketController {

    private final BookingService bookingService;

    public TicketController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/book")
    public ResponseEntity<?> purchaseTickets(@RequestBody BookingRequest request) {
        try {
            Order completedOrder = bookingService.processBooking(request);
            return ResponseEntity.ok(completedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
