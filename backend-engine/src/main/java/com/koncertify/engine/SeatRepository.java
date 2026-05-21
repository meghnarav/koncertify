package com.koncertify.engine;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; 
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByEvent_Id(Long eventId);
    Optional<Seat> findByIdAndEvent_Id(Long id, Long eventId);
    long countByEvent_IdAndIsBookedFalse(Long eventId);
}