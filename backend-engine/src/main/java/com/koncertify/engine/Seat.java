package com.koncertify.engine;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "seats")
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seat_number", nullable = false)
    private String seatNumber;

    @Column(name = "seat_label", nullable = true) 
    private String seatLabel;
    
    @Column(name = "is_booked", nullable = false)
    @JsonProperty("isBooked") // Forces Jackson to output "isBooked" in JSON
    private boolean isBooked = false;

    @ManyToOne
    @JoinColumn(name = "event_id")
    @JsonIgnoreProperties("seats")
    private Event event;

    public Seat() {}

    public Seat(String seatNumber, String seatLabel, Event event) {
        this.seatNumber = seatNumber;
        this.seatLabel = seatLabel;
        this.event = event;
        this.isBooked = false;
    }

    public boolean bookSeat() {
        if (!this.isBooked) {
            this.isBooked = true;
            return true;
        }
        return false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }
    
    public String getSeatLabel() { return seatLabel; }
    public void setSeatLabel(String seatLabel) { this.seatLabel = seatLabel; }
    
    public boolean isBooked() { return isBooked; }
    public void setBooked(boolean booked) { this.isBooked = booked; }
    
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
}