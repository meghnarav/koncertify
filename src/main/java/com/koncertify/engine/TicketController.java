package com.koncertify.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets")
public class TicketController {

    private final BookingService bookingService;

    public TicketController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/book")
    public ResponseEntity<?> purchaseTickets(@RequestBody BookingRequest request) {
        try {
            // Delegate request directly to the transactional business service layer
            Order completedOrder = bookingService.processBooking(request);
            return ResponseEntity.ok(completedOrder);
        } catch (RuntimeException e) {
            // Return clean error messages back to the client console
            return ResponseEntity.badRequest().body("Transaction Aborted: " + e.getMessage());
        }
    }
}