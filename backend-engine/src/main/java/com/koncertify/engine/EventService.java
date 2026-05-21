package com.koncertify.engine;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private SeatRepository seatRepository;

    @Transactional
    public Event createEvent(String title, LocalDateTime date, int seatCount) {
        Event event = new Event(title, date);
        event = eventRepository.save(event);

        // Inside EventService.java
        for (int i = 1; i <= seatCount; i++) {
            // Example: Number "1", Label "S-1"
            Seat seat = new Seat(String.valueOf(i), "S-" + i, event); 
            seatRepository.save(seat);
        }
    }
}