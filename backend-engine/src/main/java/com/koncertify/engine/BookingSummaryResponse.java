package com.koncertify.engine;

public class BookingSummaryResponse {
    private long activeBookings;
    private long availableSeats;

    public BookingSummaryResponse(long activeBookings, long availableSeats) {
        this.activeBookings = activeBookings;
        this.availableSeats = availableSeats;
    }

    public long getActiveBookings() { return activeBookings; }
    public void setActiveBookings(long activeBookings) { this.activeBookings = activeBookings; }

    public long getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(long availableSeats) { this.availableSeats = availableSeats; }
}