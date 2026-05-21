package com.koncertify.engine;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "seats") // Tells PostgreSQL to create a table named "seats"
public class Seat {

    @Id // Marks this field as the unique Primary Key in the database
    private Long seatNumber;
    
    private boolean isBooked = false;

    public Seat() {}

    public Seat(Long seatNumber) {
        this.seatNumber = seatNumber;
    }

    public boolean bookSeat() {
        if (!this.isBooked) {
            this.isBooked = true;
            return true; // flip state
        }
        return false; 
    }

    public Long getSeatNumber() { return seatNumber; }
    public void setSeatNumber(Long seatNumber) { this.seatNumber = seatNumber; }

    public boolean isBooked() { return isBooked; }
    public void setBooked(boolean booked) { this.isBooked = booked; }
}