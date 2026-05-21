package com.koncertify.engine;

import java.util.List;

public class BookingRequest {
    private String email;
    private List<Long> seatNums;

    public BookingRequest() {}

    public BookingRequest(String email, List<Long> seatNums) {
        this.email = email;
        this.seatNums = seatNums;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public List<Long> getSeatNums() { return seatNums; }
    public void setSeatNums(List<Long> seatNums) { this.seatNums = seatNums; }
}