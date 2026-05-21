package com.koncertify.engine;

import jakarta.persistence.*;

@Entity
@Table(name = "seats")
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String seatLabel; // e.g., "A1", "B12"
    private boolean isBooked = false;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    public Seat() {}

    public Seat(String seatLabel, Event event) {
        this.seatLabel = seatLabel;
        this.event = event;
    }

    public Long getId() { return id; }
    public String getSeatLabel() { return seatLabel; }
    public void setSeatLabel(String seatLabel) { this.seatLabel = seatLabel; }
    public boolean isBooked() { return isBooked; }
    public void setBooked(boolean booked) { this.isBooked = booked; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
}