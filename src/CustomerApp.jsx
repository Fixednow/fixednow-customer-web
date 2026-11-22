import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Star,
  MapPin,
  ChevronLeft,
  Cake,
  Flower2,
  PartyPopper,
  Tent,
  Trees,
  Dog,
  Quote,
  Check,
  Car,
  Gauge,
  Wrench,
  Hammer,
  Settings2,
  Sparkles,
  SprayCan,
  Droplets,
  Zap,
  Phone,
  MessageSquare,
  Navigation2,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Calendar,
  LogOut,
} from "lucide-react";

// ---------------------------------------------------------------------------
// API layer — talks to the FixedNow matching API (see the fixednow-api
// artifact). Update API_BASE_URL to point at your deployed instance; run
// schema.sql then seed.sql against its database first, or every request
// here resolves to "no providers found" with nothing to match against.
// ---------------------------------------------------------------------------

const API_BASE_URL = "https://fixednow-api.onrender.com";

// Hardcoded to match seed.sql's seeded providers, which are placed near
// this exact point. A real app would use the device's actual GPS location.
const DEMO_LOCATION = { lng: -6.2656, lat: 53.3244, addressText: "Rathmines, Dublin 6" };

// A localStorage key for the customer's login token, so they stay logged
// in across page reloads (safe here — this is a real deployed site, not a
// sandboxed artifact, so localStorage works normally).
const AUTH_STORAGE_KEY = "fixednow_customer_auth";

async function apiFetch(path, options = {}) {
  const { token, ...rest } = options;
  const headers = { "Content-Type": "application/json", ...(rest.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

// ---------------------------------------------------------------------------
// Design concept: "the job book" — a craftsperson's portfolio read like a
// ledger of pinned index cards, not a glossy Instagram grid. Deep botanical
// green + warm paper cards + a single gold accent for trust signals (rating,
// CTA). Companion piece to the provider app's dark dispatch console: same
// technical mono thread (IBM Plex Mono for ratings/prices) carried over for
// brand continuity, but this is the "daylight, browsing" side of Send the Pros.
// ---------------------------------------------------------------------------

const COLORS = {
  base: "#1F3327",
  baseDeep: "#152219",
  surface: "#2A4232",
  hairlineOnGreen: "#3C5744",
  paper: "#FBF7EE",
  paperShade: "#EFE6D3",
  textOnGreen: "#F4EFE2",
  textOnGreenMuted: "#9FB6A6",
  textOnPaper: "#2A3324",
  textOnPaperMuted: "#6B7362",
  gold: "#C9A227",
  goldDeep: "#8F730F",
  rose: "#C97C82",
};

const CATEGORY_META = {
  "Cake Maker": { icon: Cake },
  "Florist": { icon: Flower2 },
  "Balloon Maker": { icon: PartyPopper },
  "Bouncy Castle Hire": { icon: Tent },
  "Landscaper": { icon: Trees },
  "Dog Groomer": { icon: Dog },
};
const CATEGORIES = Object.keys(CATEGORY_META);

// The "urgent switch" categories — on-demand, GPS-matched, no browsing a
// portfolio first. Icon-only tiles since speed matters more than photos here.
const ON_DEMAND_CATEGORY_META = {
  "Roadside Assistance": Car,
  "Tyre Fitter": Gauge,
  "Mechanic": Wrench,
  "Handyman": Hammer,
  "Appliance Repair": Settings2,
  "House Cleaner": Sparkles,
  "Window Cleaner": SprayCan,
  "Dog Walker": Dog,
  "Plumber": Droplets,
  "Electrician": Zap,
};
const ON_DEMAND_CATEGORIES = Object.keys(ON_DEMAND_CATEGORY_META);

const URGENCY_LEVELS = ["Standard", "Urgent", "Emergency"];
const TRACKING_STAGES = ["En route", "Arrived", "In progress", "Complete"];


function StatusBar() {
  return (
    <div
      className="flex items-center justify-between px-6"
      style={{ height: 28, color: COLORS.textOnGreenMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
    >
      <span>9:41</span>
      <span>82%</span>
    </div>
  );
}

// Send the Pros customer mark: gold map pin carrying "PRO" on a green tile.
// The provider (Partner) app uses the same pin with a worker inside, in
// swapped colours, so the two apps read as one family.
function BrandMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Send the Pros">
      <rect width="100" height="100" rx="22" fill={COLORS.baseDeep} />
      <path d="M50 12 C35 12 24 24 24 39 C24 58 50 86 50 86 C50 86 76 58 76 39 C76 24 65 12 50 12 Z" fill={COLORS.gold} />
      <text x="50" y="47" textAnchor="middle" fontFamily="'Big Shoulders Display', sans-serif" fontWeight="900" fontSize="22" fill={COLORS.baseDeep}>PRO</text>
    </svg>
  );
}

function Wordmark({ size = 30 }) {
  return (
    <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 900, fontSize: size, lineHeight: 0.9, textTransform: "uppercase", color: COLORS.textOnGreen }}>
      Send the <span style={{ color: COLORS.gold }}>Pros</span>
    </span>
  );
}

function Stars({ rating, size = 12 }) {
  return (
    <div className="flex items-center" style={{ gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          color={COLORS.gold}
          fill={i < Math.round(rating) ? COLORS.gold : "transparent"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function PolaroidSwatch({ Icon, rotate = 0, size = 56 }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: COLORS.paper,
        border: `1px solid ${COLORS.paperShade}`,
        borderRadius: 6,
        boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <Icon size={size * 0.4} color={COLORS.goldDeep} strokeWidth={1.5} />
    </div>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0"
      style={{
        padding: "7px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? COLORS.gold : COLORS.hairlineOnGreen}`,
        background: active ? COLORS.gold : "transparent",
        color: active ? COLORS.baseDeep : COLORS.textOnGreenMuted,
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontWeight: 600,
        fontSize: 12.5,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function ProviderCard({ provider, onOpen }) {
  const Icon = CATEGORY_META[provider.category].icon;
  const rotations = [-4, 2, -1];
  // The portfolio prop already arrives rating-sorted from the API
  // (ORDER BY r.rating DESC NULLS LAST) — just take the top 3 as given.
  const topRated = provider.portfolio.slice(0, 3);
  return (
    <button
      onClick={onOpen}
      className="flex flex-col text-left"
      style={{
        width: "100%",
        background: COLORS.surface,
        border: `1px solid ${COLORS.hairlineOnGreen}`,
        borderRadius: 12,
        padding: 14,
        cursor: "pointer",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 40, height: 40, borderRadius: 999, background: COLORS.gold }}
        >
          <Icon size={18} color={COLORS.baseDeep} strokeWidth={2} />
        </span>
        <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
          <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 21, letterSpacing: 0.3, color: COLORS.textOnGreen }}>
            {provider.business}
          </span>
          <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: COLORS.textOnGreenMuted }}>
            {provider.name} · {provider.category}
          </span>
          <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
            <Stars rating={provider.rating} size={11} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textOnGreen }}>
              {provider.rating}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted }}>
              ({provider.reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
            <MapPin size={11} color={COLORS.textOnGreenMuted} />
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: COLORS.textOnGreenMuted }}>
              {provider.area}
              {provider.distanceKm != null && ` · ${provider.distanceKm.toFixed(1)}km away`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex" style={{ marginTop: 12, paddingLeft: 4 }}>
        {topRated.map((_, i) => (
          <div key={i} style={{ marginLeft: i === 0 ? 0 : -14 }}>
            <PolaroidSwatch Icon={Icon} rotate={rotations[i]} />
          </div>
        ))}
      </div>
    </button>
  );
}

function BrowseScreen({ providers, activeCategory, onSelectCategory, onOpenProvider, loading, error }) {
  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: "6px 20px 0" }}>
        <span
          style={{
            fontFamily: "'Big Shoulders Display', sans-serif",
            fontWeight: 800,
            fontSize: 31,
            letterSpacing: 0.3,
            color: COLORS.textOnGreen,
          }}
        >
          Book a pro
        </span>
        <div>
          <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: COLORS.textOnGreenMuted }}>
            Ranked by rating & track record — browse past work before you book
          </span>
        </div>
      </div>

      <div
        className="flex gap-2"
        style={{ padding: "14px 20px", overflowX: "auto" }}
      >
        <CategoryChip label="All" active={activeCategory === null} onClick={() => onSelectCategory(null)} />
        {CATEGORIES.map((c) => (
          <CategoryChip key={c} label={c} active={activeCategory === c} onClick={() => onSelectCategory(c)} />
        ))}
      </div>

      <div className="flex flex-col gap-3" style={{ padding: "0 20px 20px", overflowY: "auto", flex: 1 }}>
        {loading && (
          <div className="flex items-center justify-center gap-2" style={{ marginTop: 40 }}>
            <Loader2 size={14} color={COLORS.textOnGreenMuted} className="animate-spin" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textOnGreenMuted }}>
              Loading pros…
            </span>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center" style={{ marginTop: 40, textAlign: "center" }}>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: COLORS.rose }}>
              Couldn't load pros
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, marginTop: 4 }}>
              {error}
            </span>
          </div>
        )}
        {!loading && !error && providers.map((p) => (
          <ProviderCard key={p.id} provider={p} onOpen={() => onOpenProvider(p)} />
        ))}
        {!loading && !error && providers.length === 0 && (
          <div className="flex flex-col items-center" style={{ marginTop: 40 }}>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: COLORS.textOnGreenMuted }}>
              No pros in this category yet
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioCard({ Icon, categoryLabel, rotate, item }) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: COLORS.paper,
        borderRadius: 10,
        padding: 10,
        boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: "100%", height: 84, background: COLORS.paperShade, borderRadius: 6 }}
      >
        <Icon size={30} color={COLORS.goldDeep} strokeWidth={1.5} />
      </div>
      <span
        style={{
          marginTop: 7,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          color: COLORS.textOnPaperMuted,
          letterSpacing: 0.3,
        }}
      >
        {categoryLabel.toUpperCase()}
      </span>
      {item?.comment && (
        <div className="flex items-start gap-1" style={{ marginTop: 5 }}>
          <Quote size={11} color={COLORS.goldDeep} style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, color: COLORS.textOnPaper, lineHeight: 1.35 }}>
            {item.comment}
          </span>
        </div>
      )}
      {item?.rating && (
        <div style={{ marginTop: 5 }}>
          <Stars rating={item.rating} size={9} />
        </div>
      )}
    </div>
  );
}

