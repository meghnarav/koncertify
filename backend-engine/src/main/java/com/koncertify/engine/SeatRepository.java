package com.koncertify.engine;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByEventId(Long eventId);
    Optional<Seat> findByIdAndEventId(Long id, Long eventId);
    long countByEventIdAndIsBookedFalse(Long eventId);
}