"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, ShieldAlert, Cpu, Zap, Ticket, Layers,
  RefreshCw, Lock, CheckCircle2, AlertTriangle, Activity,
  Sparkles, Check, Server, Search, Calendar, MapPin,
  Clock, ArrowRight, Filter, ChevronRight, Music2,
  TrendingUp, Users, Star, Globe, BarChart3, X,
  Plus, Minus, Wifi, WifiOff, RotateCcw, FlameKindling,
  Bot, ShieldBan, Receipt, BadgeCheck,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */
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
  gradient: string;
  accentColor: string;
  featured?: boolean;
}

/* ─── Data ───────────────────────────────────────────────────── */
const EVENTS: ConcertEvent[] = [
  {
    id: 1,
    title: "Summer Fest 2026",
    artist: "The Weeknd, Dua Lipa & Guests",
    category: "FESTIVAL",
    date: "Aug 28, 2026 · 7:00 PM",
    venue: "Grand Arena Stadium",
    location: "Los Angeles, CA",
    startingPrice: 120,
    totalSeats: 1250,
    gradient: "linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #0f172a 100%)",
    accentColor: "#a78bfa",
    featured: true,
  },
  {
    id: 2,
    title: "Eras World Tour 2026",
    artist: "Taylor Swift",
    category: "POP",
    date: "Sep 14, 2026 · 8:00 PM",
    venue: "MetLife Stadium",
    location: "East Rutherford, NJ",
    startingPrice: 180,
    totalSeats: 1250,
    gradient: "linear-gradient(135deg, #3b0764 0%, #be185d 50%, #0f172a 100%)",
    accentColor: "#f9a8d4",
  },
  {
    id: 3,
    title: "M72 World Tour",
    artist: "Metallica",
    category: "ROCK",
    date: "Oct 02, 2026 · 7:30 PM",
    venue: "SoFi Stadium",
    location: "Inglewood, CA",
    startingPrice: 150,
    totalSeats: 1250,
    gradient: "linear-gradient(135deg, #1c0a00 0%, #92400e 50%, #0f172a 100%)",
    accentColor: "#fbbf24",
  },
  {
    id: 4,
    title: "Music of the Spheres",
    artist: "Coldplay",
    category: "POP",
    date: "Nov 19, 2026 · 8:00 PM",
    venue: "Wembley Stadium",
    location: "London, UK",
    startingPrice: 140,
    totalSeats: 1250,
    gradient: "linear-gradient(135deg, #022c22 0%, #0f766e 50%, #0f172a 100%)",
    accentColor: "#34d399",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  FESTIVAL: "badge-purple",
  POP: "badge-rose",
  ROCK: "badge-amber",
  EDM: "badge-cyan",
};

/* ─── Helpers ────────────────────────────────────────────────── */
const getSeatTier = (id: number): { label: string; price: number; color: string } => {
  if (id <= 250)  return { label: "VIP",     price: 250, color: "#a78bfa" };
  if (id <= 750)  return { label: "Floor",   price: 180, color: "#10b981" };
  return              { label: "Gallery", price: 120, color: "#94a3b8" };
};

const formatTimer = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

/* ─── Sub-components ─────────────────────────────────────────── */
function LiveDot({ color = "#10b981" }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

function StatCard({
  label, value, icon: Icon, accent = "#94a3b8", sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{label}</span>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="stat-value" style={{ color: accent === "#94a3b8" ? undefined : accent }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const [activeTab, setActiveTab] = useState<"discovery" | "portal" | "simulator" | "orders">("discovery");
  const [selectedEvent, setSelectedEvent] = useState<ConcertEvent>(EVENTS[0]);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [botProtection, setBotProtection] = useState(true);

  const [allSeats, setAllSeats] = useState<SeatData[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);
  const [ordersList, setOrdersList] = useState<OrderData[]>([]);

  const [holdSeconds, setHoldSeconds] = useState(600);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState<"ALL" | "VIP" | "FLOOR" | "GALLERY">("ALL");

  const [stats, setStats] = useState<DashboardStats>({
    activeBookings: 0,
    availableSeats: 1250,
    systemLoad: "Normal",
    requestsPerSec: 0,
    conflictsDetected: 0,
    p50LatencyMs: 4,
    p99LatencyMs: 18,
  });

  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [batches, setBatches] = useState<SimulatorBatch[]>([
    { label: "Worker Group Alpha", seatsInput: "5, 6, 7",   threadsCount: 25 },
    { label: "Worker Group Beta",  seatsInput: "7, 8, 9",   threadsCount: 25 },
    { label: "Worker Group Gamma", seatsInput: "12, 13, 14", threadsCount: 15 },
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

  /* ── Hold timer ── */
  useEffect(() => {
    if (selectedSeatIds.length === 0) { setHoldSeconds(600); return; }
    const t = setInterval(() => setHoldSeconds(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [selectedSeatIds]);

  /* ── Dismiss message after 8 s ── */
  useEffect(() => {
    if (!actionMessage) return;
    const t = setTimeout(() => setActionMessage(null), 8000);
    return () => clearTimeout(t);
  }, [actionMessage]);

  /* ── Data fetching ── */
  const fetchMetrics = useCallback(async () => {
    try {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/api/seats`);
      const latency = Math.round(performance.now() - t0);
      if (!res.ok) throw new Error();
      const seats: SeatData[] = await res.json();
      setAllSeats(seats);
      const booked = seats.filter(s => s.isBooked || s.booked).length;
      const total = seats.length || 1250;
      setStats(p => ({
        ...p,
        activeBookings: booked,
        availableSeats: total - booked,
        p50LatencyMs: Math.max(3, Math.min(latency, 30)),
        p99LatencyMs: Math.max(10, Math.min(latency * 2, 90)),
      }));
    } catch { /* silent */ }
  }, [baseUrl]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/bookings`);
      if (res.ok) setOrdersList(await res.json());
    } catch { /* silent */ }
  }, [baseUrl]);

  const fetchBotStatus = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/bot-protection`);
      if (res.ok) setBotProtection((await res.json()).enabled);
    } catch { /* silent */ }
  }, [baseUrl]);

  useEffect(() => {
    fetch(`${baseUrl}/api/health`)
      .then(r => setBackendStatus(r.ok ? "online" : "offline"))
      .catch(() => setBackendStatus("offline"));
    fetchMetrics();
    fetchOrders();
    fetchBotStatus();
    const interval = setInterval(fetchMetrics, 3500);
    return () => clearInterval(interval);
  }, [baseUrl, fetchMetrics, fetchOrders, fetchBotStatus]);

  /* ── Actions ── */
  const toggleBotProtection = async () => {
    const next = !botProtection;
    try {
      const res = await fetch(`${baseUrl}/api/admin/bot-protection?enabled=${next}`, { method: "POST" });
      if (res.ok) {
        setBotProtection(next);
        setActionMessage({
          text: `Bot defense rate-limiter is now ${next ? "ENABLED (15 req/s threshold)" : "DISABLED"}.`,
          type: next ? "success" : "warning",
        });
      }
    } catch {
      setActionMessage({ text: "Failed to update bot protection setting.", type: "error" });
    }
  };

  const handleSeatClick = (id: number, booked: boolean) => {
    if (booked) return;
    if (selectedSeatIds.includes(id)) {
      setSelectedSeatIds(selectedSeatIds.filter(s => s !== id));
    } else {
      if (selectedSeatIds.length >= 6) {
        setActionMessage({ text: "Maximum 6 seats per transaction for fairness.", type: "warning" });
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, id]);
    }
  };

  const quickPick = (count: number) => {
    let pool = allSeats.filter(s => !(s.isBooked || s.booked));
    if (sectionFilter === "VIP")     pool = pool.filter(s => s.id <= 250);
    if (sectionFilter === "FLOOR")   pool = pool.filter(s => s.id > 250 && s.id <= 750);
    if (sectionFilter === "GALLERY") pool = pool.filter(s => s.id > 750);
    setSelectedSeatIds(pool.slice(0, count).map(s => Number(s.id)));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSeatIds.length === 0) return;
    setIsProcessing(true);
    setActionMessage(null);
    const key = idempotencyKey.trim() || `ik-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      const res = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({
          email: userEmail || `fan-${Math.floor(Math.random() * 99999)}@koncertify.io`,
          seatNums: selectedSeatIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.confirmationCode) {
        setConfirmedOrder(data);
        setSelectedSeatIds([]);
        setUserEmail("");
        setIdempotencyKey("");
        fetchMetrics();
        fetchOrders();
      } else {
        const msg = data.error || data.message || "Reservation failed. Please try again.";
        if (msg.includes("CONCURRENCY") || msg.includes("locked") || msg.includes("already booked")) {
          setStats(p => ({ ...p, conflictsDetected: p.conflictsDetected + 1 }));
        }
        setActionMessage({ text: msg, type: "error" });
      }
    } catch {
      setActionMessage({ text: "Network error — unable to complete transaction.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateConflict = async () => {
    setIsProcessing(true);
    setActionMessage({ text: "Dispatching concurrent worker threads…", type: "info" });
    const total = batches.reduce((a, b) => a + b.threadsCount, 0);
    setStats(p => ({ ...p, systemLoad: "HIGH STRESS", requestsPerSec: Math.min(total, 160) }));

    const tasks: Promise<{ ok: boolean; status: number; label: string }>[] = [];
    batches.forEach(batch => {
      const targets = batch.seatsInput.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      if (!targets.length) return;
      for (let i = 0; i < batch.threadsCount; i++) {
        tasks.push(
          fetch(`${baseUrl}/api/seats/book-bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(targets),
          })
            .then(r => ({ ok: r.ok, status: r.status, label: batch.label }))
            .catch(() => ({ ok: false, status: 500, label: batch.label }))
        );
      }
    });

    if (!tasks.length) {
      setActionMessage({ text: "No valid seat targets configured.", type: "error" });
      setIsProcessing(false);
      return;
    }

    const results = await Promise.all(tasks);
    const won = new Set<string>(), lost = new Set<string>();
    let conflicts = 0, blocked = 0;
    results.forEach(r => {
      if (r.ok) won.add(r.label);
      else { lost.add(r.label); r.status === 429 ? blocked++ : conflicts++; }
    });

    setStats(p => ({ ...p, conflictsDetected: p.conflictsDetected + conflicts }));

    let summary = `Won locks: [${[...won].join(", ") || "None"}] · Rolled back: [${[...lost].join(", ") || "None"}] (${conflicts} race conflicts isolated).`;
    if (blocked > 0) summary += ` · 🛡️ ${blocked} scalper requests blocked (HTTP 429).`;
    setActionMessage({ text: summary, type: won.size > 0 ? "success" : "warning" });

    setIsProcessing(false);
    setTimeout(fetchMetrics, 400);
    setTimeout(() => setStats(p => ({ ...p, systemLoad: "Normal", requestsPerSec: 0 })), 3000);
  };

  const handleBotBurst = async () => {
    setIsProcessing(true);
    setActionMessage({ text: "Firing 50 rapid bot requests in 500ms…", type: "info" });
    setStats(p => ({ ...p, systemLoad: "BOT ATTACK", requestsPerSec: 100 }));

    const statuses = await Promise.all(
      Array.from({ length: 50 }, () =>
        fetch(`${baseUrl}/api/seats/book-bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([99, 100]),
        }).then(r => r.status).catch(() => 500)
      )
    );

    const ratelimited = statuses.filter(s => s === 429).length;
    const ok = statuses.filter(s => s === 200).length;

    setActionMessage(
      ratelimited > 0
        ? { text: `🛡️ Bot Defense Active: ${ratelimited} scalper requests BLOCKED (HTTP 429). ${ok} passed within limits.`, type: "success" }
        : { text: `⚠️ Bot protection not triggered. ${ok} requests passed — try enabling bot defense first.`, type: "warning" }
    );

    setIsProcessing(false);
    setTimeout(() => setStats(p => ({ ...p, systemLoad: "Normal", requestsPerSec: 0 })), 2500);
  };

  const handleReset = async () => {
    if (!window.confirm("This will reset all seat bookings and clear database locks. Continue?")) return;
    setIsProcessing(true);
    try {
      await fetch(`${baseUrl}/api/seats/reset-all`, { method: "POST" });
      setActionMessage({ text: "Database reset to 1,250 available seats.", type: "success" });
      setStats(p => ({ ...p, conflictsDetected: 0 }));
      setSelectedSeatIds([]);
      fetchMetrics();
      fetchOrders();
    } catch {
      setActionMessage({ text: "Reset failed.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBatch = (i: number, field: keyof SimulatorBatch, value: string | number) => {
    setBatches(b => { const n = [...b]; n[i] = { ...n[i], [field]: value }; return n; });
  };

  const addBatch = () => {
    if (batches.length >= 5) return;
    const labels = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    setBatches(b => [...b, { label: `Worker Group ${labels[b.length] ?? b.length}`, seatsInput: `${b.length * 5 + 20}`, threadsCount: 10 }]);
  };

  /* ── Derived ── */
  const filteredSeats = allSeats.filter(s => {
    if (sectionFilter === "VIP")     return s.id <= 250;
    if (sectionFilter === "FLOOR")   return s.id > 250 && s.id <= 750;
    if (sectionFilter === "GALLERY") return s.id > 750;
    return true;
  });

  const totalPrice = selectedSeatIds.reduce((sum, id) => sum + getSeatTier(id).price, 0);

  const displayedEvents = EVENTS.filter(e =>
    (categoryFilter === "ALL" || e.category === categoryFilter) &&
    (
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>

      {/* ── Top Nav ── */}
      <nav style={{
        background: "rgba(5,7,15,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Music2 size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                Koncertify
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: -2 }}>
                Live Event Platform
              </div>
            </div>
          </div>

          {/* Status pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Backend status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 99, padding: "5px 12px",
              fontSize: 11, fontWeight: 600,
            }}>
              {backendStatus === "online"
                ? <><LiveDot color="#10b981" /><span style={{ color: "#10b981" }}>Engine Online</span></>
                : backendStatus === "offline"
                ? <><LiveDot color="#f43f5e" /><span style={{ color: "#f43f5e" }}>Engine Offline</span></>
                : <><LiveDot color="#f59e0b" /><span style={{ color: "#f59e0b" }}>Connecting…</span></>
              }
            </div>

            {/* Bot defense toggle */}
            <button
              onClick={toggleBotProtection}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: botProtection ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
                border: `1px solid ${botProtection ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
                borderRadius: 99, padding: "5px 12px",
                color: botProtection ? "#10b981" : "#f43f5e",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Toggle bot rate-limiter"
            >
              {botProtection
                ? <><ShieldCheck size={12} /><span>Bot Defense: ON</span></>
                : <><ShieldAlert size={12} /><span>Bot Defense: OFF</span></>
              }
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Stats Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
          <StatCard
            label="Available Seats"
            value={stats.availableSeats.toLocaleString()}
            icon={Ticket}
            accent="#10b981"
            sub={`of 1,250 total`}
          />
          <StatCard
            label="Active Bookings"
            value={stats.activeBookings}
            icon={Users}
            accent="#a78bfa"
          />
          <StatCard
            label="System Load"
            value={stats.systemLoad}
            icon={Activity}
            accent={stats.systemLoad === "Normal" ? "#94a3b8" : stats.systemLoad === "BOT ATTACK" ? "#f43f5e" : "#f59e0b"}
          />
          <StatCard
            label="Throughput"
            value={`${stats.requestsPerSec} req/s`}
            icon={Zap}
            accent="#f59e0b"
          />
          <StatCard
            label="Race Conflicts"
            value={stats.conflictsDetected}
            icon={Lock}
            accent={stats.conflictsDetected > 0 ? "#f43f5e" : "#94a3b8"}
            sub="caught & isolated"
          />
          <StatCard
            label="Latency P50 / P99"
            value={`${stats.p50LatencyMs}ms / ${stats.p99LatencyMs}ms`}
            icon={BarChart3}
            accent="#06b6d4"
          />
        </div>

        {/* ── Tab Nav ── */}
        <div className="tab-bar" style={{ marginBottom: 28 }}>
          {([
            { key: "discovery", label: "Discover Events",    icon: Search,  activeClass: "active-purple" },
            { key: "portal",    label: selectedEvent.title,  icon: Ticket,  activeClass: "active-green"  },
            { key: "simulator", label: "Concurrency Tester", icon: Cpu,     activeClass: "active-amber"  },
            { key: "orders",    label: `My Orders (${ordersList.length})`, icon: Layers, activeClass: "active-cyan" },
          ] as const).map(({ key, label, icon: Icon, activeClass }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`tab-item ${activeTab === key ? activeClass : ""}`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Global Notification Banner ── */}
        {actionMessage && (
          <div className={`alert alert-${actionMessage.type === "success" ? "success" : actionMessage.type === "error" ? "error" : actionMessage.type === "warning" ? "warning" : "info"}`}
            style={{ marginBottom: 20, animationName: "fadeInUp", animationDuration: "0.3s", animationFillMode: "both" }}
          >
            <div style={{ flexShrink: 0, marginTop: 1 }}>
              {actionMessage.type === "success" && <CheckCircle2 size={16} />}
              {actionMessage.type === "error"   && <AlertTriangle size={16} />}
              {actionMessage.type === "warning" && <AlertTriangle size={16} />}
              {actionMessage.type === "info"    && <Activity size={16} />}
            </div>
            <span style={{ flex: 1, fontSize: 13 }}>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: DISCOVER EVENTS
        ════════════════════════════════════════════════════ */}
        {activeTab === "discovery" && (
          <div style={{ animationName: "fadeInUp", animationDuration: "0.35s", animationFillMode: "both" }}>

            {/* Hero banner — featured event */}
            <div style={{
              borderRadius: 20,
              overflow: "hidden",
              background: EVENTS[0].gradient,
              border: "1px solid rgba(139,92,246,0.20)",
              marginBottom: 28,
              position: "relative",
            }}>
              {/* Decorative glow */}
              <div style={{
                position: "absolute", top: -80, right: -80,
                width: 340, height: 340, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              <div style={{ padding: "40px 44px", position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  <span className="badge badge-purple"><Star size={9} /> Featured</span>
                  <span className="badge badge-purple">FESTIVAL</span>
                  <span className="badge badge-green"><LiveDot color="#10b981" /> On Sale Now</span>
                </div>

                <h1 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, color: "#fff", lineHeight: 1.15 }}>
                  {EVENTS[0].title}
                </h1>
                <p style={{ margin: "10px 0 0", fontSize: 15, color: "#c4b5fd", fontWeight: 500 }}>
                  {EVENTS[0].artist}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={14} style={{ color: "#a78bfa" }} />{EVENTS[0].date}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={14} style={{ color: "#a78bfa" }} />{EVENTS[0].venue}, {EVENTS[0].location}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Globe size={14} style={{ color: "#a78bfa" }} />{EVENTS[0].totalSeats.toLocaleString()} seat capacity
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28 }}>
                  <button
                    className="btn btn-purple btn-lg"
                    onClick={() => { setSelectedEvent(EVENTS[0]); setActiveTab("portal"); }}
                  >
                    Get Tickets <ArrowRight size={16} />
                  </button>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                    From <strong style={{ fontSize: 22, color: "#fff" }}>${EVENTS[0].startingPrice}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Search + Filter bar */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 14,
              padding: "14px 18px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}>
              <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="input"
                  style={{ paddingLeft: 36, background: "var(--bg-base)" }}
                  placeholder="Search artist, event, or venue…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Filter size={13} style={{ color: "var(--text-muted)" }} />
                {(["ALL", "FESTIVAL", "POP", "ROCK", "EDM"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: "5px 13px",
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      border: "1px solid",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: categoryFilter === cat ? "#7c3aed" : "var(--bg-base)",
                      borderColor: categoryFilter === cat ? "#8b5cf6" : "var(--border-default)",
                      color: categoryFilter === cat ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Event grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {displayedEvents.map((evt, i) => (
                <div
                  key={evt.id}
                  className="event-card"
                  onClick={() => { setSelectedEvent(evt); setActiveTab("portal"); }}
                  style={{ animationName: "fadeInUp", animationDuration: "0.35s", animationDelay: `${i * 0.06}s`, animationFillMode: "both" }}
                >
                  {/* Gradient image area */}
                  <div className="event-card-image" style={{ background: evt.gradient }}>
                    <div style={{ position: "absolute", inset: 0, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <span className={`badge ${CATEGORY_COLORS[evt.category] ?? "badge-slate"}`} style={{ alignSelf: "flex-start" }}>
                        {evt.category}
                      </span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.25 }}>{evt.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 3, fontWeight: 500 }}>{evt.artist}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-secondary)" }}>
                        <Calendar size={12} style={{ color: evt.accentColor, flexShrink: 0 }} />{evt.date}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-secondary)" }}>
                        <MapPin size={12} style={{ color: evt.accentColor, flexShrink: 0 }} />{evt.venue}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>From</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: evt.accentColor, letterSpacing: "-0.02em" }}>${evt.startingPrice}</div>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border-default)",
                        borderRadius: 8, padding: "7px 12px",
                        fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
                      }}>
                        Select Seats <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {displayedEvents.length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  <Search size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                  <div style={{ fontSize: 15, fontWeight: 600 }}>No events match your search</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Try a different keyword or category</div>
                </div>
              )}
            </div>

            {/* Platform features strip */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginTop: 32,
              padding: "20px 0",
              borderTop: "1px solid var(--border-subtle)",
            }}>
              {[
                { icon: Lock,        color: "#10b981", title: "Atomic Locks",         desc: "Deterministic row-level locking prevents double-booking" },
                { icon: ShieldCheck, color: "#a78bfa", title: "Bot Defense",           desc: "Rate-limiter blocks scalper bots with HTTP 429" },
                { icon: BadgeCheck,  color: "#f59e0b", title: "Idempotency",           desc: "Duplicate requests safely de-duplicated" },
                { icon: TrendingUp,  color: "#06b6d4", title: "High Concurrency",      desc: "Sub-20ms p50 latency under stress load" },
              ].map(f => (
                <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: `rgba(${f.color === "#10b981" ? "16,185,129" : f.color === "#a78bfa" ? "139,92,246" : f.color === "#f59e0b" ? "245,158,11" : "6,182,212"},0.12)`,
                    border: `1px solid rgba(${f.color === "#10b981" ? "16,185,129" : f.color === "#a78bfa" ? "139,92,246" : f.color === "#f59e0b" ? "245,158,11" : "6,182,212"},0.22)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <f.icon size={15} style={{ color: f.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: BOOKING PORTAL
        ════════════════════════════════════════════════════ */}
        {activeTab === "portal" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}
            className="portal-layout"
          >
            {/* Left — Venue Map */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Event header card */}
              <div style={{
                borderRadius: 16,
                overflow: "hidden",
                background: selectedEvent.gradient,
                border: "1px solid var(--border-default)",
              }}>
                <div style={{ padding: "24px 28px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <span className={`badge ${CATEGORY_COLORS[selectedEvent.category] ?? "badge-slate"}`}>{selectedEvent.category}</span>
                      <span className="badge badge-green"><LiveDot color="#10b981" /> Live Sale</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em" }}>
                      {selectedEvent.title}
                    </h2>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.60)", fontWeight: 500 }}>
                      {selectedEvent.artist}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={12} style={{ color: selectedEvent.accentColor }} />{selectedEvent.date}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={12} style={{ color: selectedEvent.accentColor }} />{selectedEvent.venue}, {selectedEvent.location}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.07em" }}>Starting from</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: selectedEvent.accentColor, letterSpacing: "-0.03em", lineHeight: 1 }}>
                      ${selectedEvent.startingPrice}
                    </div>
                  </div>
                </div>

                {/* Tier pricing legend */}
                <div style={{
                  background: "rgba(0,0,0,0.35)",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  padding: "10px 28px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 20,
                }}>
                  {[
                    { label: "VIP (1–250)",           price: "$250", color: "#a78bfa" },
                    { label: "Main Floor (251–750)",  price: "$180", color: "#10b981" },
                    { label: "Gallery (751–1250)",    price: "$120", color: "#94a3b8" },
                  ].map(t => (
                    <span key={t.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: t.color, display: "inline-block" }} />
                      {t.label} · <strong style={{ color: t.color }}>{t.price}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Seat map card */}
              <div className="card" style={{ padding: 24 }}>
                {/* Stage */}
                <div className="stage-banner">⚡ Main Performance Stage ⚡</div>

                {/* Controls */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Tier:</span>
                    {(["ALL", "VIP", "FLOOR", "GALLERY"] as const).map(sec => (
                      <button
                        key={sec}
                        onClick={() => setSectionFilter(sec)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 700,
                          border: "1px solid",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          background: sectionFilter === sec ? "#10b981" : "var(--bg-base)",
                          borderColor: sectionFilter === sec ? "#10b981" : "var(--border-default)",
                          color: sectionFilter === sec ? "#000" : "var(--text-muted)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => quickPick(2)}
                    >
                      Quick Pick ×2
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => quickPick(4)}
                    >
                      ×4
                    </button>
                    {selectedSeatIds.length > 0 && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedSeatIds([])}
                        style={{ color: "var(--accent-rose)" }}
                      >
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Seat grid */}
                <div style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: 16,
                  maxHeight: 380,
                  overflowY: "auto",
                }}>
                  {allSeats.length === 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(25, 1fr)", gap: 4 }}>
                      {Array.from({ length: 100 }).map((_, i) => (
                        <div key={i} className="seat shimmer-loading" style={{ height: 22 }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(26px, 1fr))", gap: 4 }}>
                      {filteredSeats.map(seat => {
                        const id = Number(seat.id);
                        const booked = Boolean(seat.isBooked || seat.booked);
                        const selected = selectedSeatIds.includes(id);
                        const tier = getSeatTier(id);

                        return (
                          <div
                            key={id}
                            className={`seat ${booked ? "seat-booked" : selected ? "seat-selected" : "seat-available"}`}
                            onClick={() => handleSeatClick(id, booked)}
                            title={`Seat #${id} · ${tier.label} · $${tier.price}`}
                            style={!booked && !selected ? { borderColor: `${tier.color}22` } : undefined}
                          >
                            {id}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Map legend */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 12 }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    {[
                      { label: "Available", style: { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.08)" } },
                      { label: "Selected",  style: { background: "#10b981" } },
                      { label: "Sold Out",  style: { background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.20)" } },
                    ].map(l => (
                      <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, display: "inline-block", ...l.style }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Showing {filteredSeats.length.toLocaleString()} seats
                  </span>
                </div>
              </div>
            </div>

            {/* Right — Cart & Checkout */}
            <div style={{ position: "sticky", top: 80 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <Ticket size={15} style={{ color: "#10b981" }} />
                    Your Cart
                  </h3>
                  {selectedSeatIds.length > 0 && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)",
                      borderRadius: 99, padding: "4px 10px",
                      fontSize: 11, fontWeight: 700, color: "#fbbf24",
                    }}>
                      <Clock size={11} />
                      {formatTimer(holdSeconds)}
                    </div>
                  )}
                </div>

                {selectedSeatIds.length === 0 ? (
                  <div style={{
                    border: "1px dashed var(--border-default)",
                    borderRadius: 12, padding: "36px 20px",
                    textAlign: "center", color: "var(--text-muted)",
                  }}>
                    <Ticket size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No seats selected</div>
                    <div style={{ fontSize: 12, marginTop: 5 }}>Click seats on the map to add them</div>
                  </div>
                ) : (
                  <>
                    {/* Seat list */}
                    <div style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      overflow: "hidden",
                      marginBottom: 14,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}>
                      {selectedSeatIds.map((id, i) => {
                        const tier = getSeatTier(id);
                        return (
                          <div key={id} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "9px 14px",
                            borderBottom: i < selectedSeatIds.length - 1 ? "1px solid var(--border-subtle)" : "none",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <span style={{ width: 7, height: 7, borderRadius: 2, background: tier.color, display: "inline-block" }} />
                              <span style={{ fontSize: 13, fontWeight: 600 }}>Seat #{id}</span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{tier.label}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>${tier.price}</span>
                              <button
                                onClick={() => setSelectedSeatIds(p => p.filter(s => s !== id))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 0", borderTop: "1px solid var(--border-subtle)", marginBottom: 18,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                        {selectedSeatIds.length} ticket{selectedSeatIds.length !== 1 ? "s" : ""}
                      </span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#10b981", letterSpacing: "-0.02em" }}>
                        ${totalPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleCheckout} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label className="label">Email address</label>
                        <input
                          className="input"
                          type="email"
                          placeholder="you@example.com"
                          value={userEmail}
                          onChange={e => setUserEmail(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="label">Idempotency Key <span style={{ textTransform: "none", fontWeight: 400, color: "var(--text-muted)" }}>(auto-generated if empty)</span></label>
                        <input
                          className="input input-mono"
                          type="text"
                          placeholder="ik-9a8b7c6d"
                          value={idempotencyKey}
                          onChange={e => setIdempotencyKey(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-full btn-lg"
                        disabled={isProcessing}
                        style={{ marginTop: 4 }}
                      >
                        {isProcessing
                          ? <><RefreshCw size={14} className="animate-spin-slow" /> Acquiring locks…</>
                          : <><Lock size={14} /> Complete Purchase</>
                        }
                      </button>
                    </form>
                  </>
                )}

                {/* Trust badges */}
                <div style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}>
                  {[
                    { icon: ShieldCheck, color: "#10b981", text: "Atomic transactions — no double-booking" },
                    { icon: BadgeCheck,  color: "#a78bfa", text: "Idempotency-protected checkout" },
                    { icon: Lock,        color: "#06b6d4", text: "Row-level locks released on failure" },
                  ].map(t => (
                    <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--text-muted)" }}>
                      <t.icon size={12} style={{ color: t.color, flexShrink: 0 }} />
                      {t.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: CONCURRENCY SIMULATOR
        ════════════════════════════════════════════════════ */}
        {activeTab === "simulator" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

            {/* Left — configuration */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 9 }}>
                      <Cpu size={16} style={{ color: "#f59e0b" }} />
                      Race Condition Simulator
                    </h2>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Configure overlapping worker groups targeting the same seat rows to observe atomic lock behavior and conflict isolation.
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={addBatch}
                    disabled={batches.length >= 5}
                  >
                    <Plus size={13} /> Add Group
                  </button>
                </div>
              </div>

              {/* Batch rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {batches.map((batch, i) => (
                  <div key={i} style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 12,
                    padding: "16px 18px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto auto",
                    gap: 12,
                    alignItems: "end",
                  }}>
                    <div>
                      <label className="label">Group name</label>
                      <input
                        className="input"
                        style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", background: "transparent", border: "none", borderBottom: "1px solid var(--border-default)", borderRadius: 0, padding: "4px 0" }}
                        value={batch.label}
                        onChange={e => updateBatch(i, "label", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Target Seat IDs</label>
                      <input
                        className="input input-mono"
                        placeholder="5, 6, 7"
                        value={batch.seatsInput}
                        onChange={e => updateBatch(i, "seatsInput", e.target.value)}
                      />
                    </div>
                    <div style={{ minWidth: 100 }}>
                      <label className="label">Threads</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "5px 8px" }}
                          onClick={() => updateBatch(i, "threadsCount", Math.max(1, batch.threadsCount - 5))}
                          type="button"
                        >
                          <Minus size={11} />
                        </button>
                        <span style={{ fontSize: 14, fontWeight: 700, minWidth: 28, textAlign: "center" }}>{batch.threadsCount}</span>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "5px 8px" }}
                          onClick={() => updateBatch(i, "threadsCount", Math.min(100, batch.threadsCount + 5))}
                          type="button"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setBatches(b => b.filter((_, j) => j !== i))}
                      disabled={batches.length <= 1 || isProcessing}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 6, alignSelf: "center", opacity: batches.length <= 1 ? 0.3 : 1 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary + Action buttons */}
              <div style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                fontSize: 12,
                color: "var(--text-muted)",
              }}>
                <span>
                  Total pipeline load:{" "}
                  <strong style={{ color: "#fbbf24", fontSize: 14 }}>
                    {batches.reduce((a, b) => a + b.threadsCount, 0)} parallel requests
                  </strong>
                </span>
                <button className="btn btn-danger btn-sm" onClick={handleReset} disabled={isProcessing}>
                  <RotateCcw size={12} /> Reset Database
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button
                  className="btn btn-amber btn-lg"
                  onClick={handleSimulateConflict}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? <><RefreshCw size={14} className="animate-spin-slow" /> Running…</>
                    : <><FlameKindling size={16} /> Run Race Test</>
                  }
                </button>
                <button
                  className="btn btn-ghost btn-lg"
                  onClick={handleBotBurst}
                  disabled={isProcessing}
                  style={{ borderColor: "rgba(244,63,94,0.30)", color: "#fb7185" }}
                >
                  <Bot size={15} /> Simulate Bot Burst (50 req)
                </button>
              </div>
            </div>

            {/* Right — live telemetry mini-map */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Live Inventory</h3>
                  <RefreshCw size={13} style={{ color: "var(--text-muted)" }} className="animate-spin-slow" />
                </div>

                <div style={{
                  maxHeight: 380,
                  overflowY: "auto",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(22px, 1fr))", gap: 3 }}>
                    {allSeats.slice(0, 300).map(seat => {
                      const id = Number(seat.id);
                      const booked = Boolean(seat.isBooked || seat.booked);
                      return (
                        <div
                          key={id}
                          title={`Seat #${id}`}
                          style={{
                            height: 18,
                            borderRadius: 3,
                            border: "1px solid",
                            fontSize: 7,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontFamily: "var(--font-mono), monospace",
                            background: booked ? "rgba(244,63,94,0.15)" : "var(--bg-elevated)",
                            borderColor: booked ? "rgba(244,63,94,0.30)" : "rgba(255,255,255,0.05)",
                            color: booked ? "#f43f5e" : "var(--text-muted)",
                            transition: "all 0.3s",
                          }}
                        >
                          {id}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
                  First 300 of 1,250 seats · Red = booked/locked
                </p>
              </div>

              {/* Bot defense status card */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
                  {botProtection ? <ShieldCheck size={14} style={{ color: "#10b981" }} /> : <ShieldBan size={14} style={{ color: "#f43f5e" }} />}
                  Scalper Bot Defense
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--bg-base)", borderRadius: 8, padding: "10px 12px",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Status</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: botProtection ? "#10b981" : "#f43f5e" }}>
                      {botProtection ? "ACTIVE" : "DISABLED"}
                    </span>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--bg-base)", borderRadius: 8, padding: "10px 12px",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Rate limit</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono), monospace" }}>15 req/s</span>
                  </div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--bg-base)", borderRadius: 8, padding: "10px 12px",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Response</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", fontFamily: "var(--font-mono), monospace" }}>HTTP 429</span>
                  </div>
                  <button className="btn btn-ghost btn-sm btn-full" onClick={toggleBotProtection} style={{ marginTop: 4 }}>
                    {botProtection ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                    {botProtection ? "Disable" : "Enable"} Bot Defense
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: ORDERS
        ════════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div style={{ animationName: "fadeInUp", animationDuration: "0.35s", animationFillMode: "both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Confirmed Orders</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  {ordersList.length} booking{ordersList.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
              <button className="btn btn-ghost" onClick={fetchOrders}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {ordersList.length === 0 ? (
              <div style={{
                border: "1px dashed var(--border-default)",
                borderRadius: 16, padding: "80px 20px",
                textAlign: "center", color: "var(--text-muted)",
              }}>
                <Receipt size={36} style={{ margin: "0 auto 14px", opacity: 0.3 }} />
                <div style={{ fontSize: 15, fontWeight: 600 }}>No orders yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Book tickets via the portal or run the simulator</div>
                <button
                  className="btn btn-ghost"
                  style={{ margin: "20px auto 0", display: "inline-flex" }}
                  onClick={() => setActiveTab("discovery")}
                >
                  Browse Events <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {ordersList.map((order, idx) => (
                  <div key={order.id ?? idx} className="ticket-card" style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <span className="badge badge-green" style={{ marginBottom: 8 }}>
                          <CheckCircle2 size={9} /> Confirmed
                        </span>
                        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: "var(--font-mono), monospace", color: "#10b981" }}>
                          {order.confirmationCode}
                        </div>
                      </div>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(16,185,129,0.10)",
                        border: "1px solid rgba(16,185,129,0.20)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={18} style={{ color: "#10b981" }} />
                      </div>
                    </div>

                    <div style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10, padding: "12px 14px",
                      display: "flex", flexDirection: "column", gap: 8, marginBottom: 14,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "var(--text-muted)" }}>Email</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600, maxWidth: 180, textAlign: "right", wordBreak: "break-all" }}>
                          {order.userEmail}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "var(--text-muted)" }}>Seats</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "var(--font-mono), monospace", maxWidth: 200, textAlign: "right" }}>
                          [{(order.bookedSeats ?? []).join(", ")}]
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "var(--text-muted)" }}>Value</span>
                        <span style={{ color: "#10b981", fontWeight: 700 }}>
                          ${(order.bookedSeats ?? []).reduce((sum, id) => sum + getSeatTier(id).price, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Barcode strip */}
                    <div style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 38 }}>
                      {Array.from({ length: 28 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            background: "#111",
                            height: i % 5 === 0 ? "100%" : i % 3 === 0 ? "65%" : "80%",
                            width: i % 4 === 0 ? 2.5 : 1.2,
                            borderRadius: 1,
                          }}
                        />
                      ))}
                    </div>

                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)",
                      fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono), monospace",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      <span>Atomic · Outbox Dispatched</span>
                      <BadgeCheck size={12} style={{ color: "#10b981" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          ORDER CONFIRMATION MODAL
      ════════════════════════════════════════════════════ */}
      {confirmedOrder && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(5,7,15,0.85)",
            backdropFilter: "blur(16px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmedOrder(null); }}
        >
          <div
            className="card"
            style={{
              maxWidth: 420, width: "100%", padding: 36,
              border: "1px solid rgba(16,185,129,0.30)",
              boxShadow: "0 0 60px rgba(16,185,129,0.12), 0 24px 80px rgba(0,0,0,0.6)",
              animationName: "fadeInUp", animationDuration: "0.35s", animationFillMode: "both",
            }}
          >
            {/* Success header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.30)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <CheckCircle2 size={32} style={{ color: "#10b981" }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Booking Confirmed!</h2>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                Transactional outbox event dispatched
              </p>
            </div>

            {/* Details */}
            <div style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12, padding: "16px 18px",
              display: "flex", flexDirection: "column", gap: 10, marginBottom: 20,
            }}>
              {[
                { label: "Confirmation Code", value: confirmedOrder.confirmationCode, mono: true, accent: "#10b981" },
                { label: "Email",             value: confirmedOrder.userEmail },
                { label: "Seats Reserved",    value: `[${confirmedOrder.bookedSeats.join(", ")}]`, mono: true },
                {
                  label: "Total Value",
                  value: `$${confirmedOrder.bookedSeats.reduce((sum, id) => sum + getSeatTier(id).price, 0).toLocaleString()}`,
                  accent: "#10b981",
                },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span style={{
                    fontWeight: 700,
                    color: row.accent ?? "var(--text-primary)",
                    fontFamily: row.mono ? "var(--font-mono), monospace" : undefined,
                    maxWidth: 230, textAlign: "right", wordBreak: "break-all",
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Barcode */}
            <div style={{ background: "#fff", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, marginBottom: 20 }}>
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#111",
                    height: i % 4 === 0 ? "100%" : i % 2 === 0 ? "60%" : "75%",
                    width: i % 5 === 0 ? 3 : 1.5,
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => setConfirmedOrder(null)}
            >
              Done
            </button>

            <button
              onClick={() => { setConfirmedOrder(null); setActiveTab("orders"); }}
              className="btn btn-ghost btn-full btn-sm"
              style={{ marginTop: 8 }}
            >
              View all orders
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "24px",
        marginTop: 48,
        textAlign: "center",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        maxWidth: 1400,
        margin: "48px auto 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: "linear-gradient(135deg, #10b981, #6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Music2 size={12} color="#fff" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Koncertify</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: 16 }}>
          <span>High-concurrency booking engine</span>
          <span>·</span>
          <span style={{ fontFamily: "var(--font-mono), monospace" }}>Deterministic row locks · Transactional outbox · Idempotency</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {backendStatus === "online"
            ? <span className="badge badge-green"><Wifi size={9} /> Connected</span>
            : <span className="badge badge-rose"><WifiOff size={9} /> Offline</span>
          }
          {botProtection && <span className="badge badge-purple"><ShieldCheck size={9} /> Bot Defense Active</span>}
        </div>
      </footer>
    </div>
  );
}
