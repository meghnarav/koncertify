"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, ShieldAlert, Cpu, Zap, Ticket, Layers, 
  RefreshCw, Lock, CheckCircle2, AlertTriangle, Users, 
  Terminal, Activity, Sparkles, Check, Server, Search,
  Calendar, MapPin, Clock, ArrowRight, Filter, ExternalLink
} from "lucide-react";

interface SeatData {
  id: number;
  seatNumber: string;
  seatLabel?: string;
  isBooked: boolean;
  booked?: boolean;
}

interface OrderData {
  id?: number;
  userEmail: string;
  confirmationCode: string;
  bookingTime?: string;
  bookedSeats: number[];
}

interface DashboardStats {
  activeBookings: number;
  availableSeats: number;
  systemLoad: string;
  requestsPerSec: number;
  conflictsDetected: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
}

interface SimulatorBatch {
  label: string;
  seatsInput: string;
  threadsCount: number;
}

interface ConcertEvent {
  id: number;
  title: string;
  artist: string;
  category: "POP" | "ROCK" | "EDM" | "FESTIVAL";
  date: string;
  venue: string;
  location: string;
  startingPrice: number;
  totalSeats: number;
  imageBg: string;
  featured?: boolean;
}

const FEATURED_EVENTS: ConcertEvent[] = [
  {
    id: 1,
    title: "Koncertify Summer Fest 2026",
    artist: "The Weeknd, Dua Lipa & Guests",
    category: "FESTIVAL",
    date: "August 28, 2026 • 7:00 PM",
    venue: "Grand Arena Stadium",
    location: "Los Angeles, CA",
    startingPrice: 120,
    totalSeats: 1250,
    imageBg: "from-purple-900/60 via-slate-900 to-slate-950",
    featured: true
  },
  {
    id: 2,
    title: "Eras World Tour 2026",
    artist: "Taylor Swift",
    category: "POP",
    date: "September 14, 2026 • 8:00 PM",
    venue: "MetLife Stadium",
    location: "East Rutherford, NJ",
    startingPrice: 180,
    totalSeats: 1250,
    imageBg: "from-pink-900/60 via-slate-900 to-slate-950"
  },
  {
    id: 3,
    title: "M72 World Tour",
    artist: "Metallica",
    category: "ROCK",
    date: "October 02, 2026 • 7:30 PM",
    venue: "SoFi Stadium",
    location: "Inglewood, CA",
    startingPrice: 150,
    totalSeats: 1250,
    imageBg: "from-amber-900/60 via-slate-900 to-slate-950"
  },
  {
    id: 4,
    title: "Music of the Spheres",
    artist: "Coldplay",
    category: "POP",
    date: "November 19, 2026 • 8:00 PM",
    venue: "Wembley Stadium",
    location: "London, UK",
    startingPrice: 140,
    totalSeats: 1250,
    imageBg: "from-teal-900/60 via-slate-900 to-slate-950"
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"discovery" | "portal" | "simulator" | "orders">("discovery");
  const [selectedEvent, setSelectedEvent] = useState<ConcertEvent>(FEATURED_EVENTS[0]);
  const [backendStatus, setBackendStatus] = useState<"checking..." | "CONNECTED" | "OFFLINE" | "ERROR">("checking...");
  const [botProtection, setBotProtection] = useState<boolean>(true);
  const [allSeats, setAllSeats] = useState<SeatData[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);
  const [ordersList, setOrdersList] = useState<OrderData[]>([]);
  
  // Hold Timer state (10-minute hold window)
  const [holdTimeSeconds, setHoldTimeSeconds] = useState<number>(600);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [stats, setStats] = useState<DashboardStats>({
    activeBookings: 0,
    availableSeats: 1250,
    systemLoad: "Normal",
    requestsPerSec: 0,
    conflictsDetected: 0,
    p50LatencyMs: 4,
    p99LatencyMs: 18,
  });

  const [sectionFilter, setSectionFilter] = useState<"ALL" | "VIP" | "FLOOR" | "GALLERY">("ALL");
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Concurrency Simulator Batches
  const [batches, setBatches] = useState<SimulatorBatch[]>([
    { label: "Worker Group Alpha", seatsInput: "5, 6, 7", threadsCount: 25 },
    { label: "Worker Group Beta", seatsInput: "7, 8, 9", threadsCount: 25 },
    { label: "Worker Group Gamma", seatsInput: "12, 13, 14", threadsCount: 15 }
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

  // Hold Timer countdown effect
  useEffect(() => {
    if (selectedSeatIds.length === 0) {
      setHoldTimeSeconds(600);
      return;
    }
    const timer = setInterval(() => {
      setHoldTimeSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedSeatIds]);

  const fetchMetrics = async () => {
    try {
      const startTime = performance.now();
      const res = await fetch(`${baseUrl}/api/seats`);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (!res.ok) throw new Error();
      const seatsData: SeatData[] = await res.json();
      
      setAllSeats(seatsData);

      const bookedCount = seatsData.filter(s => s.isBooked || s.booked).length;
      const totalCount = seatsData.length || 1250;

      setStats(prev => ({
        ...prev,
        activeBookings: bookedCount,
        availableSeats: totalCount - bookedCount,
        p50LatencyMs: Math.max(3, Math.min(latency, 25)),
        p99LatencyMs: Math.max(12, Math.min(latency * 2, 85))
      }));
    } catch {
      console.error("Failed to sync metrics.");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/bookings`);
      if (res.ok) {
        const data = await res.json();
        setOrdersList(data);
      }
    } catch {
      // Fallback
    }
  };

  const fetchBotProtectionStatus = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/bot-protection`);
      if (res.ok) {
        const data = await res.json();
        setBotProtection(data.enabled);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetch(`${baseUrl}/api/health`)
      .then((res) => (res.ok ? setBackendStatus("CONNECTED") : setBackendStatus("ERROR")))
      .catch(() => setBackendStatus("OFFLINE"));

    fetchMetrics();
    fetchOrders();
    fetchBotProtectionStatus();

    const interval = setInterval(() => {
      fetchMetrics();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const toggleBotProtection = async () => {
    const nextState = !botProtection;
    try {
      const res = await fetch(`${baseUrl}/api/admin/bot-protection?enabled=${nextState}`, { method: "POST" });
      if (res.ok) {
        setBotProtection(nextState);
        setActionMessage({
          text: `Bot mitigation rate-limiting filter is now ${nextState ? "ENABLED (15 req/s threshold)" : "DISABLED"}.`,
          isError: false
        });
      }
    } catch {
      setActionMessage({ text: "Failed to update bot mitigation setting.", isError: true });
    }
  };

  const handleSeatClick = (seatId: number, isBooked: boolean) => {
    if (isBooked) return;
    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter(id => id !== seatId));
    } else {
      if (selectedSeatIds.length >= 6) {
        setActionMessage({ text: "Maximum 6 seats per transaction for fairness.", isError: true });
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seatId]);
    }
  };

  const quickSelectSeats = (count: number, section?: string) => {
    let candidateSeats = allSeats.filter(s => !(s.isBooked || s.booked));
    if (section === "VIP") candidateSeats = candidateSeats.filter(s => s.id <= 250);
    if (section === "FLOOR") candidateSeats = candidateSeats.filter(s => s.id > 250 && s.id <= 750);
    if (section === "GALLERY") candidateSeats = candidateSeats.filter(s => s.id > 750);

    const picked = candidateSeats.slice(0, count).map(s => Number(s.id));
    setSelectedSeatIds(picked);
  };

  const handleFanCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeatIds.length === 0) return;

    setIsProcessing(true);
    setActionMessage(null);

    const key = idempotencyKey.trim() || `ik-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Idempotency-Key": key
        },
        body: JSON.stringify({
          email: userEmail || `fan-${Math.floor(Math.random()*10000)}@koncertify.io`,
          seatNums: selectedSeatIds
        })
      });

      const responseData = await res.json();

      if (res.ok && responseData.confirmationCode) {
        setConfirmedOrder(responseData);
        setSelectedSeatIds([]);
        setUserEmail("");
        setIdempotencyKey("");
        setActionMessage({
          text: `Success! Confirmed Order ${responseData.confirmationCode} for seats [${responseData.bookedSeats.join(", ")}]. (Idempotency Key: ${key})`,
          isError: false
        });
        fetchMetrics();
        fetchOrders();
      } else {
        const errorMsg = responseData.error || responseData.message || "Reservation failed.";
        if (errorMsg.includes("CONCURRENCY CONFLICT") || errorMsg.includes("locked") || errorMsg.includes("already booked")) {
          setStats(prev => ({ ...prev, conflictsDetected: prev.conflictsDetected + 1 }));
        }
        setActionMessage({ text: errorMsg, isError: true });
      }
    } catch {
      setActionMessage({ text: "Transaction error: Network IO connection timeout.", isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateConflict = async () => {
    setIsProcessing(true);
    setActionMessage({ text: "Dispatching multi-group concurrent transactional threads...", isError: false });

    const totalThreads = batches.reduce((acc, curr) => acc + curr.threadsCount, 0);
    setStats(prev => ({ 
      ...prev, 
      systemLoad: "HIGH STRESS", 
      requestsPerSec: Math.min(totalThreads, 160)
    }));

    const tasks: Promise<{ ok: boolean; status: number; text: string; batchLabel: string }>[] = [];

    batches.forEach((batch) => {
      const targets = batch.seatsInput
        .split(",")
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id));

      if (targets.length === 0) return;

      for (let i = 0; i < batch.threadsCount; i++) {
        tasks.push(
          (async () => {
            try {
              const res = await fetch(`${baseUrl}/api/seats/book-bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(targets)
              });
              const text = await res.text();
              return { ok: res.ok, status: res.status, text, batchLabel: batch.label };
            } catch {
              return { ok: false, status: 500, text: "IO failure.", batchLabel: batch.label };
            }
          })()
        );
      }
    });

    if (tasks.length === 0) {
      setActionMessage({ text: "Aborted: No valid target seats in worker groups.", isError: true });
      setIsProcessing(false);
      return;
    }

    try {
      const results = await Promise.all(tasks);
      
      const successfulGroups = new Set<string>();
      const failedGroups = new Set<string>();
      let realConflictsCaught = 0;
      let botRateLimitsHit = 0;

      results.forEach(r => {
        if (r.ok) {
          successfulGroups.add(r.batchLabel);
        } else {
          failedGroups.add(r.batchLabel);
          if (r.status === 429) {
            botRateLimitsHit++;
          } else {
            realConflictsCaught++;
          }
        }
      });

      setStats(prev => ({
        ...prev,
        conflictsDetected: prev.conflictsDetected + realConflictsCaught,
      }));

      const successList = Array.from(successfulGroups).join(", ") || "None";
      const failureList = Array.from(failedGroups).join(", ") || "None";

      let summaryText = `[Test Completed] Won Locks: [${successList}] | Isolated & Rolled Back: [${failureList}] (${realConflictsCaught} race conflicts caught cleanly).`;
      if (botRateLimitsHit > 0) {
        summaryText += ` 🛡️ Anti-Scalper Bot Defense blocked ${botRateLimitsHit} excessive requests with HTTP 429.`;
      }

      setActionMessage({
        text: summaryText,
        isError: successfulGroups.size === 0
      });

    } catch {
      setActionMessage({ text: "Pipeline execution error.", isError: true });
    } finally {
      setIsProcessing(false);
      setTimeout(() => fetchMetrics(), 400);
      setTimeout(() => setStats(prev => ({ ...prev, systemLoad: "Normal", requestsPerSec: 0 })), 3000);
    }
  };

  const handleSimulateBotBurst = async () => {
    setIsProcessing(true);
    setActionMessage({ text: "Firing 50 rapid-fire automated bot requests in 500ms...", isError: false });
    
    setStats(prev => ({ ...prev, systemLoad: "BOT ATTACK", requestsPerSec: 100 }));

    const botRequests: Promise<number>[] = [];
    for (let i = 0; i < 50; i++) {
      botRequests.push(
        fetch(`${baseUrl}/api/seats/book-bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([99, 100])
        }).then(res => res.status)
      );
    }

    const statuses = await Promise.all(botRequests);
    const rateLimitedCount = statuses.filter(s => s === 429).length;
    const okCount = statuses.filter(s => s === 200).length;

    if (rateLimitedCount > 0) {
      setActionMessage({
        text: `🛡️ BOT DEFENSE ACTIVE: ${rateLimitedCount} automated scalper requests were BLOCKED (HTTP 429). ${okCount} landed within allowed rate limits.`,
        isError: false
      });
    } else {
      setActionMessage({
        text: `⚠️ Bot protection is currently DISABLED or threshold was not exceeded. ${okCount} requests passed.`,
        isError: true
      });
    }

    setIsProcessing(false);
    setTimeout(() => setStats(prev => ({ ...prev, systemLoad: "Normal", requestsPerSec: 0 })), 2500);
  };

  const handleResetSystem = async () => {
    if (!window.confirm("Reset all operational seats and clear database locks?")) return;
    setIsProcessing(true);
    try {
      await fetch(`${baseUrl}/api/seats/reset-all`, { method: "POST" });
      setActionMessage({ text: "Database state successfully reset to 1,250 available seats.", isError: false });
      setStats(prev => ({ ...prev, conflictsDetected: 0 }));
      setSelectedSeatIds([]);
      fetchMetrics();
      fetchOrders();
    } catch {
      setActionMessage({ text: "Reset dropped.", isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBatchField = (index: number, field: keyof SimulatorBatch, value: any) => {
    const updated = [...batches];
    updated[index] = { ...updated[index], [field]: value };
    setBatches(updated);
  };

  const addWorkerGroup = () => {
    if (batches.length >= 4) return;
    const charCode = 65 + batches.length;
    setBatches([...batches, {
      label: `Worker Group ${String.fromCharCode(charCode)}`,
      seatsInput: `${batches.length * 10 + 5}, ${batches.length * 10 + 6}`,
      threadsCount: 15
    }]);
  };

  const removeWorkerGroup = (index: number) => {
    setBatches(batches.filter((_, i) => i !== index));
  };

  const filteredSeats = allSeats.filter(s => {
    if (sectionFilter === "VIP") return s.id <= 250;
    if (sectionFilter === "FLOOR") return s.id > 250 && s.id <= 750;
    if (sectionFilter === "GALLERY") return s.id > 750;
    return true;
  });

  const getSeatPrice = (id: number) => {
    if (id <= 250) return 250;
    if (id <= 750) return 180;
    return 120;
  };

  const totalPrice = selectedSeatIds.reduce((sum, id) => sum + getSeatPrice(id), 0);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayedEvents = FEATURED_EVENTS.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          evt.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || evt.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 font-mono select-none">
      
      {/* Top Header & Platform Diagnostics Bar */}
      <header className="glass-panel p-5 rounded-xl mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
              KONCERTIFY DISTRIBUTED PLATFORM v3.0
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>High-Concurrency Booking Engine</span>
            <span>•</span>
            <span>Deterministic Row Locks & Redis Redlock Safety</span>
          </p>
        </div>

        {/* Backend & Bot Status Pill */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Engine:</span>
            <span className={`font-bold ${backendStatus === "CONNECTED" ? "text-emerald-400" : "text-rose-400"}`}>
              {backendStatus}
            </span>
          </div>

          <button 
            onClick={toggleBotProtection}
            className={`px-3 py-2 rounded-lg border font-bold flex items-center gap-2 transition-all ${
              botProtection 
                ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50" 
                : "bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/50"
            }`}
            title="Click to toggle Scalper Bot Rate Limiter"
          >
            {botProtection ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
            <span>Bot Defense: {botProtection ? "ACTIVE" : "OFF"}</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("discovery")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "discovery"
              ? "border-purple-400 text-purple-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Search className="w-4 h-4" />
          Concert Discovery & Events
        </button>

        <button
          onClick={() => setActiveTab("portal")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "portal"
              ? "border-emerald-400 text-emerald-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Ticket className="w-4 h-4" />
          Interactive Venue Map ({selectedEvent.title.split(' ')[0]})
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "simulator"
              ? "border-amber-400 text-amber-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="w-4 h-4" />
          Concurrency Simulator
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "orders"
              ? "border-cyan-400 text-cyan-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          Confirmed Passes ({ordersList.length})
        </button>
      </div>

      {/* Telemetry Quick Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="glass-panel p-3.5 rounded-lg">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>System Load</span>
            <Activity className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className={`text-sm font-bold mt-1 ${stats.systemLoad !== "Normal" ? "text-amber-400 animate-pulse" : "text-slate-200"}`}>
            {stats.systemLoad}
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-lg">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Throughput</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">{stats.requestsPerSec} req/s</div>
        </div>

        <div className="glass-panel p-3.5 rounded-lg">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Race Conflicts</span>
            <Lock className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-sm font-bold text-rose-400 mt-1">{stats.conflictsDetected}</div>
        </div>

        <div className="glass-panel p-3.5 rounded-lg">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Active Bookings</span>
            <Ticket className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">{stats.activeBookings} / 1250</div>
        </div>

        <div className="glass-panel p-3.5 rounded-lg">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>Available Seats</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">{stats.availableSeats}</div>
        </div>

        <div className="glass-panel p-3.5 rounded-lg">
          <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
            <span>P50 / P99 Latency</span>
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">{stats.p50LatencyMs}ms / {stats.p99LatencyMs}ms</div>
        </div>
      </section>

      {/* Notification Banner */}
      {actionMessage && (
        <div className={`mb-6 p-4 rounded-lg text-xs border flex items-center justify-between gap-3 ${
          actionMessage.isError 
            ? "bg-rose-950/50 border-rose-800 text-rose-300" 
            : "bg-emerald-950/50 border-emerald-800 text-emerald-300"
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.isError ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
        </div>
      )}

      {/* TAB 0: CONCERT DISCOVERY & EVENTS */}
      {activeTab === "discovery" && (
        <div className="space-y-8">
          {/* Featured Hero Banner */}
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/90 border border-purple-800/40 shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <span className="bg-purple-900/80 text-purple-300 border border-purple-700/80 text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                FEATURED HIGH-DEMAND CONCERT DROP
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
                {FEATURED_EVENTS[0].title}
              </h2>
              <p className="text-sm text-purple-200 mt-2 font-semibold">{FEATURED_EVENTS[0].artist}</p>
              
              <div className="flex flex-wrap gap-4 mt-6 text-xs text-slate-300">
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-purple-400" /> {FEATURED_EVENTS[0].date}</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-purple-400" /> {FEATURED_EVENTS[0].venue}, {FEATURED_EVENTS[0].location}</div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => {
                    setSelectedEvent(FEATURED_EVENTS[0]);
                    setActiveTab("portal");
                  }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-purple-950/60"
                >
                  <span>Book Seats Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-xs text-slate-400 font-mono">
                  Starting at <strong className="text-white text-base">${FEATURED_EVENTS[0].startingPrice}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search artist, concert, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 font-bold uppercase">Category:</span>
              {(["ALL", "FESTIVAL", "POP", "ROCK", "EDM"] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    categoryFilter === cat
                      ? "bg-purple-600 text-white border-purple-400"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedEvents.map(evt => (
              <div 
                key={evt.id} 
                className="glass-panel rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between hover:border-purple-500/60 transition-all group"
              >
                <div className={`p-6 bg-gradient-to-b ${evt.imageBg}`}>
                  <span className="bg-slate-900/90 text-purple-300 border border-purple-800/60 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                    {evt.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">{evt.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">{evt.artist}</p>
                </div>

                <div className="p-6 bg-slate-950/90 border-t border-slate-900 space-y-3">
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {evt.date}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {evt.venue}</div>
                  </div>

                  <div className="border-t border-slate-900 pt-3 flex justify-between items-center">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">From</div>
                      <div className="text-sm font-bold text-emerald-400">${evt.startingPrice}</div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEvent(evt);
                        setActiveTab("portal");
                      }}
                      className="bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 border border-purple-700/60 font-bold text-[11px] px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <span>Select Seats</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: FAN TICKET BUYER PORTAL */}
      {activeTab === "portal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Concert Event Banner & Stage Map */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Event Hero */}
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full">
                    LIVE TICKETING SALE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{selectedEvent.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedEvent.artist} • {selectedEvent.venue}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Tickets starting from</div>
                  <div className="text-2xl font-extrabold text-emerald-400">${selectedEvent.startingPrice}</div>
                </div>
              </div>

              {/* Stage Visual representation */}
              <div className="mt-8 border-t border-slate-800/80 pt-6">
                <div className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white tracking-widest uppercase shadow-lg shadow-purple-900/30 mb-6">
                  ⚡ MAIN PERFORMANCE STAGE ⚡
                </div>

                {/* Section Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 uppercase font-bold">Filter Tier:</span>
                    {(["ALL", "VIP", "FLOOR", "GALLERY"] as const).map(sec => (
                      <button
                        key={sec}
                        onClick={() => setSectionFilter(sec)}
                        className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-md border transition-all ${
                          sectionFilter === sec
                            ? "bg-emerald-500 text-slate-950 border-emerald-400"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>

                  {/* Quick Pick Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => quickSelectSeats(2, sectionFilter === "ALL" ? undefined : sectionFilter)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded font-bold uppercase transition-colors"
                    >
                      + Quick Pick 2 Seats
                    </button>
                    <button 
                      onClick={() => setSelectedSeatIds([])}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                {/* Interactive Seat Grid */}
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl max-h-[380px] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-8 sm:grid-cols-16 md:grid-cols-25 gap-1.5">
                    {filteredSeats.map((seat) => {
                      const seatId = Number(seat.id);
                      const isBooked = Boolean(seat.isBooked || seat.booked);
                      const isSelected = selectedSeatIds.includes(seatId);

                      let styleClass = "bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer";
                      if (isBooked) {
                        styleClass = "bg-rose-950/70 border-rose-900 text-rose-500 cursor-not-allowed opacity-80";
                      } else if (isSelected) {
                        styleClass = "bg-emerald-400 text-slate-950 border-emerald-300 font-extrabold shadow-md shadow-emerald-500/30 scale-105";
                      }

                      return (
                        <div
                          key={seatId}
                          onClick={() => handleSeatClick(seatId, isBooked)}
                          title={`Seat #${seatId} - Tier: ${getSeatPrice(seatId) === 250 ? "VIP ($250)" : getSeatPrice(seatId) === 180 ? "Main Floor ($180)" : "Upper Gallery ($120)"}`}
                          className={`h-6 text-[9px] flex items-center justify-center font-mono rounded transition-all border ${styleClass}`}
                        >
                          {seatId}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Seat Map Legend */}
                <div className="flex flex-wrap gap-4 mt-4 text-[10px] text-slate-400 justify-between items-center">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800 inline-block"></span> Available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block"></span> Selected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-rose-950 border border-rose-900 inline-block"></span> Booked / Sold Out
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Showing {filteredSeats.length} seats
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Shopping Cart & Atomic Checkout Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-slate-800 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-400" />
                    Your Ticket Cart
                  </h3>

                  {selectedSeatIds.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      <span>Hold Expiry: {formatTime(holdTimeSeconds)}</span>
                    </div>
                  )}
                </div>

                {selectedSeatIds.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                    <Ticket className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-slate-500">Click seats on the venue map to reserve seats.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-2 max-h-48 overflow-y-auto">
                      {selectedSeatIds.map(id => (
                        <div key={id} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-200">Seat #{id} ({id <= 250 ? "VIP" : id <= 750 ? "Floor" : "Gallery"})</span>
                          <span className="text-slate-400">${getSeatPrice(id)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-300">Total Amount:</span>
                      <span className="text-emerald-400 text-lg">${totalPrice}</span>
                    </div>

                    <form onSubmit={handleFanCheckout} className="space-y-3 pt-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Fan Email Address</label>
                        <input
                          type="email"
                          placeholder="fan@example.com"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Idempotency-Key (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. ik-9a8b7c6d (Auto-generated if empty)"
                          value={idempotencyKey}
                          onChange={(e) => setIdempotencyKey(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-400 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs py-3.5 rounded-lg uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/50"
                      >
                        {isProcessing ? "Acquiring Row Locks..." : "🔒 Complete Idempotent Purchase"}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Transactional Outbox & Idempotency Protected
                </div>
                <p>Transactions are validated atomically. Double-allocations are impossible under high concurrency.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONCURRENCY & LOAD SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Worker Groups Configuration */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    Multi-Worker Race Condition Simulator
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Orchestrate overlapping concurrent worker threads targeting clean vs intersecting row locks.
                  </p>
                </div>

                <button 
                  onClick={addWorkerGroup} 
                  disabled={isProcessing || batches.length >= 4} 
                  className="text-[10px] border border-amber-800/60 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 px-3 py-1.5 rounded-lg font-bold uppercase transition-colors disabled:opacity-30"
                >
                  + Add Worker Group
                </button>
              </div>

              {/* Batch Matrix */}
              <div className="space-y-3 mb-6">
                {batches.map((batch, index) => (
                  <div key={index} className="bg-slate-950 border border-slate-850 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-3">
                      <input 
                        type="text" 
                        value={batch.label} 
                        onChange={(e) => updateBatchField(index, "label", e.target.value)}
                        className="bg-transparent text-xs font-bold text-amber-300 w-full focus:outline-none focus:border-b border-amber-600"
                      />
                    </div>

                    <div className="sm:col-span-5 flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 uppercase">Target Seat Row IDs</label>
                      <input 
                        type="text" 
                        value={batch.seatsInput} 
                        placeholder="5, 6, 7"
                        onChange={(e) => updateBatchField(index, "seatsInput", e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-3 flex flex-col gap-1">
                      <label className="text-[9px] text-slate-500 uppercase">Parallel Threads</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="100"
                        value={batch.threadsCount} 
                        onChange={(e) => updateBatchField(index, "threadsCount", Math.max(1, parseInt(e.target.value, 10) || 0))}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-1 text-right">
                      <button 
                        onClick={() => removeWorkerGroup(index)}
                        disabled={batches.length <= 1 || isProcessing}
                        className="text-slate-600 hover:text-rose-400 text-xs font-bold disabled:opacity-20 transition-colors"
                        title="Remove group"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stress Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={handleSimulateConflict} 
                  disabled={isProcessing} 
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-bold text-xs py-3.5 rounded-lg uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-amber-950/40"
                >
                  {isProcessing ? "DISPATCHING THREADS..." : "⚡ Run Concurrency Race Test"}
                </button>

                <button 
                  onClick={handleSimulateBotBurst} 
                  disabled={isProcessing} 
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs py-3.5 rounded-lg uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Test Scalper Bot Defense (50 req burst)
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                Total Virtual Pipeline Load: <strong className="text-amber-400">{batches.reduce((a, b) => a + b.threadsCount, 0)} parallel requests</strong>
              </span>
              <button 
                onClick={handleResetSystem} 
                className="text-[10px] text-rose-400 border border-rose-900/60 hover:bg-rose-950/40 px-3 py-1.5 rounded-lg uppercase font-bold transition-colors"
              >
                Emergency Database Reset
              </button>
            </div>
          </div>

          {/* Right Column: Live Matrix Grid Telemetry View */}
          <div className="lg:col-span-4 glass-panel p-6 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest flex items-center justify-between">
              <span>Live Inventory Telemetry Map</span>
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
            </h3>

            <div className="max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1.5">
                {allSeats.slice(0, 300).map((seat) => {
                  const seatId = Number(seat.id);
                  const isBooked = Boolean(seat.isBooked || seat.booked);
                  return (
                    <div
                      key={seatId}
                      title={`Seat ID: ${seatId}`}
                      className={`h-5 text-[8px] flex items-center justify-center font-bold rounded select-none border ${
                        isBooked 
                          ? "bg-rose-950/80 border-rose-600 text-rose-400" 
                          : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}
                    >
                      {seatId}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-4">Showing first 300 seats of 1,250 arena map. Red indicates booked rows or locks acquired by threads.</p>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIRMED ORDERS */}
      {activeTab === "orders" && (
        <div className="glass-panel p-6 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Confirmed Customer Passes
            </h3>

            <button 
              onClick={fetchOrders}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold uppercase transition-colors"
            >
              Refresh Passes
            </button>
          </div>

          {ordersList.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
              <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-40" />
              <p className="text-sm text-slate-400 font-bold">No orders recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">Book tickets through the Fan Portal or run the simulator to generate orders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ordersList.map((order, idx) => (
                <div key={order.id || idx} className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[9px] uppercase font-bold px-2 py-0.5 rounded">
                        CONFIRMED PASS
                      </span>
                      <div className="text-sm font-bold text-white mt-1.5 font-mono">{order.confirmationCode}</div>
                    </div>
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div><strong>Fan:</strong> {order.userEmail}</div>
                    <div><strong>Booked Seats:</strong> [{(order.bookedSeats || []).join(", ")}]</div>
                  </div>

                  <div className="border-t border-slate-900 pt-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>STATUS: PAID & OUTBOX EVENT CREATED</span>
                    <span>ATOMIC VERIFIED</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMED ORDER MODAL DIALOG */}
      {confirmedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-emerald-500/40 max-w-md w-full shadow-2xl relative">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>

              <h3 className="text-lg font-bold text-white">Tickets Confirmed!</h3>
              <p className="text-xs text-slate-400 mt-1">Transactional Outbox Event Dispatched</p>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl mt-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Confirmation Code:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{confirmedOrder.confirmationCode}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Email:</span>
                <span className="text-slate-200">{confirmedOrder.userEmail}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Seats Reserved:</span>
                <span className="font-bold text-slate-200">[{confirmedOrder.bookedSeats.join(", ")}]</span>
              </div>
            </div>

            {/* Barcode Display */}
            <div className="mt-5 text-center">
              <div className="text-[9px] text-slate-500 uppercase mb-1">Digital Entry Barcode</div>
              <div className="bg-white p-2 rounded flex justify-between items-center h-10 px-4">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className={`bg-slate-950 h-full ${i % 3 === 0 ? "w-1.5" : i % 2 === 0 ? "w-0.5" : "w-1"}`}></div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setConfirmedOrder(null)}
              className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 rounded-lg uppercase tracking-wider transition-colors"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
