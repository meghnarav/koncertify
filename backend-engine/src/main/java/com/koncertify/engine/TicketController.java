package com.koncertify.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets")
@CrossOrigin(origins = "http://localhost:3000") 
public class TicketController {
    private final BookingService bookingService;

    public TicketController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/book")
    public ResponseEntity<?> purchaseTickets(@RequestBody BookingRequest request) {
            Order completedOrder = bookingService.processBooking(request);
            return ResponseEntity.ok(completedOrder);
    }
}