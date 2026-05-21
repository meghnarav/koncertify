    package com.koncertify.engine;

    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    @CrossOrigin(origins = {"http://localhost:3000", "https://koncert-ify.vercel.app"}) 
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
                Order completedOrder = bookingService.processBooking(request);
                return ResponseEntity.ok(completedOrder);
            } catch (RuntimeException e) {
                // This handles cases like "Seat already booked" or "Invalid seat number"
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }
    }