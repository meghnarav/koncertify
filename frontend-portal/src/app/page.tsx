"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>("checking...");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Safely reads the Next.js environment variable, or falls back to the absolute URL string
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://koncertify-backend.onrender.com";

    // Ensures clean joins regardless of whether the base URL has a trailing slash
    const targetUrl = baseUrl.endsWith("/") 
      ? `${baseUrl}actuator/health` 
      : `${baseUrl}/actuator/health`;

    fetch(targetUrl)
      .then((res) => (res.ok ? setBackendStatus("CONNECTED") : setBackendStatus("ERROR")))
      .catch(() => setBackendStatus("OFFLINE"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12">
      {/* Header Panel */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Koncertify Dashboard</h1>
          <p className="text-slate-400 mt-1">Backend Engine Status & Control Panel</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-sm font-medium text-slate-300">Engine API:</span>
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
            backendStatus === "CONNECTED" 
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" 
              : backendStatus === "OFFLINE"
              ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
              : "bg-rose-500/10 text-rose-400 ring-rose-500/20"
          }`}>
            {loading ? "checking..." : backendStatus}
          </span>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Card 1 */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Bookings</h3>
          <p className="text-4xl font-semibold text-white mt-2">0</p>
          <div className="text-xs text-slate-500 mt-1">Sourced from relational database mapping</div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Available Seats</h3>
          <p className="text-4xl font-semibold text-white mt-2">1,250</p>
          <div className="text-xs text-slate-500 mt-1">Real-time cache allocation tracking</div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">System Throughput</h3>
          <p className="text-4xl font-semibold text-white mt-2">Stable</p>
          <div className="text-xs text-slate-500 mt-1">Actuator monitor threshold connection</div>
        </div>

        {/* Interactive Action Workspace */}
        <div className="md:col-span-3 bg-slate-800/50 p-8 rounded-xl border border-slate-700/60 text-center py-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-white mb-2">Initialize Booking Engine Workspace</h2>
            <p className="text-sm text-slate-400 mb-6">
              Connect core entity controllers to begin processing live transaction rows and seat map states.
            </p>
            <button 
              onClick={() => alert("Connecting API pipeline module...")}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Configure API Routes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}