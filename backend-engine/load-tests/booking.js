import http from "k6/http";
import { Counter } from "k6/metrics";

export const success = new Counter("success");
export const conflicts = new Counter("conflicts");
export const serverErrors = new Counter("server_errors");

export default function () {

    const seat = (__VU % 100) + 1;

    const res = http.post(
        "http://localhost:10000/api/bookings",
        JSON.stringify({
            email: `user${__VU}@mail.com`,
            seatNums: [seat]
        }),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    if (res.status === 200)
        success.add(1);

    else if (
        res.status === 400 &&
        res.body.includes("already booked")
    )
        conflicts.add(1);

    else
        serverErrors.add(1);
}