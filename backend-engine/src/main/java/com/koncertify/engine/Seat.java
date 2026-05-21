package com.koncertify.engine;

import jakarta.persistence.*;

@Entity
@Table(name = "seats")
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String seatLabel;
    
    private boolean isBooked = false;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    // Default constructor (required by JPA)
    public Seat() {}

    // Constructor used by SeatController (to find/manage existing seats)
    public Seat(Long id) {
        this.id = id;
    }

    // Constructor used by EventService (to create new seats)
    public Seat(String seatLabel, Event event) {
        this.seatLabel = seatLabel;
        this.event = event;
    }

    // Business Logic (needed by BookingService and SeatController)
    public boolean bookSeat() {
        if (!this.isBooked) {
            this.isBooked = true;
            return true;
        }
        return false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getSeatLabel() { return seatLabel; }
    public void setSeatLabel(String seatLabel) { this.seatLabel = seatLabel; }
    
    public boolean isBooked() { return isBooked; }
    public void setBooked(boolean booked) { this.isBooked = booked; }
    
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
}