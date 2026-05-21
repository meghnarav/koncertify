#!/bin/bash

echo "⚡ Starting Koncertify High-Concurrency Load Test..."
echo "Simulating 10 users attempting to book Seat 99 at the exact same millisecond..."
echo "--------------------------------------------------------------------------"

# Fire 10 simultaneous background curl requests to your live server targeting the same seat
for i in {1..10}
do
   curl -s -X POST "http://localhost:8080/tickets/book" \
        -H "Content-Type: application/json" \
        -d '{"email": "user'$i'@example.com", "seatNums": [99]}' \
        -w "\nUser $i Status Code: %{http_code}\n\n" &
done

# Wait for all background network requests to finish executing
wait
echo "--------------------------------------------------------------------------"
echo "Load Test Complete! Check your output. Exactly ONE user should receive a 200 Success status."
echo "The remaining 9 users should receive clean 400 Bad Request responses from your Redis Shield."