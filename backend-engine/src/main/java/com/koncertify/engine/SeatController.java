package com.koncertify.engine;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional; 
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "https://koncert-ify.vercel.app", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST})
public class SeatController {

    @Autowired
    private SeatRepository seatRepository;

    // Fetch all seats (booked and available) so the dashboard counts metrics correctly
    @GetMapping
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    // Handles the booking sequence securely via the Row ID
    @PostMapping("/{id}/book")
    public String bookSeat(@PathVariable Long id) {
        return seatRepository.findById(id)
            .map(seat -> {
                if (seat.bookSeat()) { 
                    seatRepository.save(seat); // Persists isBooked = true to the database
                    return "Seat " + seat.getSeatNumber() + " successfully booked!";
                } else {
                    return "Seat " + seat.getSeatNumber() + " is already booked.";
                }
            })
            .orElse("Seat ID " + id + " not found.");
    }

    // Fixed endpoint: Bulk reset specific IDs
    @PostMapping("/reset-bulk")
    public ResponseEntity<String> resetSeatsBulk(@RequestBody List<Long> seatIds) {
        List<Seat> seatsToReset = seatRepository.findAllById(seatIds);
        
        for (Seat seat : seatsToReset) {
            seat.setBooked(false); // Using your exact entity field name 'booked' matching your DB schema
        }
        
        seatRepository.saveAll(seatsToReset);
        return ResponseEntity.ok("Seats " + seatIds + " have been successfully reset to available.");
    }

    // Added endpoint: Clear every seat instantly from the frontend button
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
    @Transactional // ◄ Forces "All or Nothing". Any exception rolls back the whole batch.
    public ResponseEntity<String> bookSeatsBulk(@RequestBody List<Long> seatIds) {
        List<Seat> requestedSeats = seatRepository.findAllById(seatIds);

        // Validation check 1: Ensure all IDs provided match actual records
        if (requestedSeats.size() != seatIds.size()) {
            throw new RuntimeException("Booking failed: One or more requested Seat IDs do not exist.");
        }

        // Validation check 2: Check if ANY seat in the batch is already booked
        for (Seat seat : requestedSeats) {
            if (seat.isBooked()) { // Adjust to your entity's boolean check method if different
                throw new RuntimeException("Transaction aborted: Seat " + seat.getSeatNumber() + " is already taken.");
            }
        }

        // Action: If all are clear, book them all safely
        for (Seat seat : requestedSeats) {
            seat.setBooked(true);
        }
        
        seatRepository.saveAll(requestedSeats);
        return ResponseEntity.ok("Successfully reserved all requested seats: " + seatIds);
    }
}