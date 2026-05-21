"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>("checking...");
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({ activeBookings: 0, availableSeats: 0 });

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://koncertify-backend.onrender.com";

    // Call 1: Health
    fetch(`${baseUrl}/api/health`)
      .then((res) => (res.ok ? setBackendStatus("CONNECTED") : setBackendStatus("ERROR")))
      .catch(() => setBackendStatus("OFFLINE"))
      .finally(() => setLoading(false));

    // Call 2: Summary
    fetch(`${baseUrl}/api/bookings/summary`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Summary data:", data);
        setStats(data);
      })
      .catch((err) => console.error("Summary fetch error:", err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Koncertify Command Center</h1>
          <p className="text-slate-400 mt-1">Live Transaction Monitor & Seat Operations</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-sm font-medium text-slate-300">Engine API:</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${backendStatus === "CONNECTED" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            {loading ? "checking..." : backendStatus}
          </span>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 uppercase">Active Bookings</h3>
          <p className="text-4xl font-semibold text-white mt-2">{stats.activeBookings}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 uppercase">Available Seats</h3>
          <p className="text-4xl font-semibold text-white mt-2">{stats.availableSeats}</p>
        </div>
      </main>
    </div>
  );
}