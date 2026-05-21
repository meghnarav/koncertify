package com.koncertify.engine;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Order, Long> {
    // JpaRepository provides count() automatically
}