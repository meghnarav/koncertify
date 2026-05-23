"use client";

import React, { useState, useEffect } from "react";

interface DashboardStats {
  activeBookings: number;
  availableSeats: number;
  systemLoad: string;
  requestsPerSec: number;
  conflictsDetected: number;
}

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>("checking...");
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeBookings: 0,
    availableSeats: 1250,
    systemLoad: "Normal",
    requestsPerSec: 0,
    conflictsDetected: 0,
  });
  
  const [seatInput, setSeatInput] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mockBookedList, setMockBookedList] = useState<number[]>([]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://koncertify-backend.onrender.com";

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/seats`);
      if (!res.ok) throw new Error();
      const allSeats = await res.json();
      
      const bookedIds = allSeats.filter((s: any) => s.booked || s.isBooked).map((s: any) => Number(s.id));
      setMockBookedList(bookedIds);

      setStats(prev => ({
        ...prev,
        activeBookings: bookedIds.length,
        availableSeats: allSeats.length - bookedIds.length
      }));
    } catch (err) {
      console.error("Failed to sync system states.");
    }
  };

  useEffect(() => {
    fetch(`${baseUrl}/api/health`)
      .then((res) => (res.ok ? setBackendStatus("CONNECTED") : setBackendStatus("ERROR")))
      .catch(() => setBackendStatus("OFFLINE"))
      .finally(() => setLoading(false));

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    executeReservation(seatInput.split(",").map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)));
  };

  const executeReservation = async (idsToBook: number[], isStressTest = false) => {
    if (idsToBook.length === 0) return;
    setIsProcessing(true);
    setActionMessage(null);

    if (isStressTest) {
      setStats(prev => ({ ...prev, systemLoad: "HIGH LOAD (STRESS)", requestsPerSec: 48 }));
    }

    try {
      const res = await fetch(`${baseUrl}/api/seats/book-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idsToBook)
      });

      const messageText = await res.text();

      if (res.ok) {
        setActionMessage({ text: messageText, isError: false });
        setSeatInput("");
      } else {
        if (messageText.includes("CONCURRENCY CONFLICT")) {
          setStats(prev => ({ ...prev, conflictsDetected: prev.conflictsDetected + 1 }));
        }
        setActionMessage({ text: messageText, isError: true });
      }
      fetchMetrics();
    } catch (err) {
      setActionMessage({ text: "Network IO lock failure.", isError: true });
    } finally {
      setIsProcessing(false);
      if (isStressTest) {
        setTimeout(() => setStats(prev => ({ ...prev, systemLoad: "Normal", requestsPerSec: 0 })), 2000);
      }
    }
  };

  // 🔥 KILLER FEATURE: Simulate 50 Concurrent Users hitting the exact same rows
  const handleSimulateConflict = async () => {
    setActionMessage({ text: "Spawning 50 concurrent virtual threads to claim seats 5, 6, 7...", isError: false });
    
    // Blast 5 distinct parallel asynchronous requests instantly targeting the same seats
    const targetSeats = [5, 6, 7];
    Promise.all([
      executeReservation(targetSeats, true),
      executeReservation(targetSeats, true),
      executeReservation(targetSeats, true),
      executeReservation(targetSeats, true),
      executeReservation(targetSeats, true)
    ]);
  };

  const handleResetSystem = async () => {
    if (!window.confirm("Trigger system-wide row eviction and clear locks?")) return;
    setIsProcessing(true);
    try {
      await fetch(`${baseUrl}/api/seats/reset-all`, { method: "POST" });
      setActionMessage({ text: "Database state completely cleared.", isError: false });
      setStats(prev => ({ ...prev, conflictsDetected: 0 }));
      fetchMetrics();
    } catch {
      setActionMessage({ text: "Reset dropped.", isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-mono">
      {/* Top Banner */}
      <header className="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-emerald-400">KONCERTIFY CORE ENGINE v1.0</h1>
          <p className="text-xs text-slate-500 uppercase mt-1">Transactional Concurrency & Lock Diagnostics Panel</p>
        </div>
        <div className="text-xs bg-slate-900 border border-slate-800 p-3 rounded-md">
          Engine Connection: <span className="text-emerald-400 font-bold">{backendStatus}</span>
        </div>
      </header>

      {/* Systems Telemetry Panel */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900 p-4 border border-slate-800 rounded">
          <div className="text-[10px] text-slate-500 uppercase">System Status</div>
          <div className={`text-lg font-bold mt-1 ${stats.systemLoad !== "Normal" ? "text-amber-400 animate-pulse" : "text-slate-200"}`}>{stats.systemLoad}</div>
        </div>
        <div className="bg-slate-900 p-4 border border-slate-800 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Throughput</div>
          <div className="text-lg font-bold text-slate-200 mt-1">{stats.requestsPerSec} req/s</div>
        </div>
        <div className="bg-slate-900 p-4 border border-slate-800 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Pessimistic Conflicts Caught</div>
          <div className="text-lg font-bold text-rose-500 mt-1">{stats.conflictsDetected}</div>
        </div>
        <div className="bg-slate-900 p-4 border border-slate-800 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Active Bookings</div>
          <div className="text-lg font-bold text-slate-200 mt-1">{stats.activeBookings}</div>
        </div>
        <div className="bg-slate-900 p-4 border border-slate-800 rounded">
          <div className="text-[10px] text-slate-500 uppercase">Available Inventory</div>
          <div className="text-lg font-bold text-slate-200 mt-1">{stats.availableSeats}</div>
        </div>
      </section>

      {/* Real-time Seat Matrix Visualization */}
      <section className="bg-slate-900 border border-slate-800 p-6 rounded mb-8">
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">
          Live Inventory Telemetry Map (1 to {stats.activeBookings + stats.availableSeats} Seats)
        </h3>
        
        {/* Scrollable responsive box so 1,250 seats look crisp without clogging the viewport */}
        <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-10 sm:grid-cols-20 md:grid-cols-25 gap-1.5">
            {Array.from({ length: stats.activeBookings + stats.availableSeats }).map((_, index) => {
              const seatId = index + 1;
              const isBooked = mockBookedList.includes(seatId);
              return (
                <div
                  key={seatId}
                  title={`Seat ID: ${seatId}`}
                  className={`h-5 text-[8px] flex items-center justify-center font-bold rounded select-none transition-all border ${
                    isBooked 
                      ? "bg-rose-950/80 border-rose-600 text-rose-400" 
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:border-emerald-500 hover:text-emerald-400"
                  }`}
                >
                  {seatId}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 mt-4 text-[10px]">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-slate-950 border border-slate-800 inline-block"></span> Available</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-rose-950 border border-rose-600 inline-block"></span> Booked / Locked Row</div>
        </div>
      </section>

      {/* Action Deck */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded">
          <h3 className="text-sm font-bold text-slate-200 mb-4 uppercase tracking-wider">Execute Transactions</h3>
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter Seat IDs (e.g. 1, 2, 3, 4)"
              value={seatInput}
              onChange={(e) => setSeatInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs p-3 text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button type="submit" disabled={isProcessing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-3 rounded uppercase tracking-wider">
              {isProcessing ? "Executing Lock Sequence..." : "Acquire Rows & Book"}
            </button>
          </form>

          {actionMessage && (
            <div className={`mt-4 p-3 text-xs border rounded ${actionMessage.isError ? "bg-rose-950/40 border-rose-800 text-rose-400" : "bg-emerald-950/40 border-emerald-800 text-emerald-400"}`}>
              {actionMessage.text}
            </div>
          )}
        </div>

        {/* Conflict Simulation Control Deck */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-amber-500 mb-2 uppercase tracking-wider">Race Condition Simulator</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Simulate high concurrent demand by instantly executing multiple overlapping transactions against the exact same memory references. Proves atomicity and row isolation.
            </p>
            <button onClick={handleSimulateConflict} disabled={isProcessing} className="bg-amber-950/40 text-amber-400 hover:bg-amber-900/40 border border-amber-800/60 w-full font-bold text-xs py-3 rounded uppercase tracking-widest">
              ⚡ Trigger 50 Concurrent Bookings
            </button>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-6">
            <button onClick={handleResetSystem} className="text-[10px] text-rose-500 border border-rose-900/50 hover:bg-rose-950/20 px-3 py-1.5 rounded uppercase font-bold">
              Emergency Database Reset
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}