package com.koncertify.engine;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/seats")
public class SeatController {

    @Autowired
    private SeatRepository seatRepository;

    @GetMapping
    public List<Seat> getAllSeats() {
        // If your database is empty, generate a few test seats 
        if (seatRepository.count() == 0) {
            seatRepository.save(new Seat(1L));
            seatRepository.save(new Seat(2L));
            seatRepository.save(new Seat(3L));
        }
        return seatRepository.findAll();
    }

    @org.springframework.web.bind.annotation.PostMapping("/{seatNumber}/book")
    public String bookSeat(@org.springframework.web.bind.annotation.PathVariable Long seatNumber) {
        return seatRepository.findById(seatNumber)
            .map(seat -> {
                if (seat.bookSeat()) { 
                    seatRepository.save(seat); // Saves the updated state 
                    return "Seat " + seatNumber + " successfully booked!";
                } else {
                    return "Seat " + seatNumber + " is already booked.";
                }
            })
            .orElse("Seat " + seatNumber + " not found.");
    }
}