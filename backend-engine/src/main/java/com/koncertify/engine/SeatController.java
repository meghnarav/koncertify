package com.koncertify.engine;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "https://koncert-ify.vercel.app") // Enables your dashboard to fetch data safely
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
}