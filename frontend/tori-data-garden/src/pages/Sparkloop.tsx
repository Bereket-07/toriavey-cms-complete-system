import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ArrowRight,
  Info,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList } from "recharts";
import { parseISO, format } from "date-fns";
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

type Subscriber = {
  uuid: string;
  email: string;
  name?: string | null;
  status?: string | null;
  origin?: string | null;
  country_code?: string | null;
  created_at?: string | null;
  cpa?: number | null;
};

type DashboardMetrics = {
  past_30_day_performance: {
    total_referrals: number;
    total_referrals_change_pct: number;
    expected_net_earnings: number;
    expected_net_earnings_change_pct: number;
    confirmed_referrals: number;
    confirmed_net_earnings: number;
    pending_referrals: number;
    projected_net_earnings: number;
    rejected_referrals: number;
  };
  referrals_engagement: {
    referral_confirmation_rate: number;
    avg_screening_duration_days: number;
  };
  channels_breakdown: {
    referrals: Record<string, number>;
    earnings: Record<string, number>;
  };
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
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [recsPage, setRecsPage] = useState<number>(1);
  const [subsPage, setSubsPage] = useState<number>(1);
  const perPage = 10;

  const loadDashboardMetrics = useCallback(async () => {
    try {
      // Use browser automation for accurate metrics directly from SparkLoop dashboard
      const metrics = await apiGet<DashboardMetrics>(`/api/v1/sparkloop/metrics/dashboard?days=30`);
      setDashboardMetrics(metrics);
    } catch (e: any) {
      const msg = e?.message || "Failed to load dashboard metrics";
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
        const p = await apiGet<{ partner_profile?: PartnerProfile | null }>("/api/v1/sparkloop/partner_profile");
        setProfile(p.partner_profile ?? null);
      } catch (e: any) {
        const msg = e?.message || "Failed to load partner profile";
        setError((prev) => prev ?? msg);
        if (String(msg).includes("401")) logout();
      }

      // Recommendations
      try {
        const r = await apiGet<{ partner_campaigns?: Recommendation[]; meta?: SparkloopMeta }>(
          `/api/v1/sparkloop/partner_profile/partner_campaigns?page=${rp}&per_page=${perPage}`
        );
        setRecs(r.partner_campaigns ?? []);
        setRecsMeta(r.meta);
      } catch (e: any) {
        const msg = e?.message || "Failed to load recommendations";
        setError((prev) => prev ?? msg);
        if (String(msg).includes("401")) logout();
      }

      // Subscribers
      try {
        const s = await apiGet<{ subscribers?: Subscriber[]; meta?: SparkloopMeta }>(
          `/api/v1/sparkloop/subscribers?page=${sp}&per_page=${perPage}`
        );
        setSubs(s.subscribers ?? []);
        setSubsMeta(s.meta);
      } catch (e: any) {
        const msg = e?.message || "Failed to load subscribers";
        setError((prev) => prev ?? msg);
        if (String(msg).includes("401")) logout();
      }

      if (!opts?.keepPages) {
        setRecsPage(1);
        setSubsPage(1);
      }
    } finally {
      setLoading(false);
    }
  }, [recsPage, subsPage, logout, perPage]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAll();
      loadDashboardMetrics();
    }
  }, [isAuthenticated, loadAll, loadDashboardMetrics]);

  const changeRecsPage = async (delta: number) => {
    const next = Math.max(1, (recsPage || 1) + delta);
    if (recsMeta?.total_pages && next > recsMeta.total_pages) return;
    setLoading(true);
    setError(null);
    try {
      const r = await apiGet<{ partner_campaigns?: Recommendation[]; meta?: SparkloopMeta }>(
        `/api/v1/sparkloop/partner_profile/partner_campaigns?page=${next}&per_page=${perPage}`
      );
      setRecs(r.partner_campaigns ?? []);
      setRecsMeta(r.meta);
      setRecsPage(next);
    } catch (e: any) {
      const msg = e?.message || "Failed to load recommendations";
      setError(msg);
      if (typeof msg === "string" && msg.includes("401")) logout();
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
      const s = await apiGet<{ subscribers?: Subscriber[]; meta?: SparkloopMeta }>(
        `/api/v1/sparkloop/subscribers?page=${next}&per_page=${perPage}`
      );
      setSubs(s.subscribers ?? []);
      setSubsMeta(s.meta);
      setSubsPage(next);
    } catch (e: any) {
      const msg = e?.message || "Failed to load subscribers";
      setError(msg);
      if (typeof msg === "string" && msg.includes("401")) logout();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    showLoading?.(1200);
    await loadAll({ keepPages: true });
    await loadDashboardMetrics();
  };

  const perf = dashboardMetrics?.past_30_day_performance;
  const engagement = dashboardMetrics?.referrals_engagement;
  const channels = dashboardMetrics?.channels_breakdown;

  // Convert channel data to chart format
  const channelEarningsData = channels ? Object.entries(channels.earnings).map(([channel, value]) => ({
    channel,
    value
  })) : [];

  const toTrend = (change: number): Trend => (change > 0 ? "up" : change < 0 ? "down" : "flat");

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

      {/* Past 30-Day Performance */}
      <section className="rounded-[32px] border border-[#e4d8ff] bg-gradient-to-b from-[#f9f5ff] to-white shadow-[0_20px_45px_-30px_rgba(93,63,211,0.45)]">
        <div className="px-8 py-9 space-y-8">
          <header className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8c7bbf]">Overview</p>
            <h2 className="text-3xl font-playfair font-bold text-[#33235d]">Paid Recommendations</h2>
          </header>

          <div className="rounded-3xl border border-[#efe6ff] bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-[#7b6ca6]">Past 30 days performance</p>
            <div className="mt-6 grid gap-6 md:grid-cols-[repeat(5,minmax(0,auto))] md:items-center">
              {[
                { label: "total referrals", value: perf?.total_referrals, change: perf?.total_referrals_change_pct },
                { label: "expected net earnings", value: perf?.expected_net_earnings, change: perf?.expected_net_earnings_change_pct, isCurrency: true },
                { label: "expected next payout", value: perf?.confirmed_net_earnings, change: 0, isCurrency: true }
              ].map((metric, index) => (
                <Fragment key={metric.label}>
                  <div className="flex flex-col gap-3 min-w-[180px]">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold tracking-tight text-[#2a1f4d]">
                        {metric.isCurrency ? formatCurrency(metric.value) : formatNumber(metric.value)}
                      </span>
                      {metric.change !== undefined && metric.change !== 0 && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            toTrend(metric.change) === "up"
                              ? "bg-emerald-100 text-emerald-600"
                              : toTrend(metric.change) === "down"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-[#f1f0f5] text-[#6d5f92]"
                          }`}
                        >
                          {toTrend(metric.change) === "up" ? "+" : toTrend(metric.change) === "down" ? "-" : ""}
                          {Math.abs(metric.change)}%
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium capitalize text-[#6d5f92]">{metric.label}</p>
                  </div>
                  {index < 2 && (
                    <ArrowRight className="hidden md:block h-5 w-5 justify-self-center text-[#b19bff]" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Referrals Insights */}
      <section className="rounded-[32px] border border-[#e4d8ff] bg-gradient-to-b from-[#faf6ff] to-white shadow-[0_25px_55px_-35px_rgba(93,63,211,0.55)]">
        <div className="px-8 py-9 space-y-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8c7bbf]">Advanced Reports</p>
              <h2 className="mt-2 text-3xl font-playfair font-bold text-[#33235d]">Referrals Insights</h2>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="rounded-3xl border border-[#efe6ff] bg-white/95 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c7bbf]">General Performance</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-6">
                {[
                  { label: "total referrals", value: perf?.total_referrals, change: perf?.total_referrals_change_pct },
                  { label: "expected net earnings", value: perf?.expected_net_earnings, change: perf?.expected_net_earnings_change_pct, isCurrency: true }
                ].map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-2 min-w-[160px]">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold tracking-tight text-[#2a1f4d]">
                        {metric.isCurrency ? formatCurrency(metric.value) : formatNumber(metric.value)}
                      </span>
                      {metric.change !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            toTrend(metric.change) === "up"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-rose-100 text-rose-600"
                          }`}
                        >
                          {toTrend(metric.change) === "up" ? "+" : "-"}
                          {Math.abs(metric.change)}%
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium capitalize text-[#6d5f92]">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  {[
                    { label: "confirmed referrals", value: perf?.confirmed_referrals },
                    { label: "pending referrals", value: perf?.pending_referrals },
                    { label: "rejected referrals", value: perf?.rejected_referrals }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl bg-[#f7f1ff] px-4 py-3">
                      <span className="text-sm font-medium text-[#7b6ca6] capitalize">{item.label}</span>
                      <span className="text-base font-semibold text-[#4d3c7b]">{formatNumber(item.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    { label: "confirmed net earnings", value: perf?.confirmed_net_earnings },
                    { label: "projected net earnings", value: perf?.projected_net_earnings }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl bg-[#f7f1ff] px-4 py-3">
                      <span className="text-sm font-medium text-[#7b6ca6] capitalize">{item.label}</span>
                      <span className="text-base font-semibold text-[#4d3c7b]">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#efe6ff] bg-white/95 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8c7bbf]">Referrals Engagement</p>
              </div>

              <div className="mt-8 space-y-6">
                {[
                  { label: "Referral Confirmation Rate", value: `${engagement?.referral_confirmation_rate?.toFixed(1) ?? "0"}%` },
                  { label: "avg. screening duration", value: `${engagement?.avg_screening_duration_days ?? "—"} days` }
                ].map((metric) => (
                  <div key={metric.label} className="rounded-2xl bg-[#f7f1ff] p-5">
                    <p className="text-sm font-medium text-[#7b6ca6]">{metric.label}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-3xl font-bold text-[#2a1f4d]">{metric.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channel Breakdown */}
      <section className="rounded-[32px] border border-[#e4d8ff] bg-gradient-to-b from-[#faf6ff] to-white shadow-[0_25px_55px_-35px_rgba(93,63,211,0.45)]">
        <div className="px-8 py-9 space-y-8">
          <header className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8c7bbf]">Channel Mix</p>
            <h2 className="text-3xl font-playfair font-bold text-[#33235d]">Earnings breakdown by channel</h2>
          </header>
          <div className="rounded-3xl border border-[#efe6ff] bg-white/95 p-6 shadow-sm">
            {channelEarningsData.length > 0 ? (
              <ChartContainer config={channelChartConfig} className="h-[320px] w-full">
                <BarChart data={channelEarningsData} layout="vertical" barSize={28}>
                  <CartesianGrid strokeDasharray="4 6" stroke="#efe6ff" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: "#7b6ca6", fontSize: 12 }}
                    tickFormatter={(value: number) => `$${value}`}
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
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                No channel data available
              </div>
            )}
          </div>

          {/* Channel Referrals Breakdown */}
          {channels && Object.keys(channels.referrals).length > 0 && (
            <div className="rounded-3xl border border-[#efe6ff] bg-white/95 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#33235d] mb-4">Referrals by Channel</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(channels.referrals).map(([channel, count]) => (
                  <div key={channel} className="rounded-2xl bg-[#f7f1ff] px-4 py-3">
                    <p className="text-sm font-medium text-[#7b6ca6]">{channel}</p>
                    <p className="text-2xl font-bold text-[#4d3c7b] mt-1">{formatNumber(count)}</p>
                    <p className="text-xs text-[#8c7bbf] mt-1">
                      {formatCurrency(channels.earnings[channel] ?? 0)} earned
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
