package com.koncertify.engine;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"https://koncert-ify.vercel.app", "http://localhost:3000"})
public class EventController {

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    // GET /api/events -> Returns all active concerts
    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    // GET /api/events/{id} -> Returns details for a specific concert
    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));
    }
}