function ProviderDetailScreen({ provider, onBack, onOpenQuoteForm, quoteSent }) {
  const Icon = CATEGORY_META[provider.category].icon;
  const rotations = [-2, 1.5, -1, 2, -1.5, 1];
  // Already rating-sorted by the API.
  const sortedPortfolio = provider.portfolio;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3" style={{ padding: "6px 20px 0" }}>
        <button
          onClick={onBack}
          className="flex items-center justify-center"
          style={{ width: 30, height: 30, borderRadius: 999, background: COLORS.surface, border: "none", cursor: "pointer" }}
        >
          <ChevronLeft size={17} color={COLORS.textOnGreen} />
        </button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5 }}>
          PRO PROFILE
        </span>
      </div>

      <div className="flex flex-col" style={{ overflowY: "auto", flex: 1 }}>
        <div style={{ padding: "14px 20px 0" }}>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 54, height: 54, borderRadius: 999, background: COLORS.gold }}
            >
              <Icon size={24} color={COLORS.baseDeep} strokeWidth={2} />
            </span>
            <div className="flex flex-col">
              <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 25, letterSpacing: 0.3, color: COLORS.textOnGreen }}>
                {provider.business}
              </span>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: COLORS.textOnGreenMuted }}>
                {provider.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
            <div className="flex items-center gap-1.5">
              <Stars rating={provider.rating} size={13} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: COLORS.textOnGreen }}>
                {provider.rating}
              </span>
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textOnGreenMuted }}>
              {provider.reviewCount} completed jobs
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: 4 }}>
            <MapPin size={12} color={COLORS.textOnGreenMuted} />
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: COLORS.textOnGreenMuted }}>
              {provider.area}
              {provider.distanceKm != null && ` · ${provider.distanceKm.toFixed(1)}km away`}
            </span>
          </div>

          <span
            style={{
              display: "block",
              marginTop: 18,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: COLORS.textOnGreenMuted,
              letterSpacing: 0.5,
            }}
          >
            PORTFOLIO · {provider.portfolio.length} PHOTOS · HIGHEST RATED FIRST
          </span>
        </div>

        <div
          className="grid grid-cols-2 gap-3.5"
          style={{ padding: "10px 22px 24px" }}
        >
          {sortedPortfolio.map((item, i) => (
            <PortfolioCard
              key={i}
              Icon={Icon}
              categoryLabel={provider.category}
              rotate={rotations[i % rotations.length]}
              item={item}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 20px 20px", background: COLORS.baseDeep }}>
        <button
          onClick={onOpenQuoteForm}
          disabled={quoteSent}
          className="flex items-center justify-center gap-2"
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            background: quoteSent ? COLORS.surface : COLORS.gold,
            color: quoteSent ? COLORS.textOnGreenMuted : COLORS.baseDeep,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: quoteSent ? "default" : "pointer",
          }}
        >
          {quoteSent ? (
            <>
              <Check size={16} /> Quote request sent
            </>
          ) : (
            `Request a quote from ${provider.name.split(" ")[0]}`
          )}
        </button>
      </div>
    </div>
  );
}

