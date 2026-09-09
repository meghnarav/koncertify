package com.koncertify.engine;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false, unique = true)
    private String confirmationCode;

    @Column(nullable = false)
    private LocalDateTime bookingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PAID;

    @Column(nullable = true)
    private String paymentIntentId;

    @Column(nullable = true, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_seats", joinColumns = @JoinColumn(name = "order_id"))
    @Column(name = "seat_id", nullable = false)
    private List<Long> bookedSeats;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = true)
    @JsonIgnoreProperties({"seats", "hibernateLazyInitializer", "handler"})
    private Event event;

    public Order() {}

    public Order(String userEmail, String confirmationCode, List<Long> bookedSeats) {
        this.userEmail = userEmail;
        this.confirmationCode = confirmationCode;
        this.bookedSeats = bookedSeats;
        this.bookingTime = LocalDateTime.now();
        this.status = OrderStatus.PAID;
    }

    public Long getId() { return id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getConfirmationCode() { return confirmationCode; }
    public void setConfirmationCode(String confirmationCode) { this.confirmationCode = confirmationCode; }

    public LocalDateTime getBookingTime() { return bookingTime; }
    public void setBookingTime(LocalDateTime bookingTime) { this.bookingTime = bookingTime; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getPaymentIntentId() { return paymentIntentId; }
    public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public List<Long> getBookedSeats() { return bookedSeats; }
    public void setBookedSeats(List<Long> bookedSeats) { this.bookedSeats = bookedSeats; }

    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
}