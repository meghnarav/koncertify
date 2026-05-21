#!/bin/bash
echo "⚡ Starting Koncertify High-Concurrency Load Test..."
for i in {1..10}
do
   curl -s -X POST "http://localhost:10000/api/bookings" \
        -H "Content-Type: application/json" \
        -d '{"email": "user'$i'@example.com", "seatNums": [99]}' \
        -w "\nUser $i Status Code: %{http_code}\n" &
done
wait