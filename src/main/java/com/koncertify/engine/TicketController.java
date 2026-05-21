package com.koncertify.engine;
import org.springframework.web.bind.annotation.*;
import java.util.Optional; 

@RestController
@RequestMapping("/tickets")
public class TicketController{
    private final SeatRepository seatRepository;

    public TicketController(SeatRepository seatRepository){
        this.seatRepository = seatRepository;
    }

    @PostMapping("/book")
    public String purchaseTicket(@RequestParam Long seatNum){
        Optional<Seat> optionalSeat = seatRepository.findById(seatNum);
        Seat seat;

        if(optionalSeat.isPresent()) {
            seat = optionalSeat.get();
        } else {
            seat = new Seat(seatNum);
        }

        boolean success = seat.bookSeat();

        if(success){
            seatRepository.save(seat);
            return "Success: Seat " + seatNum + " has been locked and saved into the database!";
        } else {
            return "Error: Seat " + seatNum + " is already booked by another user.";
        } 
    }
}


