package com.koncertify.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class SeatController {

    private final SeatRepository seatRepository;
    private final BookingService bookingService;

    public SeatController(SeatRepository seatRepository, BookingService bookingService) {
        this.seatRepository = seatRepository;
        this.bookingService = bookingService;
    }

    /** Returns every seat (booked and available). */
    @GetMapping
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    /** Books a single seat via the full BookingService pipeline (Redis + DB locks). */
    @PostMapping("/{id}/book")
    public ResponseEntity<?> bookSeat(@PathVariable Long id) {
        BookingRequest req = new BookingRequest();
        req.setSeatNums(List.of(id));
        try {
            Order order = bookingService.processBooking(req);
            return ResponseEntity.ok(
                    "Seat " + id + " successfully booked! Order: " + order.getConfirmationCode());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Bulk-books seats for the concurrency simulator.
     * Routes through BookingService so Redis distributed locks and the transactional
     * outbox are honoured — previously this bypassed the Redis layer entirely.
     */
    @PostMapping("/book-bulk")
    public ResponseEntity<?> bookSeatsBulk(@RequestBody List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            return ResponseEntity.badRequest().body("No seat IDs provided.");
        }
        BookingRequest req = new BookingRequest();
        req.setSeatNums(seatIds);
        try {
            Order order = bookingService.processBooking(req);
            return ResponseEntity.ok("ACQUIRED LOCK - Seats securely reserved: " + order.getBookedSeats());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Resets a specific list of seats to available. */
    @PostMapping("/reset-bulk")
    public ResponseEntity<String> resetSeatsBulk(@RequestBody List<Long> seatIds) {
        List<Seat> seats = seatRepository.findAllById(seatIds);
        seats.forEach(s -> s.setBooked(false));
        seatRepository.saveAll(seats);
        return ResponseEntity.ok("Seats " + seatIds + " have been reset to available.");
    }

    /** Resets every seat in the database to available. */
    @PostMapping("/reset-all")
    public ResponseEntity<String> resetAllSeats() {
        List<Seat> allSeats = seatRepository.findAll();
        allSeats.forEach(s -> s.setBooked(false));
        seatRepository.saveAll(allSeats);
        return ResponseEntity.ok("All seats reset to available successfully.");
    }
}
