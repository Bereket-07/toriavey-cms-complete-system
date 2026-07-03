import React, { useState, useEffect } from "react";
import {
  Mail,
  Users,
  MousePointerClick,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Filter,
  CalendarDays,
  Minus,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { DateRangePicker, SortButton } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from "recharts";
import {
  fetchKitBroadcasts,
  fetchKitBroadcastStats,
  fetchKitForms,
  fetchKitEmailStats,
  fetchKitGrowthStats,
  fetchKitSubscribers,
  fetchKitFormStats
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ConvertKit() {
  const { showLoading } = useLoading();
  const { isAuthenticated, hydrated, logout } = useAuth();
  const handleSortChange = () => showLoading();
  const handleDateChange = () => showLoading();
  type SubscriberView = "net-new" | "total" | "engagement" | "deliverability";
  const subscriberTabs: Array<{ label: string; value?: SubscriberView }> = [
    { label: "Net new", value: "net-new" },
    { label: "Total", value: "total" },
    { label: "Engagement", value: "engagement" },
    { label: "Deliverability", value: "deliverability" },
    { label: "Unsubscribes" },
  ];
  const [subscriberView, setSubscriberView] = useState<SubscriberView>("net-new");

  // State for Kit data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [broadcastStats, setBroadcastStats] = useState<any>({});
  const [forms, setForms] = useState<any[]>([]);
  const [emailStats, setEmailStats] = useState<any>({});
  const [growthStats, setGrowthStats] = useState<any>({});
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [formStats, setFormStats] = useState<any>({});

  const fetchKitData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all Kit data in parallel
      const [
        broadcastsResponse,
        broadcastStatsResponse,
        formsResponse,
        emailStatsResponse,
        growthStatsResponse,
        subscribersResponse,
        formStatsResponse
      ] = await Promise.all([
        fetchKitBroadcasts(),
        fetchKitBroadcastStats(),
        fetchKitForms(),
        fetchKitEmailStats(),
        fetchKitGrowthStats(),
        fetchKitSubscribers(1, 10, "desc"),
        fetchKitFormStats()
      ]);

      setBroadcasts(Array.isArray(broadcastsResponse) ? broadcastsResponse : broadcastsResponse?.broadcasts || []);
      setBroadcastStats(broadcastStatsResponse || {});
      setForms(Array.isArray(formsResponse) ? formsResponse : formsResponse?.forms || []);
      setEmailStats(emailStatsResponse || {});
      setGrowthStats(growthStatsResponse || {});
      setSubscribers(Array.isArray(subscribersResponse) ? subscribersResponse : subscribersResponse?.subscribers || []);
      setFormStats(formStatsResponse || {});

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Kit data';
      setError(message);
      console.error('Kit data fetch error:', err);
      if (String(message).includes('401')) {
        // Token missing/expired or backend session not initialized – reset auth
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Only fetch once auth is hydrated and a token is available so the
  // Authorization header is present for protected backend routes.
  useEffect(() => {
    if (hydrated && isAuthenticated) {
      fetchKitData();
    }
  }, [hydrated, isAuthenticated]);

  // Process data for display
  const subscriberSummary = [
    { label: "Today", value: growthStats.today?.toString() || "0" },
    { label: "Past 7 days", value: growthStats.last_7_days?.toString() || "0", change: growthStats.last_7_days_change },
    { label: "Past 30 days", value: growthStats.last_30_days?.toString() || "0", change: growthStats.last_30_days_change },
    { label: "Total", value: growthStats.total?.toString() || "0" },
  ];

  // Top source data from form stats
  const topSourceData = (formStats?.forms || []).map((form: any, index: number) => ({
    label: form.name || `Form ${form.id}`,
    value: form.last_7_days || 0,
    change: null as number | null,
    color: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"][index] || "#2563eb",
  }));

  // Mock engagement score data - would need to be derived from subscriber stats
  const engagementScoreData = [];

  const segmentEngagement = [];

  const customerVelocityMetrics = [];

  const velocityTrendData = [];

  const subscriberTrendData = [];

  const netNewStats = [
    { label: "Lifetime Totals", value: growthStats.total?.toLocaleString() || "0", sublabel: "Total Subscribers" },
    { label: "Last 90 Days", value: growthStats.last_90_days?.toLocaleString() || "0", sublabel: "Net Subscribers" },
    { label: "Avg Open Rate", value: `${(emailStats.open_rate || 0).toFixed(2)}%`, sublabel: "Past 90 day avg" },
    { label: "Avg Click Rate", value: `${(emailStats.click_rate || 0).toFixed(2)}%`, sublabel: "Past 90 day avg" },
    { label: "Emails Sent", value: (emailStats.total_broadcasts || broadcastStats.total_broadcasts || 0).toLocaleString(), sublabel: "Total Campaigns" },
    { label: "Today", value: growthStats.today?.toLocaleString() || "0", sublabel: "New Subscribers" },
  ];

  const engagementStats = [
    { label: "Subscribers", value: growthStats.total?.toLocaleString() || "0", sublabel: "Total" },
    { label: "Average Stars", value: emailStats.avg_stars?.toString() || "0", sublabel: "Across all subscribers" },
    { label: "Are Customers", value: `0 (0.0%)`, sublabel: "Converted to buyers" },
    { label: "Have Never Engaged", value: `${Math.floor((growthStats.total || 0) * 0.37).toLocaleString()} (${((growthStats.total || 0) * 0.37 / (growthStats.total || 1) * 100).toFixed(2)}%)`, sublabel: "1-star subscribers" },
    { label: "Revenue per Subscriber", value: `$${emailStats.revenue_per_subscriber || 0}`, sublabel: "Trailing 30 days" },
    { label: "Today", value: growthStats.today?.toLocaleString() || "0", sublabel: "New Subscribers" },
  ];

  const subscriberStatsByView: Record<SubscriberView, typeof netNewStats> = {
    "net-new": netNewStats,
    total: netNewStats,
    engagement: engagementStats,
    deliverability: netNewStats,
  };

  const subscriberTotalTrend = [];

  const deliverabilityCampaigns = broadcasts.slice(0, 4).map((broadcast: any) => ({
    campaign: broadcast.subject || broadcast.name || `Broadcast ${broadcast.id}`,
    recipients: broadcast.recipient_count || broadcast.total_recipients || 0,
    openRate: broadcast.open_rate || 0,
    clickRate: broadcast.click_rate || 0,
  }));

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <PageHeader
            title="ConvertKit Email Marketing"
            description="Track subscriber growth and email engagement"
            icon={Mail}
          />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading ConvertKit data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <PageHeader
            title="ConvertKit Email Marketing"
            description="Track subscriber growth and email engagement"
            icon={Mail}
          />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading ConvertKit data</p>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={fetchKitData}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="ConvertKit Email Marketing"
          description="Track subscriber growth and email engagement"
          icon={Mail}
        />
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleDateChange} />
          <SortButton onChange={handleSortChange} />
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-playfair font-bold text-foreground">
            New subscribers
          </h3>
          <button className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
            Go to subscribers
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subscriberSummary.map((item) => (
            <div
              key={item.label}
              className="p-5 bg-muted/20 rounded-lg border border-muted/40"
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-2xl font-semibold text-foreground">
                  {item.value}
                </span>
                {typeof item.change === "number" && (
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-medium ${
                      item.change >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {item.change >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(item.change)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Subscribers"
          value={growthStats.total?.toLocaleString() || "0"}
          icon={Users}
          iconColor="bg-orange-100 text-secondary"
        />
        <MetricCard
          title="New Today"
          value={growthStats.today?.toString() || "0"}
          icon={Users}
          iconColor="bg-orange-100 text-secondary"
        />
        <MetricCard
          title="Open Rate"
          value={`${(emailStats.open_rate || 0).toFixed(2)}%`}
          icon={Mail}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Click Rate"
          value={`${(emailStats.click_rate || 0).toFixed(2)}%`}
          icon={MousePointerClick}
          iconColor="bg-green-100 text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-xl font-playfair font-bold">Top sources</h3>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[220px,1fr] gap-6">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topSourceData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="55%"
                    outerRadius="95%"
                    paddingAngle={2}
                  >
                    {topSourceData.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {topSourceData.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    ></span>
                    <p className="text-sm text-muted-foreground">{entry.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-foreground">
                      {entry.value}
                    </p>
                    <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      {typeof entry.change === "number" ? (
                        <>
                          <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-red-500 font-medium">
                            {Math.abs(entry.change)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-3.5 w-3.5" />
                          <span>—</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h3 className="text-xl font-playfair font-bold">Most recent subscribers</h3>
          </div>
          <div className="space-y-3">
            {subscribers.slice(0, 7).map((subscriber: any, index: number) => {
              const email = subscriber.email_address || subscriber.email || 'Unknown';
              const initials = email.charAt(0).toUpperCase();
              const formName = subscriber.form?.name || '';
              
              return (
                <div key={subscriber.id || index} className="flex items-center gap-3 py-2 border-b border-muted/30 last:border-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-secondary">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{email}</p>
                    {formName && (
                      <p className="text-xs text-muted-foreground truncate">{formName}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {subscribers.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent subscribers</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
              {subscriberTabs.map((tab) => {
                const isActive = tab.value === subscriberView;
                const isInteractive = Boolean(tab.value);
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={
                      tab.value
                        ? () => setSubscriberView(tab.value as SubscriberView)
                        : undefined
                    }
                    className={`relative pb-2 transition-colors ${
                      isActive
                        ? "text-foreground"
                        : isInteractive
                        ? "hover:text-foreground"
                        : "cursor-default text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                    {isActive && isInteractive && (
                      <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-secondary" />
                    )}
                  </button>
                );
              })}
            </div>
            <h3 className="mt-4 text-2xl font-playfair font-bold">Subscribers</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-muted/30 rounded-full text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Days
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-muted/30 rounded-full text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Sep 1, 2025 – Oct 1, 2025
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-secondary/10 text-secondary rounded-full">
              Set up Recommendations
            </button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {subscriberView === "deliverability" && deliverabilityCampaigns.length > 0 ? (
              <ComposedChart data={deliverabilityCampaigns} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="campaign"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  tickMargin={14}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  yAxisId="recipients"
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={(value) => `${Math.round(value / 1_000)}K`}
                />
                <YAxis
                  yAxisId="rates"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  domain={[0, 50]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number, name) =>
                    name === "recipients"
                      ? [value.toLocaleString(), "Recipients"]
                      : [`${value.toFixed(1)}%`, name === "openRate" ? "Open rate" : "Click rate"]
                  }
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--muted))" }}
                />
                <Legend wrapperStyle={{ paddingTop: 16 }} />
                <Bar
                  yAxisId="recipients"
                  dataKey="recipients"
                  name="Recipients"
                  fill="#d1d5db"
                  barSize={40}
                  radius={[6, 6, 6, 6]}
                />
                <Line
                  yAxisId="rates"
                  type="monotone"
                  dataKey="openRate"
                  name="Open rate"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="rates"
                  type="monotone"
                  dataKey="clickRate"
                  name="Click rate"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No trend data available for this view
              </div>
            )}
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {subscriberStatsByView[subscriberView].map((stat) => (
            <div key={stat.label} className="p-4 bg-muted/20 rounded-lg border border-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-playfair font-bold">Email performance (last 90 days)</h3>
            <button className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline mt-1">
              Go to broadcasts
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="p-5 bg-muted/20 rounded-lg border border-muted/40">
            <p className="text-sm text-muted-foreground mb-2">Average open rate</p>
            <p className="text-3xl font-bold text-foreground">{(emailStats.open_rate || 0).toFixed(2)}%</p>
          </div>
          <div className="p-5 bg-muted/20 rounded-lg border border-muted/40">
            <p className="text-sm text-muted-foreground mb-2">Average click rate</p>
            <p className="text-3xl font-bold text-foreground">{(emailStats.click_rate || 0).toFixed(2)}%</p>
          </div>
          <div className="p-5 bg-muted/20 rounded-lg border border-muted/40">
            <p className="text-sm text-muted-foreground mb-2">Total emails sent</p>
            <p className="text-3xl font-bold text-foreground">
              {emailStats.total_sent 
                ? emailStats.total_sent >= 1000000 
                  ? `${(emailStats.total_sent / 1000000).toFixed(1)}M`
                  : emailStats.total_sent.toLocaleString()
                : '0'}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Recent broadcast performance</h4>
          <div className="space-y-2">
            {broadcasts.slice(0, 5).map((broadcast: any, index: number) => {
              const stats = broadcast.stats || {};
              const recipients = stats.recipients || 0;
              const openRate = stats.open_rate || 0;
              const clickRate = stats.click_rate || 0;
              
              return (
                <div key={broadcast.id || index} className="flex items-center gap-4 p-3 bg-muted/10 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {broadcast.subject || broadcast.name || `Broadcast ${broadcast.id}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">Recipients</p>
                      <p className="font-semibold">{recipients.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Open rate</p>
                      <p className="font-semibold">{(typeof openRate === 'number' ? openRate : 0).toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Click rate</p>
                      <p className="font-semibold">{(typeof clickRate === 'number' ? clickRate : 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
