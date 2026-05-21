package com.koncertify.engine;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(EventService eventService, EventRepository eventRepository) {
        return args -> {
            if (eventRepository.count() == 0) { // Only initialize if there are no events yet
                eventService.createEvent(
                    "Koncertify Summer Fest 2026", 
                    LocalDateTime.now().plusMonths(1), 
                    1250
                ); // Creates the event and its 1,250 linked seats
                System.out.println("--- Event and 1,250 Seats Initialized ---");
            }
        };
    }
}