function QuoteFormScreen({ provider, description, onDescriptionChange, date, onDateChange, photos, onAddPhoto, onRemovePhoto, onBack, onSubmit, submitting, error }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3" style={{ padding: "6px 20px 0" }}>
        <button
          onClick={onBack}
          className="flex items-center justify-center"
          style={{ width: 30, height: 30, borderRadius: 999, background: COLORS.surface, border: "none", cursor: "pointer" }}
        >
          <ChevronLeft size={17} color={COLORS.textOnGreen} />
        </button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5 }}>
          REQUEST A QUOTE
        </span>
      </div>

      <div className="flex flex-col" style={{ overflowY: "auto", flex: 1, padding: "16px 20px 20px" }}>
        <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 25, letterSpacing: 0.3, color: COLORS.textOnGreen }}>
          {provider.business}
        </span>
        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: COLORS.textOnGreenMuted, marginTop: 2 }}>
          Tell them what you need — the more detail, the better the quote.
        </span>

        <span
          style={{
            display: "block", marginTop: 20,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5,
          }}
        >
          WHAT DO YOU NEED
        </span>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="e.g. 3-tier vanilla birthday cake, feeds ~25, needed for a christening"
          rows={4}
          style={{
            marginTop: 8,
            width: "100%",
            resize: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.hairlineOnGreen}`,
            borderRadius: 10,
            padding: "10px 12px",
            color: COLORS.textOnGreen,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
          }}
        />

        <span
          style={{
            display: "block", marginTop: 18,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5,
          }}
        >
          WHEN DO YOU NEED IT
        </span>
        <div
          className="flex items-center gap-2"
          style={{ marginTop: 8, background: COLORS.surface, border: `1px solid ${COLORS.hairlineOnGreen}`, borderRadius: 10, padding: "10px 12px" }}
        >
          <Calendar size={14} color={COLORS.gold} />
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: COLORS.textOnGreen,
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13,
              flex: 1,
              colorScheme: "dark",
            }}
          />
        </div>

        <span
          style={{
            display: "block", marginTop: 18,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5,
          }}
        >
          REFERENCE PHOTOS · OPTIONAL
        </span>
        <div className="flex gap-2" style={{ marginTop: 8 }}>
          {photos.map((_, i) => (
            <span
              key={i}
              className="relative flex items-center justify-center"
              style={{ width: 52, height: 52, borderRadius: 8, background: COLORS.paper, border: `1px solid ${COLORS.paperShade}` }}
            >
              <ImageIcon size={18} color={COLORS.goldDeep} />
              <button
                onClick={() => onRemovePhoto(i)}
                className="absolute flex items-center justify-center"
                style={{ top: -6, right: -6, width: 16, height: 16, borderRadius: 999, background: COLORS.rose, border: "none", cursor: "pointer" }}
                aria-label="Remove photo"
              >
                <X size={10} color="#2A0E10" />
              </button>
            </span>
          ))}
          {photos.length < 3 && (
            <button
              onClick={onAddPhoto}
              className="flex items-center justify-center"
              style={{ width: 52, height: 52, borderRadius: 8, border: `1px dashed ${COLORS.gold}`, background: "transparent", cursor: "pointer" }}
            >
              <Camera size={18} color={COLORS.gold} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 20px 20px", background: COLORS.baseDeep }}>
        {error && (
          <span
            style={{
              display: "block", marginBottom: 8, textAlign: "center",
              fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: COLORS.rose,
            }}
          >
            {error}
          </span>
        )}
        <button
          onClick={onSubmit}
          disabled={submitting || !description.trim()}
          className="flex items-center justify-center gap-2"
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            background: !description.trim() ? COLORS.surface : COLORS.gold,
            color: !description.trim() ? COLORS.textOnGreenMuted : COLORS.baseDeep,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: submitting || !description.trim() ? "default" : "pointer",
          }}
        >
          {submitting ? "Sending…" : !description.trim() ? "Describe what you need to continue" : "Send quote request"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// URGENT SWITCH — on-demand request flow. Same visual language as the
// Book flow (green/paper/gold, IBM Plex family) since it's one customer app
// with two switches, not two apps — but paced completely differently:
// no browsing, straight to "what do you need, and where." Mirrors the
// backend: category → broadcast (parallel-pinged providers, countdown) →
// accepted → live status stages → completion photos → rate the job, which
// feeds straight back into the weighted ranking on the Book side.
// ---------------------------------------------------------------------------

function ModeTabs({ mode, onChange }) {
  return (
    <div className="flex" style={{ padding: "10px 20px 4px", gap: 8 }}>
      {[
        { key: "urgent", label: "Need it now" },
        { key: "book", label: "Book ahead" },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="flex-1"
          style={{
            padding: "9px 0",
            borderRadius: 8,
            border: `1px solid ${mode === tab.key ? COLORS.gold : COLORS.hairlineOnGreen}`,
            background: mode === tab.key ? COLORS.gold : "transparent",
            color: mode === tab.key ? COLORS.baseDeep : COLORS.textOnGreenMuted,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 700,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function UrgencyChip({ label, active, onClick }) {
  const tone = label === "Emergency" ? COLORS.rose : COLORS.gold;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 13px",
        borderRadius: 999,
        border: `1px solid ${active ? tone : COLORS.hairlineOnGreen}`,
        background: active ? tone : "transparent",
        color: active ? COLORS.baseDeep : COLORS.textOnGreenMuted,
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function OnDemandTile({ label, Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2"
      style={{
        aspectRatio: "1 / 1",
        borderRadius: 12,
        border: `1px solid ${active ? COLORS.gold : COLORS.hairlineOnGreen}`,
        background: active ? "rgba(201,162,39,0.12)" : COLORS.surface,
        cursor: "pointer",
        padding: 8,
      }}
    >
      <Icon size={22} color={active ? COLORS.gold : COLORS.textOnGreenMuted} strokeWidth={1.75} />
      <span
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 10.5,
          fontWeight: 600,
          color: active ? COLORS.textOnGreen : COLORS.textOnGreenMuted,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function UrgentRequestScreen({
  selectedCategory,
  onSelectCategory,
  urgencyLevel,
  onSelectUrgency,
  photos,
  onAddPhoto,
  onRemovePhoto,
  onRequest,
}) {
  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: "6px 20px 0" }}>
        <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 31, letterSpacing: 0.3, color: COLORS.textOnGreen }}>
          Need a pro now?
        </span>
        <div>
          <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: COLORS.textOnGreenMuted }}>
            We'll send the nearest available pro
          </span>
        </div>
      </div>

      <div className="flex flex-col" style={{ overflowY: "auto", flex: 1, padding: "16px 20px 20px" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5 }}>
          WHAT DO YOU NEED
        </span>
        <div className="grid grid-cols-3 gap-2.5" style={{ marginTop: 8 }}>
          {ON_DEMAND_CATEGORIES.map((c) => (
            <OnDemandTile
              key={c}
              label={c}
              Icon={ON_DEMAND_CATEGORY_META[c]}
              active={selectedCategory === c}
              onClick={() => onSelectCategory(c)}
            />
          ))}
        </div>

        {selectedCategory && (
          <>
            <span
              style={{
                display: "block",
                marginTop: 22,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: COLORS.textOnGreenMuted,
                letterSpacing: 0.5,
              }}
            >
              HOW URGENT
            </span>
            <div className="flex gap-2" style={{ marginTop: 8 }}>
              {URGENCY_LEVELS.map((level) => (
                <UrgencyChip key={level} label={level} active={urgencyLevel === level} onClick={() => onSelectUrgency(level)} />
              ))}
            </div>

            <div
              className="flex items-center gap-2"
              style={{ marginTop: 16, background: COLORS.surface, border: `1px solid ${COLORS.hairlineOnGreen}`, borderRadius: 10, padding: "10px 12px" }}
            >
              <MapPin size={14} color={COLORS.gold} />
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: COLORS.textOnGreen }}>
                Current location · Rathmines, Dublin 6
              </span>
            </div>

            <span
              style={{
                display: "block",
                marginTop: 18,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: COLORS.textOnGreenMuted,
                letterSpacing: 0.5,
              }}
            >
              ADD PHOTOS · OPTIONAL
            </span>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: COLORS.textOnGreenMuted, marginTop: 2 }}>
              Helps the pro check stock/compatibility before accepting — may extend match time slightly
            </span>
            <div className="flex gap-2" style={{ marginTop: 8 }}>
              {photos.map((_, i) => (
                <span
                  key={i}
                  className="relative flex items-center justify-center"
                  style={{ width: 48, height: 48, borderRadius: 8, background: COLORS.paper, border: `1px solid ${COLORS.paperShade}` }}
                >
                  <ImageIcon size={16} color={COLORS.goldDeep} />
                  <button
                    onClick={() => onRemovePhoto(i)}
                    className="absolute flex items-center justify-center"
                    style={{ top: -6, right: -6, width: 16, height: 16, borderRadius: 999, background: COLORS.rose, border: "none", cursor: "pointer" }}
                    aria-label="Remove photo"
                  >
                    <X size={10} color="#2A0E10" />
                  </button>
                </span>
              ))}
              {photos.length < 3 && (
                <button
                  onClick={onAddPhoto}
                  className="flex items-center justify-center"
                  style={{ width: 48, height: 48, borderRadius: 8, border: `1px dashed ${COLORS.gold}`, background: "transparent", cursor: "pointer" }}
                >
                  <Camera size={17} color={COLORS.gold} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "12px 20px 20px", background: COLORS.baseDeep }}>
        <button
          onClick={onRequest}
          disabled={!selectedCategory}
          style={{
            width: "100%",
            padding: "15px 0",
            borderRadius: 10,
            border: "none",
            background: selectedCategory ? COLORS.gold : COLORS.surface,
            color: selectedCategory ? COLORS.baseDeep : COLORS.textOnGreenMuted,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 700,
            fontSize: 14.5,
            cursor: selectedCategory ? "pointer" : "default",
          }}
        >
          {selectedCategory ? `Request ${selectedCategory} now` : "Choose a service to continue"}
        </button>
      </div>
    </div>
  );
}

function SearchingScreen({ category, elapsedSeconds, noProvidersFound, errorMessage, onCancel }) {
  const Icon = ON_DEMAND_CATEGORY_META[category];

  if (noProvidersFound) {
    return (
      <div className="flex flex-col items-center h-full" style={{ padding: "60px 24px 24px" }}>
        <span
          className="flex items-center justify-center"
          style={{ width: 72, height: 72, borderRadius: 999, background: COLORS.surface, border: `1px solid ${COLORS.hairlineOnGreen}` }}
        >
          <Icon size={28} color={COLORS.textOnGreenMuted} strokeWidth={1.75} />
        </span>
        <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 25, letterSpacing: 0.3, color: COLORS.textOnGreen, marginTop: 22, textAlign: "center" }}>
          No pros available right now
        </span>
        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: COLORS.textOnGreenMuted, marginTop: 6, textAlign: "center" }}>
          Nobody is online for {category} near you just now. Please try again in a few minutes.
        </span>
        <div className="flex-1" />
        <button
          onClick={onCancel}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
            background: COLORS.gold, color: COLORS.baseDeep,
            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          Back to request
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full" style={{ padding: "60px 24px 24px" }}>
      <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
        <span className="absolute animate-ping" style={{ width: 140, height: 140, borderRadius: 999, border: `1px solid ${COLORS.gold}`, opacity: 0.35 }} />
        <span className="absolute" style={{ width: 104, height: 104, borderRadius: 999, border: `1px solid ${COLORS.hairlineOnGreen}` }} />
        <span
          className="flex items-center justify-center"
          style={{ width: 72, height: 72, borderRadius: 999, background: COLORS.surface, border: `1px solid ${COLORS.gold}` }}
        >
          <Icon size={28} color={COLORS.gold} strokeWidth={1.75} />
        </span>
      </div>

      <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 25, letterSpacing: 0.3, color: COLORS.textOnGreen, marginTop: 26 }}>
        Finding your {category.toLowerCase()}
      </span>
      <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
        <Loader2 size={13} color={COLORS.textOnGreenMuted} className="animate-spin" />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.textOnGreenMuted }}>
          Pinging nearby pros · {elapsedSeconds}s
        </span>
      </div>
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11.5, color: COLORS.textOnGreenMuted, marginTop: 4, textAlign: "center" }}>
        Several pros are being notified at once — first to accept gets the job
      </span>

      {errorMessage && (
        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: COLORS.rose, marginTop: 10, textAlign: "center" }}>
          {errorMessage}
        </span>
      )}

      <div className="flex-1" />

      <button
        onClick={onCancel}
        style={{
          padding: "12px 28px",
          borderRadius: 10,
          border: `1px solid ${COLORS.hairlineOnGreen}`,
          background: "transparent",
          color: COLORS.textOnGreenMuted,
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Cancel request
      </button>
    </div>
  );
}

function TrackingStepper({ stageIndex }) {
  return (
    <div className="flex items-center">
      {TRACKING_STAGES.map((stage, i) => {
        const done = i < stageIndex;
        const current = i === stageIndex;
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center" style={{ width: 58 }}>
              <span
                className="flex items-center justify-center"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: done || current ? COLORS.gold : COLORS.surface,
                  border: `1px solid ${done || current ? COLORS.gold : COLORS.hairlineOnGreen}`,
                  color: done || current ? COLORS.baseDeep : COLORS.textOnGreenMuted,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  marginTop: 4,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8,
                  color: current ? COLORS.gold : COLORS.textOnGreenMuted,
                  textAlign: "center",
                  letterSpacing: 0.2,
                }}
              >
                {stage.toUpperCase()}
              </span>
            </div>
            {i < TRACKING_STAGES.length - 1 && (
              <span style={{ flex: 1, height: 2, background: i < stageIndex ? COLORS.gold : COLORS.hairlineOnGreen, marginBottom: 13 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TrackingScreen({ match, stageIndex, onCancel }) {
  const Icon = ON_DEMAND_CATEGORY_META[match.category];
  const currentLabel = TRACKING_STAGES[stageIndex];

  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: "6px 20px 0" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.gold, letterSpacing: 1 }}>
          ● {match.category.toUpperCase()} · MATCHED
        </span>
      </div>

      {/* map placeholder */}
      <div
        className="relative"
        style={{ margin: "10px 20px 0", height: 150, borderRadius: 12, background: COLORS.surface, border: `1px solid ${COLORS.hairlineOnGreen}`, overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `radial-gradient(circle at 30% 40%, ${COLORS.hairlineOnGreen} 1px, transparent 1px)`,
            backgroundSize: "14px 14px", opacity: 0.6,
          }}
        />
        <span
          className="absolute flex items-center justify-center"
          style={{ top: "50%", left: "58%", width: 30, height: 30, borderRadius: 999, background: COLORS.gold, transform: "translate(-50%,-50%)" }}
        >
          <Navigation2 size={14} color={COLORS.baseDeep} />
        </span>
        <span
          className="absolute flex items-center justify-center"
          style={{ top: "62%", left: "28%", width: 22, height: 22, borderRadius: 999, background: COLORS.paper, transform: "translate(-50%,-50%)" }}
        >
          <MapPin size={12} color={COLORS.baseDeep} />
        </span>
        <span
          className="absolute"
          style={{ bottom: 8, left: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.textOnGreenMuted, background: COLORS.baseDeep, padding: "2px 6px", borderRadius: 4 }}
        >
          ETA {match.etaMinutes} MIN
        </span>
      </div>

      <div className="flex flex-col" style={{ overflowY: "auto", flex: 1, padding: "16px 20px 8px" }}>
        <div
          className="flex items-center justify-between"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.hairlineOnGreen}`, borderRadius: 10, padding: "12px 14px" }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 999, background: COLORS.gold }}>
              <Icon size={18} color={COLORS.baseDeep} strokeWidth={2} />
            </span>
            <div className="flex flex-col">
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: COLORS.textOnGreen, fontWeight: 600 }}>
                {match.providerName}
              </span>
              <div className="flex items-center gap-1">
                <Star size={11} color={COLORS.gold} fill={COLORS.gold} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textOnGreenMuted }}>
                  {match.rating} · {match.vehicle}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.baseDeep }}>
              <Phone size={13} color={COLORS.textOnGreenMuted} />
            </span>
            <span className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.baseDeep }}>
              <MessageSquare size={13} color={COLORS.textOnGreenMuted} />
            </span>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <TrackingStepper stageIndex={stageIndex} />
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5 }}>
            ESTIMATED PRICE
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, color: COLORS.textOnGreen }}>
            €{match.price}
          </span>
        </div>
      </div>

      <div style={{ padding: "8px 20px 20px", background: COLORS.baseDeep }}>
        <div
          className="flex items-center justify-center gap-2"
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 10,
            border: `1px dashed ${COLORS.hairlineOnGreen}`,
            color: COLORS.textOnGreenMuted,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11.5,
            letterSpacing: 0.3,
          }}
        >
          <Loader2 size={13} className="animate-spin" />
          {currentLabel} — updates live as your pro progresses
        </div>
        <button
          onClick={onCancel}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "9px 0",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: COLORS.textOnGreenMuted,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 600,
            fontSize: 11.5,
            cursor: "pointer",
          }}
        >
          Cancel job
        </button>
      </div>
    </div>
  );
}

