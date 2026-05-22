"use client";

import React, { useState, useEffect } from "react";

interface DashboardStats {
  activeBookings: number;
  availableSeats: number;
}

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>("checking...");
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({ activeBookings: 0, availableSeats: 0 });
  
  const [seatInput, setSeatInput] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://koncertify-backend.onrender.com";

  const fetchMetrics = () => {
    fetch(`${baseUrl}/api/bookings/summary?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data) {
          setStats({
            activeBookings: data.activeBookings ?? data.active_bookings ?? 0,
            availableSeats: data.availableSeats ?? data.available_seats ?? 0
          });
        }
      })
      .catch((err) => {
        console.error("Dashboard failed to refresh live metrics:", err.message);
      });
  };

  useEffect(() => {
    fetch(`${baseUrl}/api/health`)
      .then((res) => (res.ok ? setBackendStatus("CONNECTED") : setBackendStatus("ERROR")))
      .catch(() => setBackendStatus("OFFLINE"))
      .finally(() => setLoading(false));

    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatInput.trim()) return;

    setIsProcessing(true);
    setActionMessage(null);

    const idsToBook = seatInput
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (idsToBook.length === 0) {
      setActionMessage({ text: "Please enter valid numeric seat IDs.", isError: true });
      setIsProcessing(false);
      return;
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
        setActionMessage({ 
          text: messageText.includes("Transaction aborted") 
            ? messageText 
            : "Transaction rolled back. One or more seats were already taken.", 
          isError: true 
        });
      }
      fetchMetrics();
    } catch (err) {
      setActionMessage({ text: "Network layout routing error during atomic request.", isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetSystem = async () => {
    if (!window.confirm("Are you sure you want to trigger an administrative reset on all seats?")) return;

    setIsProcessing(true);
    setActionMessage(null);

    try {
      // Corrected Fetch Call: No payload body, custom header alignment
      const res = await fetch(`${baseUrl}/api/seats/reset-all`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      const messageText = await res.text();

      if (res.ok) {
        setActionMessage({ text: messageText, isError: false });
      } else {
        setActionMessage({ 
          text: messageText || `Reset dropped with status error: ${res.status}`, 
          isError: true 
        });
      }
      fetchMetrics();
    } catch (err) {
      setActionMessage({ text: "Network issue contacting bulk reset route.", isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Koncertify Command Center</h1>
          <p className="text-slate-400 mt-1">Live Transaction Monitor & Seat Operations (Auto-refreshing)</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <span className="text-sm font-medium text-slate-300">Engine API:</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
            backendStatus === "CONNECTED" 
              ? "bg-emerald-500/10 text-emerald-400" 
              : backendStatus === "checking..." 
              ? "bg-amber-500/10 text-amber-400" 
              : "bg-rose-500/10 text-rose-400"
          }`}>
            {loading ? "checking..." : backendStatus}
          </span>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mb-10">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Bookings</h3>
          <p className="text-4xl font-semibold text-white mt-2">
            {stats.activeBookings.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Available Seats</h3>
          <p className="text-4xl font-semibold text-white mt-2">
            {stats.availableSeats.toLocaleString()}
          </p>
        </div>
      </main>

      <section className="max-w-4xl bg-slate-800/50 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Operations Deck</h2>
        
        <form onSubmit={handleBookingSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Book Seat ID(s) <span className="text-xs text-slate-500">(Separate multiple IDs with commas)</span>
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g. 1, 2, 3"
                value={seatInput}
                onChange={(e) => setSeatInput(e.target.value)}
                disabled={isProcessing}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-sky-600 hover:bg-sky-500 text-white font-medium px-5 py-2 rounded-lg transition dynamic-button disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Book Seats"}
              </button>
            </div>
          </div>
        </form>

        {actionMessage && (
          <div className={`mt-4 p-3 text-sm rounded-lg border max-w-xl ${
            actionMessage.isError 
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}>
            {actionMessage.text}
          </div>
        )}

        <hr className="border-slate-800 my-6" />

        <div>
          <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-400 mb-4">Reset operational variables and restore total system availability parameters.</p>
          <button
            onClick={handleResetSystem}
            disabled={isProcessing}
            className="bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 text-rose-400 font-medium px-4 py-2 rounded-lg transition text-sm disabled:opacity-50"
          >
            Reset All Seats
          </button>
        </div>
      </section>
    </div>
  );
}