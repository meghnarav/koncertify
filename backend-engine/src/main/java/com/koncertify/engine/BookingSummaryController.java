package com.koncertify.engine;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "https://koncert-ify.vercel.app")
public class BookingSummaryController {

    @Autowired
    private SeatRepository seatRepository;

    @GetMapping("/summary")
    public BookingSummaryResponse getSummary() {
        long availableSeats = seatRepository.countByIsBookedFalse();
        
        long totalSeats = seatRepository.count();
        long activeBookings = totalSeats - availableSeats;
        
        return new BookingSummaryResponse(activeBookings, availableSeats);
    }
}