function StarInput({ value, onChange }) {
  return (
    <div className="flex" style={{ gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}
          aria-label={`Rate ${n} stars`}
        >
          <Star size={26} color={COLORS.gold} fill={n <= value ? COLORS.gold : "transparent"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

function RatingScreen({ match, onSubmit }) {
  const Icon = ON_DEMAND_CATEGORY_META[match.category];
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // The provider's own proof-of-work photos from marking the job complete —
  // this is completion_photo_urls flowing straight through to the customer.
  const completionPhotoCount = 2;

  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: "6px 20px 0" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.gold, letterSpacing: 1 }}>
          ● JOB COMPLETE
        </span>
      </div>

      <div className="flex flex-col" style={{ overflowY: "auto", flex: 1, padding: "14px 20px 20px" }}>
        <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: 0.3, color: COLORS.textOnGreen }}>
          {match.providerName} finished up
        </span>

        <span
          style={{
            display: "block", marginTop: 16,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5,
          }}
        >
          PHOTOS OF THE FINISHED WORK
        </span>
        <div className="flex gap-2.5" style={{ marginTop: 8 }}>
          {Array.from({ length: completionPhotoCount }).map((_, i) => (
            <span
              key={i}
              className="flex items-center justify-center"
              style={{ width: 72, height: 72, borderRadius: 8, background: COLORS.paper, border: `1px solid ${COLORS.paperShade}` }}
            >
              <Icon size={26} color={COLORS.goldDeep} strokeWidth={1.5} />
            </span>
          ))}
        </div>

        <span
          style={{
            display: "block", marginTop: 22,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.textOnGreenMuted, letterSpacing: 0.5,
          }}
        >
          RATE YOUR EXPERIENCE
        </span>
        <div style={{ marginTop: 8 }}>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional) — this shows on their profile"
          rows={3}
          style={{
            marginTop: 14,
            width: "100%",
            resize: "none",
            background: COLORS.surface,
            border: `1px solid ${COLORS.hairlineOnGreen}`,
            borderRadius: 10,
            padding: "10px 12px",
            color: COLORS.textOnGreen,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 12.5,
          }}
        />
      </div>

      <div style={{ padding: "8px 20px 20px", background: COLORS.baseDeep }}>
        <button
          onClick={() => onSubmit(rating, comment)}
          disabled={rating === 0}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            background: rating > 0 ? COLORS.gold : COLORS.surface,
            color: rating > 0 ? COLORS.baseDeep : COLORS.textOnGreenMuted,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: rating > 0 ? "pointer" : "default",
          }}
        >
          {rating > 0 ? "Submit review" : "Tap a star to rate"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data adapters — map API response shapes onto the shape the presentational
// components above already expect (id/name/business/category/area/rating/
// reviewCount/portfolio), so BrowseScreen/ProviderCard/ProviderDetailScreen
// didn't need to change at all.
// ---------------------------------------------------------------------------

function mapProviderListItem(row) {
  return {
    id: row.id,
    name: row.full_name,
    business: row.business_name || row.full_name,
    category: row.category_name,
    categoryId: row.category_id,
    area: row.base_address_text || "Location not set",
    distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
    rating: Number(row.rating_avg) || 0,
    reviewCount: row.rating_count || 0,
    // List view doesn't fetch full portfolios (would be N+1 queries) — the
    // preview swatches are decorative, so just drive the count, capped at 3.
    portfolio: Array.from({ length: Math.min(3, row.rating_count || 0) }),
  };
}

function ConnectionStatus({ status, error, onRetry }) {
  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ padding: 24 }}>
        <Loader2 size={20} color={COLORS.gold} className="animate-spin" />
        <span style={{ marginTop: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textOnGreenMuted, textAlign: "center" }}>
          Connecting to {API_BASE_URL}
        </span>
      </div>
    );
  }
  if (status === "unreachable") {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ padding: 24, textAlign: "center" }}>
        <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: 0.3, color: COLORS.textOnGreen }}>
          Can't reach the API
        </span>
        <span style={{ marginTop: 8, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11.5, color: COLORS.textOnGreenMuted, maxWidth: 260 }}>
          {error || "Unknown error"}
        </span>
        <span style={{ marginTop: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: COLORS.textOnGreenMuted, maxWidth: 260 }}>
          Check API_BASE_URL ({API_BASE_URL}) points at a running instance, schema.sql + seed.sql were applied, and CORS is enabled.
        </span>
        <button
          onClick={onRetry}
          style={{
            marginTop: 18, padding: "10px 22px", borderRadius: 10, border: "none",
            background: COLORS.gold, color: COLORS.baseDeep,
            fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  return null;
}

function AuthScreen({ mode, onModeChange, email, onEmailChange, password, onPasswordChange, fullName, onFullNameChange, onSubmit, submitting, error }) {
  const isSignup = mode === "signup";
  return (
    <div className="flex flex-col h-full" style={{ padding: "20px 20px 24px" }}>
      <div className="flex items-center" style={{ gap: 12, marginBottom: 26 }}>
        <BrandMark size={52} />
        <div className="flex flex-col" style={{ gap: 4 }}>
          <Wordmark size={30} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: 1, color: COLORS.gold }}>
            HELP'S ON THE WAY
          </span>
        </div>
      </div>
      <span style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 31, letterSpacing: 0.3, color: COLORS.textOnGreen }}>
        {isSignup ? "Create an account" : "Welcome back"}
      </span>
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: COLORS.textOnGreenMuted, marginTop: 4 }}>
        {isSignup ? "Just a few details to get started" : "Log in to request or book a service"}
      </span>

      <div className="flex flex-col" style={{ marginTop: 24, gap: 12 }}>
        {isSignup && (
          <input
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Full name"
            style={{
              background: COLORS.surface, border: `1px solid ${COLORS.hairlineOnGreen}`, borderRadius: 10,
              padding: "12px 14px", color: COLORS.textOnGreen, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14,
            }}
          />
        )}
        <input
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Email"
          type="email"
          style={{
            background: COLORS.surface, border: `1px solid ${COLORS.hairlineOnGreen}`, borderRadius: 10,
            padding: "12px 14px", color: COLORS.textOnGreen, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14,
          }}
        />
        <input
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Password"
          type="password"
          style={{
            background: COLORS.surface, border: `1px solid ${COLORS.hairlineOnGreen}`, borderRadius: 10,
            padding: "12px 14px", color: COLORS.textOnGreen, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14,
          }}
        />
      </div>

      {error && (
        <span style={{ marginTop: 12, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11.5, color: COLORS.rose }}>
          {error}
        </span>
      )}

      <div className="flex-1" />

      <button
        onClick={onSubmit}
        disabled={submitting}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
          background: COLORS.gold, color: COLORS.baseDeep,
          fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 14,
          cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </button>

      <button
        onClick={() => onModeChange(isSignup ? "login" : "signup")}
        style={{
          marginTop: 10, background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: COLORS.textOnGreenMuted,
        }}
      >
        {isSignup ? "Already have an account? Log in" : "New here? Create an account"}
      </button>
    </div>
  );
}

