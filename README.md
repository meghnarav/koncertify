# koncertify
> Concert ticketing designed to handle high concurrency and resist scalper bot abuse.


## Live Deployment:

### Frontend UI: 
Open [https://koncert-ify.vercel.app/](https://koncert-ify.vercel.app/)

### Spring Boot API Engine: 
Open [https://koncertify-backend.onrender.com/api/health](https://koncertify-backend.onrender.com/api/health)

---

## Why this exists

In 2022, Ticketmaster completely failed millions of Taylor Swift fans because their system couldn't handle the dual nightmare of massive traffic spikes and automated scalping bots.

Koncertify is built around the premise that this is an engineering problem, not an inevitability. Working toward a system that handles these problems correctly.

---

## Tech Stack
- <b>Backend:</b> Java 17 / Spring Boot 3 / Hibernate
- <b>Database:</b> PostgreSQL (with explicit pessimistic locking)
- <b>Caching & Queuing:</b> Redis
- <b>Frontend:</b> Next.js 14 / TypeScript / Tailwind CSS
- <b>Hosting:</b> Vercel (Frontend) & Render (Backend)

---

## Current Status & Roadmap
[x] Basic Spring Boot API infrastructure

[x] Atomic multi-row pessimistic validation endpoints

[x] Real-time visual seat matrix telemetry canvas

[x] Multi-group customizable worker simulator

[&nbsp;] Migrate booking ingress into memory-mapped Redis Distributed Locks (Redlock)

[&nbsp;] Stripe Payment Intent integration with webhook atomicity safety nets

[&nbsp;] Bot mitigation layer (Device fingerprinting & Cloudflare Turnstile verification)

---
<!--

## The Problem
High-demand concert ticketing breaks in two specific ways:
### 1. Scale failures
Systems collapse when hundreds of thousands of users hit simultaneously. Databases lock, queues fail, and tickets get oversold.

### 2. Bot exploitation
Automated buyers acquire tickets in milliseconds and resell at extreme markups. Real users lose access.
Both are solvable. Most ticketing platforms just haven't prioritised solving them.

---

## What Koncertify Aims to Solve
- **Atomic ticketing** — ensuring tickets are either fully booked or not at all, preventing double-sells  
- **Concurrency-safe queuing** — handling high simultaneous demand without system collapse  
- **Bot resistance** — rate limiting and behavioral checks to prioritize real users  
- **Load-tested design** — validating behavior under simulated high traffic  
---


## Architecture
`coming soon — architecture diagram` 

--- 


## Engineering Focus

- Concurrency control (optimistic vs pessimistic locking)
- Idempotent booking APIs
- Distributed queue design
- Failure handling under load
- Preventing race conditions in seat allocation

--- -->

## Quickstart
### 1. Clone the repo
```bash
git clone https://github.com/meghnarav/koncertify.git
cd koncertify
```

### 2. Run the Spring Boot Backend
Configure your database credentials inside `backend/src/main/resources/application.properties`, then run it:
```bash
cd backend
./mvnw spring-boot:run
```

### 3. Run the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Head to http://localhost:3000 to mess around with the concurrency playground locally.

<!-- ---

## Roadmap
- Atomic ticket reservation system
- Redis-based queue for high-demand events
- Payment flow with full atomicity guarantees
- Rate limiting and bot detection layer
- Device fingerprinting
- Load testing suite — 1000 concurrent users
- Clean booking UI
- Admin dashboard for event management -->

---

## Status
🚧 Active Development — Summer 2026

---


## Contributing
Open to collaborators. Especially interested in anyone with experience in distributed systems, payment infrastructure, or fraud detection.

---

## Copyright
Copyright (c) 2026 Meghna Ravikumar. All rights reserved. No part of this software may be reproduced or distributed without permission.
