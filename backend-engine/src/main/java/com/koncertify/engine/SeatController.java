package com.koncertify.engine;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional; 
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Objects;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST})
public class SeatController {

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private BookingService bookingService;

    // Fetch all seats (booked and available)
    @GetMapping
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    // Handles single seat booking
    @PostMapping("/{id}/book")
    public String bookSeat(@PathVariable Long id) {
        BookingRequest req = new BookingRequest();
        req.setSeatNums(List.of(id));
        try {
            Order order = bookingService.processBooking(req);
            return "Seat " + id + " successfully booked! Order: " + order.getConfirmationCode();
        } catch (Exception e) {
            return e.getMessage();
        }
    }

    // Bulk reset specific IDs
    @PostMapping("/reset-bulk")
    public ResponseEntity<String> resetSeatsBulk(@RequestBody List<Long> seatIds) {
        List<Seat> seatsToReset = seatRepository.findAllById(seatIds);
        
        for (Seat seat : seatsToReset) {
            seat.setBooked(false);
        }
        
        seatRepository.saveAll(seatsToReset);
        return ResponseEntity.ok("Seats " + seatIds + " have been successfully reset to available.");
    }

    // Clear every seat instantly
    @PostMapping("/reset-all")
    public ResponseEntity<String> resetAllSeats() {
        List<Seat> allSeats = seatRepository.findAll();
        
        for (Seat seat : allSeats) {
            seat.setBooked(false);
        }
        
        seatRepository.saveAll(allSeats);
        return ResponseEntity.ok("All operational seats reset back to base metrics successfully.");
    }

    @PostMapping("/book-bulk")
    @Transactional 
    public ResponseEntity<String> bookSeatsBulk(@RequestBody List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            return ResponseEntity.badRequest().body("No seat IDs provided.");
        }

        // Deterministic sorting to guarantee deadlock freedom
        List<Long> sortedSeatIds = seatIds.stream()
                .filter(Objects::nonNull)
                .sorted()
                .distinct()
                .toList();

        // Acquire explicit row-level locks in sorted numerical order
        List<Seat> requestedSeats = seatRepository.findAllByIdWithLock(sortedSeatIds);

        List<Long> foundIds = requestedSeats.stream().map(Seat::getId).toList();
        List<Long> invalidIds = sortedSeatIds.stream().filter(id -> !foundIds.contains(id)).toList();

        List<String> takenSeatNumbers = new ArrayList<>();
        for (Seat seat : requestedSeats) {
            if (seat.isBooked()) {
                takenSeatNumbers.add(seat.getSeatNumber());
            }
        }

        if (!invalidIds.isEmpty() || !takenSeatNumbers.isEmpty()) {
            StringBuilder errorReport = new StringBuilder("CONCURRENCY CONFLICT DETECTED: ");
            
            if (!invalidIds.isEmpty()) {
                errorReport.append("Seat IDs don't exist: ").append(invalidIds).append(". ");
            }
            if (!takenSeatNumbers.isEmpty()) {
                errorReport.append("Locked/Booked by another process: ").append(takenSeatNumbers).append(". ");
            }
            errorReport.append("Atomic rollback executed successfully.");
            
            return ResponseEntity.badRequest().body(errorReport.toString());
        }

        for (Seat seat : requestedSeats) {
            seat.setBooked(true);
        }
        
        seatRepository.saveAll(requestedSeats);
        return ResponseEntity.ok("ACQUIRED LOCK - Seats securely reserved: " + sortedSeatIds);
    }
}