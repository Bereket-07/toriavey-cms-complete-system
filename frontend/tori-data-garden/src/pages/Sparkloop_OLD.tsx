import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ArrowRight,
  Info,
  SlidersHorizontal,
  Filter,
  CalendarDays,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList } from "recharts";
import { parseISO, format, formatDistanceToNow } from "date-fns";
import { useLoading } from "@/components/ui/LoadingContext";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PartnerProfile = {
  uuid: string;
  name: string;
  partner_network_status?: string;
  stripe_connected?: boolean;
};

type SparkloopMeta = {
  per_page?: number;
  page?: number;
  total_pages?: number;
  total_partner_campaigns?: number;
  total_subscribers?: number;
};

type Recommendation = {
  uuid: string;
  name?: string | null;
  status?: string | null;
  referral_link?: string | null;
  campaign_type?: string | null;
  accepted_terms_at?: string | null;
  referral_pending_period?: number | null;
  remaining_budget_dollars?: number | null;
  partner_program_uuid?: string | null;
  cpa?: number | null;
  max_payout?: number | null;
};

type RecommendationsResponse = {
  partner_campaigns?: Recommendation[];
  meta?: SparkloopMeta;
};

type Subscriber = {
  uuid: string;
  email: string;
  name?: string | null;
  status?: string | null;
  origin?: string | null;
  country_code?: string | null;
  created_at?: string | null;
  cpa?: number | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
};

type SubscribersResponse = {
  subscribers?: Subscriber[];
  meta?: SparkloopMeta;
};

type PartnerProfileResponse = {
  partner_profile?: PartnerProfile | null;
};

type SummaryMetric = {
  label: string;
  value: string;
  helper?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return numberFormatter.format(value);
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return currencyFormatter.format(value);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(parseISO(value), "PP p");
  } catch {
    return value;
  }
};

const normalizeStatus = (value?: string | null) => {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const badgeTone = (status?: string | null) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "active" || normalized === "confirmed" || normalized === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "pending" || normalized === "paused") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
};

type Trend = "up" | "down" | "flat";

type PerformanceMetric = {
  label: string;
  value: string;
  change: number; // percent change vs previous period
  trend: Trend;
};

// Derived metrics will replace the static placeholder values above
// We keep a minimal structure ready and populate from live data
const initialPerformance: PerformanceMetric[] = [
  { label: "total referrals", value: "—", change: 0, trend: "flat" },
  { label: "expected net earnings", value: "—", change: 0, trend: "flat" },
  { label: "expected next payout", value: "—", change: 0, trend: "flat" },
];

// KPI value shapes and state for dynamic computation
type KpiValues = {
  referrals: number;
  net: number; // expected net earnings (sum of CPA for recent referrals)
  payout: number; // expected next payout (sum of confirmed CPA in window)
};

type KpiState = {
  last: KpiValues | null; // last 30 days
  prev: KpiValues | null; // previous 30 days
};

const insights = [
  {
    title: "Best Performing Campaign",
    value: "Welcome Series",
    description: "Drives 58% of total referrals with consistent weekly growth.",
  },
  {
    title: "New Partner Spotlight",
    value: "Kitchen Essentials Co.",
    description: "Fresh collaboration launching tomorrow – preload links to capture early conversions.",
  },
];

const generalPerformance = [
  {
    label: "total referrals",
    value: "622",
    change: 43,
    trend: "up" as const,
  },
  {
    label: "expected net earnings",
    value: "$235",
    change: 97,
    trend: "up" as const,
  },
];

const generalBreakdown = [
  {
    label: "confirmed referrals",
    value: "37",
  },
  {
    label: "pending referrals",
    value: "421",
  },
  {
    label: "rejected referrals",
    value: "164",
  },
];

const earningsBreakdown = [
  {
    label: "confirmed net earnings",
    value: "$37",
  },
  {
    label: "projected net earnings",
    value: "$198",
  },
];

const engagementMetrics = [
  {
    label: "Referral Confirmation Rate",
    value: "26.1%",
    change: 17,
    trend: "up" as const,
  },
  {
    label: "avg. screening duration",
    value: "18 days",
    change: 20,
    trend: "down" as const,
  },
];

