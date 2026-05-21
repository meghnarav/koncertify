package com.koncertify.engine;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private String confirmationCode;
    private LocalDateTime bookingTime;

    @ElementCollection
    @CollectionTable(name = "order_seats", joinColumns = @JoinColumn(name = "order_id"))
    private List<Long> bookedSeats;

    public Order() {}

    public Order(String userEmail, String confirmationCode, List<Long> bookedSeats) {
        this.userEmail = userEmail;
        this.confirmationCode = confirmationCode;
        this.bookedSeats = bookedSeats;
        this.bookingTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getConfirmationCode() { return confirmationCode; }
    public void setConfirmationCode(String confirmationCode) { this.confirmationCode = confirmationCode; }

    public LocalDateTime getBookingTime() { return bookingTime; }
    public void setBookingTime(LocalDateTime bookingTime) { this.bookingTime = bookingTime; }

    public List<Long> getBookedSeats() { return bookedSeats; }
    public void setBookedSeats(List<Long> bookedSeats) { this.bookedSeats = bookedSeats; }
}