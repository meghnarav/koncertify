package com.koncertify.engine;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner initDatabase(SeatRepository seatRepository) {
        return args -> {
            if (seatRepository.count() == 0) {
                for (int i = 1; i <= 1250; i++) {
                    Seat seat = new Seat();
                    seat.setReserved(false); // Initially, all seats are free
                    seatRepository.save(seat);
                }
                System.out.println("--- 1,250 Seats Initialized ---");
            }
        };
    }
}