const revenueTrendTotals = [
  { date: "2025-09-02", total: 8.04 },
  { date: "2025-09-03", total: 2.39 },
  { date: "2025-09-04", total: 2.14 },
  { date: "2025-09-05", total: 2.45 },
  { date: "2025-09-06", total: 0.3 },
  { date: "2025-09-07", total: 20.3 },
  { date: "2025-09-08", total: 4.24 },
  { date: "2025-09-09", total: 5.49 },
  { date: "2025-09-10", total: 8.54 },
  { date: "2025-09-11", total: 0.76 },
  { date: "2025-09-12", total: 3.74 },
  { date: "2025-09-13", total: 0 },
  { date: "2025-09-14", total: 3.88 },
  { date: "2025-09-15", total: 8.45 },
  { date: "2025-09-16", total: 1.39 },
  { date: "2025-09-17", total: 18.8 },
  { date: "2025-09-18", total: 10.51 },
  { date: "2025-09-19", total: 16.96 },
  { date: "2025-09-20", total: 10.05 },
  { date: "2025-09-21", total: 26.06 },
  { date: "2025-09-22", total: 23.81 },
  { date: "2025-09-23", total: 5.83 },
  { date: "2025-09-24", total: 4.98 },
  { date: "2025-09-25", total: 10.32 },
  { date: "2025-09-26", total: 4.59 },
  { date: "2025-09-27", total: 4.03 },
  { date: "2025-09-28", total: 12.91 },
  { date: "2025-09-29", total: 5.79 },
  { date: "2025-09-30", total: 6.6 },
  { date: "2025-10-01", total: 1.34 },
];

const revenueTrendData = revenueTrendTotals.map((item, index) => {
  const ratio = [0.32, 0.22, 0.28][index % 3];
  const confirmed = Number((item.total * ratio).toFixed(2));
  const projected = Number((item.total - confirmed).toFixed(2));

  return {
    ...item,
    confirmed,
    projected,
  };
});

const revenueChartConfig: ChartConfig = {
  confirmed: {
    label: "Confirmed earnings",
    color: "#6050b7",
  },
  projected: {
    label: "Projected earnings",
    color: "#cfc3ff",
  },
};

const channelEarnings = [
  { channel: "Upscribe", value: 196 },
  { channel: "Magic Link", value: 18 },
  { channel: "Partner Link", value: 9 },
  { channel: "Recommendations Hub", value: 44 },
];

const channelChartConfig: ChartConfig = {
  value: {
    label: "Net earnings",
    color: "#d7ccff",
  },
};