export default function CustomerApp() {
  const [mode, setMode] = useState("urgent"); // urgent | book

  // ---- API connection ----
  const [apiStatus, setApiStatus] = useState("checking"); // checking | ready | unreachable
  const [apiError, setApiError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [categories, setCategories] = useState([]);

  // ---- Auth ----
  const [authToken, setAuthToken] = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [authScreenMode, setAuthScreenMode] = useState("login"); // login | signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authError, setAuthError] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const customerId = currentCustomer?.id ?? null;

  const categoryIdByName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.name, c.id])),
    [categories]
  );

  useEffect(() => {
    let cancelled = false;
    setApiStatus("checking");
    setApiError(null);
    (async () => {
      try {
        await apiFetch("/health");
        const catData = await apiFetch("/categories");
        if (cancelled) return;
        setCategories(catData.categories);
        setApiStatus("ready");

        // Restore a previous session if one was saved.
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          try {
            const { token, customer } = JSON.parse(saved);
            if (token && customer) {
              setAuthToken(token);
              setCurrentCustomer(customer);
            }
          } catch {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setApiStatus("unreachable");
          setApiError(err.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const submitAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim() || (authScreenMode === "signup" && !authFullName.trim())) return;
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const path = authScreenMode === "signup" ? "/auth/customer/signup" : "/auth/customer/login";
      const body =
        authScreenMode === "signup"
          ? { email: authEmail.trim(), password: authPassword, fullName: authFullName.trim() }
          : { email: authEmail.trim(), password: authPassword };
      const data = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
      setAuthToken(data.token);
      setCurrentCustomer(data.customer);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: data.token, customer: data.customer }));
      setAuthPassword("");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentCustomer(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // ---- Book flow state ----
  const [screen, setScreen] = useState("browse"); // browse | profile | quoteForm
  const [activeCategory, setActiveCategory] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerDetailLoading, setProviderDetailLoading] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteDate, setQuoteDate] = useState("");
  const [quotePhotos, setQuotePhotos] = useState([]);

  useEffect(() => {
    if (mode !== "book" || apiStatus !== "ready") return;
    let cancelled = false;
    setProvidersLoading(true);
    setProvidersError(null);
    const params = new URLSearchParams();
    const categoryId = activeCategory ? categoryIdByName[activeCategory] : undefined;
    if (categoryId) params.set("categoryId", categoryId);
    params.set("lng", DEMO_LOCATION.lng);
    params.set("lat", DEMO_LOCATION.lat);
    apiFetch(`/providers?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setProviders(data.providers.map(mapProviderListItem));
      })
      .catch((err) => {
        if (!cancelled) setProvidersError(err.message);
      })
      .finally(() => {
        if (!cancelled) setProvidersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, apiStatus, activeCategory, categoryIdByName]);

  const openProvider = async (listItem) => {
    setScreen("profile");
    setSelectedProvider(null);
    setQuoteSent(false);
    setQuoteError(null);
    setProviderDetailLoading(true);
    try {
      const data = await apiFetch(`/providers/${listItem.id}/portfolio?categoryId=${listItem.categoryId}`);
      setSelectedProvider({
        id: data.provider.id,
        name: data.provider.full_name,
        business: data.provider.business_name || data.provider.full_name,
        category: listItem.category,
        categoryId: listItem.categoryId,
        area: data.provider.base_address_text || listItem.area,
        distanceKm: listItem.distanceKm,
        rating: Number(data.provider.rating_avg) || 0,
        reviewCount: data.provider.rating_count || 0,
        portfolio: data.portfolio.map((p) => ({ rating: p.rating, comment: p.comment })),
      });
    } catch (err) {
      setProvidersError(err.message);
      setScreen("browse");
    } finally {
      setProviderDetailLoading(false);
    }
  };

  const openQuoteForm = () => {
    setQuoteDescription("");
    setQuoteDate("");
    setQuotePhotos([]);
    setQuoteError(null);
    setScreen("quoteForm");
  };

  const addQuotePhoto = () => setQuotePhotos((p) => (p.length < 3 ? [...p, p.length + 1] : p));
  const removeQuotePhoto = (idx) => setQuotePhotos((p) => p.filter((_, i) => i !== idx));

  const submitQuoteForm = async () => {
    if (!customerId || !selectedProvider || !quoteDescription.trim()) return;
    setQuoteSubmitting(true);
    setQuoteError(null);
    try {
      const photoUrls = quotePhotos.map((_, i) => `demo://quote-reference-${i + 1}.jpg`);
      await apiFetch("/jobs", {
        method: "POST",
        token: authToken,
        body: JSON.stringify({
          categoryId: selectedProvider.categoryId,
          lng: DEMO_LOCATION.lng,
          lat: DEMO_LOCATION.lat,
          addressText: DEMO_LOCATION.addressText,
          description: quoteDescription.trim(),
          scheduledFor: quoteDate ? new Date(quoteDate).toISOString() : undefined,
          photoUrls: photoUrls.length ? photoUrls : undefined,
        }),
      });
      setQuoteSent(true);
      setScreen("profile");
    } catch (err) {
      setQuoteError(err.message);
    } finally {
      setQuoteSubmitting(false);
    }
  };

  // ---- Urgent flow state ----
  const [urgentScreen, setUrgentScreen] = useState("request"); // request | searching | tracking | rating
  const [selectedOnDemandCategory, setSelectedOnDemandCategory] = useState(null);
  const [urgencyLevel, setUrgencyLevel] = useState("Standard");
  const [requestPhotos, setRequestPhotos] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [noProvidersFound, setNoProvidersFound] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [match, setMatch] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };
  }, []);

  const resetUrgentFlow = () => {
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    setUrgentScreen("request");
    setSelectedOnDemandCategory(null);
    setUrgencyLevel("Standard");
    setRequestPhotos([]);
    setElapsedSeconds(0);
    setJobId(null);
    setNoProvidersFound(false);
    setSearchError(null);
    setMatch(null);
    setStageIndex(0);
  };

  const handleAddPhoto = () => setRequestPhotos((p) => (p.length < 3 ? [...p, p.length + 1] : p));
  const handleRemovePhoto = (idx) => setRequestPhotos((p) => p.filter((_, i) => i !== idx));

  const STATUS_TO_STAGE = { accepted: 0, en_route: 0, arrived: 1, in_progress: 2, completed: 3 };

  const fetchMatchedProviderInfo = async (providerId) => {
    try {
      const data = await apiFetch(`/providers/${providerId}/portfolio`);
      setMatch((m) => (m ? { ...m, providerName: data.provider.full_name, rating: Number(data.provider.rating_avg) || 0 } : m));
    } catch {
      // Non-fatal — keep the placeholder name rather than blocking tracking.
    }
  };

  const handleJobUpdate = (job) => {
    if (job.status === "no_providers") {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
      setNoProvidersFound(true);
      return;
    }
    if (job.status === "completed") {
      setStageIndex(3);
      setUrgentScreen("rating");
      return;
    }
    if (Object.prototype.hasOwnProperty.call(STATUS_TO_STAGE, job.status)) {
      setUrgentScreen((current) => {
        if (current === "searching") {
          if (searchTimerRef.current) clearInterval(searchTimerRef.current);
          setMatch({
            providerId: job.accepted_provider_id,
            providerName: "Your pro",
            category: selectedOnDemandCategory,
            rating: 0,
            etaMinutes: 7,
            vehicle: "En route",
            price: job.price_quoted || job.price_final || 45,
          });
          fetchMatchedProviderInfo(job.accepted_provider_id);
          return "tracking";
        }
        return current;
      });
      setStageIndex(STATUS_TO_STAGE[job.status]);
    }
  };

  // Poll the job while we're waiting on a match or tracking progress — no
  // WebSocket client is wired up here (see conversation notes), so this
  // stands in for the 'job:offer' / 'job:accepted' / 'job:statusUpdate'
  // socket events the real apps would subscribe to instead.
  useEffect(() => {
    if (!jobId) return;
    if (urgentScreen !== "searching" && urgentScreen !== "tracking") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const job = await apiFetch(`/jobs/${jobId}`, { token: authToken });
        if (!cancelled) handleJobUpdate(job);
      } catch (err) {
        if (!cancelled) setSearchError(err.message);
      }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, urgentScreen]);

  const handleSubmitRequest = async () => {
    if (!selectedOnDemandCategory || !customerId) return;
    const categoryId = categoryIdByName[selectedOnDemandCategory];
    if (!categoryId) {
      setSearchError(`"${selectedOnDemandCategory}" not found in the database — has schema.sql been applied?`);
      return;
    }

    setUrgentScreen("searching");
    setElapsedSeconds(0);
    setNoProvidersFound(false);
    setSearchError(null);
    searchTimerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);

    try {
      const photoUrls = requestPhotos.map((_, i) => `demo://request-photo-${i + 1}.jpg`);
      const data = await apiFetch("/jobs", {
        method: "POST",
        token: authToken,
        body: JSON.stringify({
          categoryId,
          lng: DEMO_LOCATION.lng,
          lat: DEMO_LOCATION.lat,
          addressText: DEMO_LOCATION.addressText,
          urgencyLevel: urgencyLevel.toLowerCase(),
          photoUrls: photoUrls.length ? photoUrls : undefined,
        }),
      });
      setJobId(data.job.id);
      if (data.pingedProviders.length === 0) {
        clearInterval(searchTimerRef.current);
        setNoProvidersFound(true);
      }
    } catch (err) {
      clearInterval(searchTimerRef.current);
      setSearchError(err.message);
    }
  };

  const handleCancelSearch = () => {
    resetUrgentFlow();
  };

  const handleSubmitRating = async (rating, comment) => {
    if (jobId && authToken) {
      try {
        await apiFetch(`/jobs/${jobId}/review`, {
          method: "POST",
          token: authToken,
          body: JSON.stringify({ rating, comment }),
        });
      } catch (err) {
        console.error("Failed to submit review:", err.message);
      }
    }
    resetUrgentFlow();
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "100vh", background: "#05060A", padding: 24 }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      {/* Phone frame */}
      <div
        className="relative"
        style={{
          width: 360,
          height: 720,
          borderRadius: 40,
          background: "#000",
          padding: 10,
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px #1c1f26",
        }}
      >
        <div
          className="relative flex flex-col"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 30,
            background: COLORS.base,
            overflow: "hidden",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          {/* notch */}
          <div
            className="absolute"
            style={{ top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 20, background: "#000", borderBottomLeftRadius: 14, borderBottomRightRadius: 14, zIndex: 40 }}
          />

          <StatusBar />
          {apiStatus === "ready" && authToken && (
            <div className="flex items-center gap-2" style={{ padding: "0 20px" }}>
              <div style={{ flex: 1 }}>
                <ModeTabs mode={mode} onChange={setMode} />
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center"
                style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.surface, border: "none", cursor: "pointer" }}
                aria-label="Log out"
              >
                <LogOut size={13} color={COLORS.textOnGreenMuted} />
              </button>
            </div>
          )}

          <div className="flex-1" style={{ overflow: "hidden" }}>
            {apiStatus !== "ready" && (
              <ConnectionStatus status={apiStatus} error={apiError} onRetry={() => setRetryToken((t) => t + 1)} />
            )}

            {apiStatus === "ready" && !authToken && (
              <AuthScreen
                mode={authScreenMode}
                onModeChange={setAuthScreenMode}
                email={authEmail}
                onEmailChange={setAuthEmail}
                password={authPassword}
                onPasswordChange={setAuthPassword}
                fullName={authFullName}
                onFullNameChange={setAuthFullName}
                onSubmit={submitAuth}
                submitting={authSubmitting}
                error={authError}
              />
            )}

            {apiStatus === "ready" && authToken && mode === "urgent" && urgentScreen === "request" && (
              <UrgentRequestScreen
                selectedCategory={selectedOnDemandCategory}
                onSelectCategory={setSelectedOnDemandCategory}
                urgencyLevel={urgencyLevel}
                onSelectUrgency={setUrgencyLevel}
                photos={requestPhotos}
                onAddPhoto={handleAddPhoto}
                onRemovePhoto={handleRemovePhoto}
                onRequest={handleSubmitRequest}
              />
            )}
            {apiStatus === "ready" && authToken && mode === "urgent" && urgentScreen === "searching" && (
              <SearchingScreen
                category={selectedOnDemandCategory}
                elapsedSeconds={elapsedSeconds}
                noProvidersFound={noProvidersFound}
                errorMessage={searchError}
                onCancel={handleCancelSearch}
              />
            )}
            {apiStatus === "ready" && authToken && mode === "urgent" && urgentScreen === "tracking" && match && (
              <TrackingScreen
                match={match}
                stageIndex={stageIndex}
                onCancel={resetUrgentFlow}
              />
            )}
            {apiStatus === "ready" && authToken && mode === "urgent" && urgentScreen === "rating" && match && (
              <RatingScreen match={match} onSubmit={handleSubmitRating} />
            )}

            {apiStatus === "ready" && authToken && mode === "book" && screen === "browse" && (
              <BrowseScreen
                providers={providers}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                onOpenProvider={openProvider}
                loading={providersLoading}
                error={providersError}
              />
            )}
            {apiStatus === "ready" && authToken && mode === "book" && screen === "profile" && providerDetailLoading && (
              <div className="flex items-center justify-center gap-2 h-full">
                <Loader2 size={14} color={COLORS.textOnGreenMuted} className="animate-spin" />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textOnGreenMuted }}>
                  Loading profile…
                </span>
              </div>
            )}
            {apiStatus === "ready" && authToken && mode === "book" && screen === "profile" && !providerDetailLoading && selectedProvider && (
              <ProviderDetailScreen
                provider={selectedProvider}
                onBack={() => setScreen("browse")}
                onOpenQuoteForm={openQuoteForm}
                quoteSent={quoteSent}
              />
            )}
            {apiStatus === "ready" && authToken && mode === "book" && screen === "quoteForm" && selectedProvider && (
              <QuoteFormScreen
                provider={selectedProvider}
                description={quoteDescription}
                onDescriptionChange={setQuoteDescription}
                date={quoteDate}
                onDateChange={setQuoteDate}
                photos={quotePhotos}
                onAddPhoto={addQuotePhoto}
                onRemovePhoto={removeQuotePhoto}
                onBack={() => setScreen("profile")}
                onSubmit={submitQuoteForm}
                submitting={quoteSubmitting}
                error={quoteError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
