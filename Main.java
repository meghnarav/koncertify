class Seat{
    int seatNumber;
    boolean isBooked = false;

    public Seat(int number){
        this.seatNumber = number;
    }

    public void bookSeat(){
        if(!isBooked){
                isBooked=true;
                System.out.println("Seat booked successfully");

        } else{
            System.out.println("Seat already booked");
        }
    } 
}


class Section{
    String sectionName;
    Seat[] seats;

    public Section(String name, int numberOfSeats){
        this.sectionName = name;
        this.seats = new Seat[numberOfSeats];

        for (int i = 0; i < numberOfSeats; i++) {
            seats[i] = new Seat(i + 1); // Seat numbers will go from 1 to numberOfSeats
        }
    }

    public void requestBooking(int seatNumber){
        int targetIndex = seatNumber - 1;

        if(targetIndex<0 || targetIndex>=seats.length){
            System.out.println("Error: Seat " + seatNumber + " does not exist in section " + sectionName);
            return;
        } 
        
        seats[targetIndex].bookSeat();
    }
}

public class Main{
    public static void main(String[] args){
        System.out.println("Initializing Koncertify local logic...\n");

        Section vipSection = new Section ("Platinum VIP", 25);

        System.out.println("--- Attempting Transaction 1 ---");
        vipSection.requestBooking(3);

        System.out.println();

        System.out.println("--- Attempting Transaction 2 (Race Condition Test) ---");
        vipSection.requestBooking(3);
    }
}




