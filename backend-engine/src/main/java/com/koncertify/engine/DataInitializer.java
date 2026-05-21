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
                for (long i = 1; i <= 1250; i++) {
                    seatRepository.save(new Seat(i));
                }
                System.out.println("--- 1,250 Seats Initialized ---");
            }
        };
    }
}