export default function Sparkloop() {
  const { showLoading } = useLoading();
  const { isAuthenticated, logout } = useAuth();

  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [recsMeta, setRecsMeta] = useState<SparkloopMeta | undefined>(undefined);
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [subsMeta, setSubsMeta] = useState<SparkloopMeta | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>(initialPerformance);

  const [recsPage, setRecsPage] = useState<number>(1);
  const [subsPage, setSubsPage] = useState<number>(1);
  const perPage = 10;

  type MetricsSummary = {
    total_referrals: number;
    total_referrals_change_pct: number;
    expected_net_earnings: number;
    expected_net_earnings_change_pct: number;
    expected_next_payout: number;
    expected_next_payout_change_pct: number;
  };

  const loadSummary = useCallback(async () => {
    try {
      const s = await apiGet<MetricsSummary>(`/api/v1/sparkloop/metrics/summary?days=30`);
      const toTrend = (change: number): Trend => (change > 0 ? "up" : change < 0 ? "down" : "flat");
      setPerformanceMetrics([
        {
          label: "total referrals",
          value: formatNumber(s.total_referrals),
          change: Math.abs(s.total_referrals_change_pct),
          trend: toTrend(s.total_referrals_change_pct),
        },
        {
          label: "expected net earnings",
          value: formatCurrency(s.expected_net_earnings),
          change: Math.abs(s.expected_net_earnings_change_pct),
          trend: toTrend(s.expected_net_earnings_change_pct),
        },
        {
          label: "expected next payout",
          value: formatCurrency(s.expected_next_payout),
          change: Math.abs(s.expected_next_payout_change_pct),
          trend: toTrend(s.expected_next_payout_change_pct),
        },
      ]);
    } catch (e: any) {
      const msg = e?.message || "Failed to load KPIs";
      setError((prev) => prev ?? msg);
      if (String(msg).includes("401")) logout();
    }
  }, [logout]);

  const loadAll = useCallback(async (opts?: { keepPages?: boolean }) => {
    setLoading(true);
    setError(null);
    const rp = opts?.keepPages ? recsPage : 1;
    const sp = opts?.keepPages ? subsPage : 1;
    try {
      // Partner profile
      try {
        const p = await apiGet<PartnerProfileResponse>("/api/v1/sparkloop/partner_profile");
        setProfile(p.partner_profile ?? null);
      } catch (e: any) {
        const msg = e?.message || "Failed to load partner profile";
        setError((prev) => prev ?? msg);
        if (String(msg).includes("401")) logout();
      }

      // Recommendations
      try {
        const r = await apiGet<RecommendationsResponse>(`/api/v1/sparkloop/partner_profile/partner_campaigns?page=${rp}&per_page=${perPage}`);
        setRecs(r.partner_campaigns ?? []);
        setRecsMeta(r.meta);
      } catch (e: any) {
        const msg = e?.message || "Failed to load recommendations";
        setError((prev) => prev ?? msg);
        if (String(msg).includes("401")) logout();
      }

      // Subscribers (may be intermittently 5xx; don't fail whole view)
      try {
        const s = await apiGet<SubscribersResponse>(
          `/api/v1/sparkloop/subscribers?page=${sp}&per_page=${perPage}`
        );
        setSubs(s.subscribers ?? []);
        setSubsMeta(s.meta);
      } catch (e: any) {
        const msg = e?.message || "Failed to load subscribers";
        // Keep whatever we had; just surface the issue
        setError((prev) => prev ?? (String(msg).includes("502") ? "SparkLoop subscribers are temporarily unavailable (502)" : msg));
        if (String(msg).includes("401")) logout();
      }

      if (!opts?.keepPages) {
        setRecsPage(1);
        setSubsPage(1);
      }
    } finally {
      setLoading(false);
    }
  }, [recsPage, subsPage]);

  useEffect(() => {
    // Ensure we only load when authenticated so the Authorization header is present
    if (isAuthenticated) {
      loadAll();
      loadSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const changeRecsPage = async (delta: number) => {
    const next = Math.max(1, (recsPage || 1) + delta);
    if (recsMeta?.total_pages && next > recsMeta.total_pages) return;
    setLoading(true);
    setError(null);
    try {
      const r = await apiGet<RecommendationsResponse>(`/api/v1/sparkloop/partner_profile/partner_campaigns?page=${next}&per_page=${perPage}`);
      setRecs(r.partner_campaigns ?? []);
      setRecsMeta(r.meta);
      setRecsPage(next);
    } catch (e: any) {
      const msg = e?.message || "Failed to load recommendations";
      setError(msg);
      if (typeof msg === "string" && msg.includes("401")) {
        // Token missing/expired – clear and redirect to login
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const changeSubsPage = async (delta: number) => {
    const next = Math.max(1, (subsPage || 1) + delta);
    if (subsMeta?.total_pages && next > subsMeta.total_pages) return;
    setLoading(true);
    setError(null);
    try {
      const s = await apiGet<SubscribersResponse>(`/api/v1/sparkloop/subscribers?page=${next}&per_page=${perPage}`);
      setSubs(s.subscribers ?? []);
      setSubsMeta(s.meta);
      setSubsPage(next);
    } catch (e: any) {
      const msg = e?.message || "Failed to load subscribers";
      setError(msg);
      if (typeof msg === "string" && msg.includes("401")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    showLoading?.(1200);
    await loadAll({ keepPages: true });
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-xl bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="mb-2 text-4xl font-playfair font-bold text-foreground">Sparkloop</h1>
            <p className="text-lg text-muted-foreground">
              Monitor paid recommendation performance and upcoming payouts at a glance.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-full border-[#dacfff] bg-white text-[#4d3c7b] shadow-sm hover:bg-[#f1e9ff]"
          onClick={onRefresh}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Refresh
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load SparkLoop data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Live Partner Profile summary */}
      <section className="rounded-[20px] border border-[#efe6ff] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c7bbf]">Live</p>
            <h2 className="mt-1 text-2xl font-playfair font-bold text-[#33235d]">Partner profile</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={badgeTone(profile?.partner_network_status)}>
              {normalizeStatus(profile?.partner_network_status)}
            </Badge>
            <Badge className={profile?.stripe_connected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
              {profile?.stripe_connected ? "Stripe Connected" : "Stripe Not Connected"}
            </Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Account</CardDescription>
              <CardTitle className="text-xl">{profile?.name ?? <Skeleton className="h-6 w-40" />}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">UUID: {profile?.uuid ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Dataset size</CardDescription>
              <CardTitle className="text-xl">
                {subsMeta?.total_subscribers ? numberFormatter.format(subsMeta.total_subscribers) : <Skeleton className="h-6 w-24" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Total subscribers</CardContent>
          </Card>
        </div>
      </section>

      <section className="rounded-[32px] border border-[#e4d8ff] bg-gradient-to-b from-[#f9f5ff] to-white shadow-[0_20px_45px_-30px_rgba(93,63,211,0.45)]">
        <div className="px-8 py-9 space-y-8">
          <header className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8c7bbf]">Overview</p>
            <h2 className="text-3xl font-playfair font-bold text-[#33235d]">Paid Recommendations</h2>
          </header>

          <div className="rounded-3xl border border-[#efe6ff] bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-[#7b6ca6]">Past 30 days performance</p>
            <div className="mt-6 grid gap-6 md:grid-cols-[repeat(5,minmax(0,auto))] md:items-center">
              {performanceMetrics.map((metric, index) => (
                <Fragment key={metric.label}>
                  <div className="flex flex-col gap-3 min-w-[180px]">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold tracking-tight text-[#2a1f4d]">{metric.value}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          metric.trend === "up"
                            ? "bg-emerald-100 text-emerald-600"
                            : metric.trend === "down"
                            ? "bg-rose-100 text-rose-600"
                            : "bg-[#f1f0f5] text-[#6d5f92]"
                        }`}
                      >
                        {metric.trend === "up" ? "+" : metric.trend === "down" ? "-" : ""}
                        {Math.abs(metric.change)}%
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="text-sm font-medium capitalize text-[#6d5f92]">{metric.label}</p>
                  </div>
                  {index < performanceMetrics.length - 1 && (
                    <ArrowRight className="hidden md:block h-5 w-5 justify-self-center text-[#b19bff]" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {insights.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-[#e9defd] bg-white/95 p-6 shadow-[0_15px_35px_-25px_rgba(93,63,211,0.45)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c7bbf]">{item.title}</p>
            <h3 className="mt-3 text-2xl font-playfair font-bold text-[#2a1f4d]">{item.value}</h3>
            <p className="mt-2 text-sm text-[#6d5f92]">{item.description}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[32px] border border-[#e4d8ff] bg-gradient-to-b from-[#faf6ff] to-white shadow-[0_25px_55px_-35px_rgba(93,63,211,0.55)]">
        <div className="px-8 py-9 space-y-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8c7bbf]">Advanced Reports</p>
              <h2 className="mt-2 text-3xl font-playfair font-bold text-[#33235d]">Referrals Insights</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="gap-2 rounded-full border-[#dacfff] bg-white text-[#4d3c7b] shadow-sm hover:bg-[#f1e9ff]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-full border-[#dacfff] bg-white text-[#4d3c7b] shadow-sm hover:bg-[#f1e9ff]"
              >
                <Filter className="h-4 w-4" />
                Filter by Paid Recommendation
              </Button>
            </div>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-medium text-[#7b6ca6]">
              Referrals Added in Period: <span className="font-semibold text-[#4d3c7b]">Sep 02 - Oct 01</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="gap-2 rounded-full border-[#dacfff] bg-white text-[#4d3c7b] shadow-sm hover:bg-[#f1e9ff]"
              >
                Day
                <ChevronDown className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-[#dacfff] bg-white px-4 py-2 text-sm font-medium text-[#4d3c7b] shadow-sm">
                <CalendarDays className="h-4 w-4" />
                Sep 2, 2025 – Oct 1, 2025
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="rounded-3xl border border-[#efe6ff] bg-white/95 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c7bbf]">General Performance</p>
                </div>
                <button className="text-xs font-semibold text-[#7b6ca6] underline-offset-4 hover:underline">Learn</button>
              </div>

              <div className="mt-6 flex flex-wrap gap-6">
                {generalPerformance.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-2 min-w-[160px]">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold tracking-tight text-[#2a1f4d]">{metric.value}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          metric.trend === "up"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {metric.trend === "up" ? "+" : "-"}
                        {Math.abs(metric.change)}%
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="text-sm font-medium capitalize text-[#6d5f92]">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  {generalBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl bg-[#f7f1ff] px-4 py-3">
                      <span className="text-sm font-medium text-[#7b6ca6] capitalize">{item.label}</span>
                      <span className="text-base font-semibold text-[#4d3c7b]">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {earningsBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl bg-[#f7f1ff] px-4 py-3">
                      <span className="text-sm font-medium text-[#7b6ca6] capitalize">{item.label}</span>
                      <span className="text-base font-semibold text-[#4d3c7b]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#efe6ff] bg-white/95 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c7bbf]">Referrals Engagement</p>
                <button className="text-xs font-semibold text-[#7b6ca6] underline-offset-4 hover:underline">Learn</button>
              </div>

              <div className="mt-8 space-y-6">
                {engagementMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl bg-[#f7f1ff] p-5">
                    <p className="text-sm font-medium text-[#7b6ca6]">{metric.label}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-3xl font-bold text-[#2a1f4d]">{metric.value}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          metric.trend === "up"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {metric.trend === "up" ? "+" : "-"}
                        {Math.abs(metric.change)}%
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live recommendations and subscribers tables */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[20px] border border-[#efe6ff] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c7bbf]">Live</p>
              <h3 className="mt-1 text-xl font-playfair font-bold text-[#33235d]">Recommendations</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              Page {recsMeta?.page ?? recsPage}/{recsMeta?.total_pages ?? "?"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">Max payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && recs.length === 0 ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  recs.map((r) => (
                    <TableRow key={r.uuid}>
                      <TableCell className="max-w-[220px] truncate" title={r.name ?? undefined}>{r.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={badgeTone(r.status)}>{normalizeStatus(r.status)}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{r.campaign_type ?? "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.cpa)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.max_payout)}</TableCell>
                    </TableRow>
                  ))
                )}
                {(!loading && recs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No recommendations found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {(recsMeta?.page ? (recsMeta.page - 1) * (recsMeta?.per_page ?? perPage) + 1 : (recsPage - 1) * perPage + 1)}–
              {(recsMeta?.page ? Math.min((recsMeta.page) * (recsMeta?.per_page ?? perPage), (recsMeta?.total_partner_campaigns ?? recs.length)) : recsPage * perPage)} of {recsMeta?.total_partner_campaigns ?? "?"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full" disabled={loading || (recsMeta?.page ?? recsPage) <= 1} onClick={() => changeRecsPage(-1)}>Prev</Button>
              <Button variant="outline" className="rounded-full" disabled={loading || (!!recsMeta?.total_pages && (recsMeta.page ?? recsPage) >= (recsMeta.total_pages ?? 1))} onClick={() => changeRecsPage(1)}>Next</Button>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#efe6ff] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c7bbf]">Live</p>
              <h3 className="mt-1 text-xl font-playfair font-bold text-[#33235d]">Recent subscribers</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              Page {subsMeta?.page ?? subsPage}/{subsMeta?.total_pages ?? "?"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && subs.length === 0 ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-52" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  subs.map((s) => (
                    <TableRow key={s.uuid}>
                      <TableCell className="max-w-[260px] truncate" title={s.email}>{s.email}</TableCell>
                      <TableCell>
                        <Badge className={badgeTone(s.status)}>{normalizeStatus(s.status)}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{s.origin ?? "—"}</TableCell>
                      <TableCell>{s.country_code ?? "—"}</TableCell>
                      <TableCell title={s.created_at ?? undefined}>{formatDateTime(s.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
                {(!loading && subs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No subscribers found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {(subsMeta?.page ? (subsMeta.page - 1) * (subsMeta?.per_page ?? perPage) + 1 : (subsPage - 1) * perPage + 1)}–
              {(subsMeta?.page ? Math.min((subsMeta.page) * (subsMeta?.per_page ?? perPage), (subsMeta?.total_subscribers ?? subs.length)) : subsPage * perPage)} of {subsMeta?.total_subscribers ?? "?"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full" disabled={loading || (subsMeta?.page ?? subsPage) <= 1} onClick={() => changeSubsPage(-1)}>Prev</Button>
              <Button variant="outline" className="rounded-full" disabled={loading || (!!subsMeta?.total_pages && (subsMeta.page ?? subsPage) >= (subsMeta.total_pages ?? 1))} onClick={() => changeSubsPage(1)}>Next</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-[#e4d8ff] bg-gradient-to-b from-[#fefbff] to-white shadow-[0_25px_55px_-35px_rgba(93,63,211,0.45)]">
        <div className="px-8 py-9 space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8c7bbf]">Daily Earnings</p>
              <h2 className="mt-2 text-3xl font-playfair font-bold text-[#33235d]">Payout Momentum</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="gap-2 rounded-full border-[#dacfff] bg-white text-[#4d3c7b] shadow-sm hover:bg-[#f1e9ff]"
              >
                Export CSV
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-full border-[#dacfff] bg-white text-[#4d3c7b] shadow-sm hover:bg-[#f1e9ff]"
              >
                Compare Period
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="rounded-3xl border border-[#efe6ff] bg-white/95 p-6 shadow-sm">
            <ChartContainer config={revenueChartConfig} className="h-[340px] w-full">
              <BarChart data={revenueTrendData} barCategoryGap={20}>
                <CartesianGrid strokeDasharray="4 6" stroke="#e8ddff" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={14}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  tick={{ fill: "#7b6ca6", fontSize: 12 }}
                  tickFormatter={(value: string) => format(parseISO(value), "MMM dd")}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  width={50}
                  tick={{ fill: "#7b6ca6", fontSize: 12 }}
                  tickFormatter={(value: number) => `$${value.toFixed(0)}`}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(209, 196, 255, 0.35)" }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => format(parseISO(label as string), "MMMM dd, yyyy")}
                      formatter={(value, name) => {
                        if (typeof value !== "number") return value;
                        const label = revenueChartConfig[name as keyof typeof revenueChartConfig]?.label ?? name;
                        return [`$${value.toFixed(2)}`, label];
                      }}
                    />
                  }
                />
                <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                <Bar dataKey="projected" stackId="a" fill="var(--color-projected)" radius={[0, 0, 8, 8]} />
                <Bar dataKey="confirmed" stackId="a" fill="var(--color-confirmed)" radius={[12, 12, 0, 0]}>
                  <LabelList
                    dataKey="total"
                    position="top"
                    className="text-[#4d3c7b] text-xs font-semibold"
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-[#e4d8ff] bg-gradient-to-b from-[#faf6ff] to-white shadow-[0_25px_55px_-35px_rgba(93,63,211,0.45)]">
        <div className="px-8 py-9 space-y-8">
          <header className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8c7bbf]">Channel Mix</p>
            <h2 className="text-3xl font-playfair font-bold text-[#33235d]">Earnings breakdown by channel</h2>
          </header>
          <div className="rounded-3xl border border-[#efe6ff] bg-white/95 p-6 shadow-sm">
            <ChartContainer config={channelChartConfig} className="h-[320px] w-full">
              <BarChart data={channelEarnings} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="4 6" stroke="#efe6ff" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "#7b6ca6", fontSize: 12 }}
                  tickFormatter={(value: number) => `${value}`}
                />
                <YAxis
                  type="category"
                  dataKey="channel"
                  tickLine={false}
                  axisLine={false}
                  width={180}
                  tick={{ fill: "#6d5f92", fontSize: 14, fontWeight: 600 }}
                />
                <Bar dataKey="value" radius={[0, 16, 16, 0]} fill="var(--color-value)">
                  <LabelList
                    position="right"
                    className="text-[#4d3c7b] text-xs font-semibold"
                    formatter={(value: number) => `$${value.toFixed(0)}`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
