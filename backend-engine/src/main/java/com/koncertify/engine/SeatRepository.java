package com.koncertify.engine;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    // Used by BookingController
    long countByIsBookedFalse();
    
    // Used by DashboardController
    long countByEventIdAndIsBookedFalse(Long eventId);
}