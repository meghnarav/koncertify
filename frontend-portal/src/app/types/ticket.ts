export interface Seat {
  id: number;
  isBooked: boolean;
}

export interface BookingRequest {
  email: string;
  seatNums: number[];
}

export interface OrderConfirmation {
  id: number;
  userEmail: string;
  confirmationCode: string;
  bookedSeats: number[];
  bookingTime: string;
}

export interface ErrorDetails {
  timestamp: string;
  message: string;
  details: string;
}