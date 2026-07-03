import { BarChart3, Users, Eye, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";

import { DateRangePicker, SortButton, PresetRangeKey } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  fetchGASummaryMetrics,
  fetchGATrendData,
  fetchGAUserActivityTrend,
  fetchGAPageViews,
  fetchGATopContent
} from "@/lib/api";

export default function GoogleAnalytics() {
  const { showLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for GA data
  const [summaryMetrics, setSummaryMetrics] = useState({
    activeUsers: "0",
    newUsers: "0",
    averageSessionDuration: "0"
  });
  const [gaTrendData, setGaTrendData] = useState<any[]>([]);
  const [userActivityTrend, setUserActivityTrend] = useState<any[]>([]);
  const [pageTitleViews, setPageTitleViews] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any[]>([]);

  // GA4 Property ID - configure this with your actual GA4 property ID
  const PROPERTY_ID = import.meta.env.VITE_GA4_PROPERTY_ID || "YOUR_GA4_PROPERTY_ID";

  const fetchGAData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch summary metrics
      const summaryResponse = await fetchGASummaryMetrics(PROPERTY_ID, startDate, endDate);
      if (summaryResponse.rows && summaryResponse.rows[0]) {
        const row = summaryResponse.rows[0];
        const metrics = row.metricValues;
        setSummaryMetrics({
          activeUsers: metrics[0]?.value || "0",
          newUsers: metrics[1]?.value || "0",
          averageSessionDuration: metrics[2]?.value || "0"
        });
      }

      // Fetch trend data
      const trendResponse = await fetchGATrendData(PROPERTY_ID, startDate, endDate);
      if (trendResponse.rows) {
        const trendData = trendResponse.rows.map((row: any) => ({
          date: row.dimensionValues[0].value,
          activeUsers: parseInt(row.metricValues[0].value)
        }));
        setGaTrendData(trendData);
      }

      // Fetch user activity trend
      const activityResponse = await fetchGAUserActivityTrend(PROPERTY_ID, startDate, endDate);
      if (activityResponse.rows) {
        const activityData = activityResponse.rows.map((row: any) => ({
          date: row.dimensionValues[0].value,
          sessions: parseInt(row.metricValues[0].value)
        }));
        setUserActivityTrend(activityData);
      }

      // Fetch page views
      const pageResponse = await fetchGAPageViews(PROPERTY_ID, startDate, endDate);
      if (pageResponse.rows) {
        const pageData = pageResponse.rows.map((row: any) => ({
          title: row.dimensionValues[0].value,
          views: row.metricValues[0].value,
          value: parseInt(row.metricValues[0].value)
        }));
        setPageTitleViews(pageData);
      }

      // Fetch top content
      const contentResponse = await fetchGATopContent(PROPERTY_ID, startDate, endDate);
      if (contentResponse.rows) {
        const contentData = contentResponse.rows.map((row: any, index: number) => ({
          title: row.dimensionValues[0].value,
          views: `${Math.round(parseInt(row.metricValues[0].value) / 1000)}K`,
          change: index % 2 === 0 ? Math.random() * 10 : -(Math.random() * 5) // Mock change for now
        }));
        setTopContent(contentData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GA data');
      console.error('GA data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGAData();
  }, []);

  const maxPageViews = Math.max(...pageTitleViews.map((item) => item.value || 0));

  const gaSummaryMetrics = [
    { label: "Active users", value: summaryMetrics.activeUsers, helper: "Active users" },
    { label: "New users", value: summaryMetrics.newUsers, helper: "New users" },
    { label: "Avg engagement time per active user", value: `${Math.round(parseFloat(summaryMetrics.averageSessionDuration))}s`, helper: "Avg engagement" },
  ];

  // Compute user activity totals from trend data
  const userActivityTotals = [
    { label: "Total Sessions", value: `${Math.round(userActivityTrend.reduce((sum, item) => sum + (item.sessions || 0), 0) / 1000)}K`, color: "#2563eb" },
  ];

  const handleSort = (_preset: PresetRangeKey) => showLoading();
  const handleDate = () => showLoading();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <PageHeader
            title="Google Analytics"
            description="Track user behavior and content performance"
            icon={BarChart3}
          />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Google Analytics data...</p>
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
            title="Google Analytics"
            description="Track user behavior and content performance"
            icon={BarChart3}
          />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading Google Analytics data</p>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={fetchGAData}
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
          title="Google Analytics"
          description="Track user behavior and content performance"
          icon={BarChart3}
        />
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleDate} />
          <SortButton onChange={handleSort} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={summaryMetrics.activeUsers}
          change={0} // TODO: Calculate change from previous period
          icon={Users}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="New Users"
          value={summaryMetrics.newUsers}
          change={0} // TODO: Calculate change from previous period
          icon={Users}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Avg Engagement"
          value={`${Math.round(parseFloat(summaryMetrics.averageSessionDuration))}s`}
          change={0} // TODO: Calculate change from previous period
          icon={Clock}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="30-Day Traffic"
          value={userActivityTotals[0].value}
          change={0} // TODO: Calculate change from previous period
          icon={Eye}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-recipe-card overflow-hidden">
        <div className="space-y-6 border-b border-border bg-muted/30 px-6 pt-6 pb-4">
          <div className="flex flex-wrap gap-6">
            {gaSummaryMetrics.map((metric) => (
              <div key={metric.label} className="flex min-w-[160px] flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {metric.helper}
                </span>
                <span className="text-3xl font-playfair font-bold text-primary">{metric.value}</span>
                <span className="text-sm text-muted-foreground">{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gaTrendData} margin={{ top: 16, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" strokeOpacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => `${Math.round(value / 1000)}K`}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()} users`}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#2563eb" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-recipe-card overflow-hidden">
        <div className="flex items-center justify-between bg-muted/30 px-6 py-4">
          <h3 className="text-lg font-playfair font-bold text-foreground">User activity over time</h3>
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            ✓
          </div>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userActivityTrend} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" strokeOpacity={0.2} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => `${Math.round(value / 1000)}K`}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()} sessions`}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                />
                <Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8 }} />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  name="Sessions"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 1.5, fill: "#2563eb" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-4">
            {userActivityTotals.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-[0.25em]">
                    {item.label}
                  </span>
                </div>
                <span className="text-2xl font-playfair font-bold" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-recipe-card overflow-hidden">
        <div className="flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">Views by</span>
            <span className="text-lg font-playfair font-bold">Page title and screen class</span>
          </div>
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <span className="text-lg">✓</span>
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border bg-muted/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <span>Page title and screen class</span>
          <span>Views</span>
        </div>
        <div className="divide-y divide-border/70">
          {pageTitleViews.map((item) => (
            <div key={item.title} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
              <div className="space-y-2">
                <p className="font-medium text-foreground leading-tight">{item.title}</p>
                <div className="h-1 rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(10, Math.round((item.value / maxPageViews) * 100))}%` }}
                  />
                </div>
              </div>
              <span className="text-base font-playfair font-bold text-primary sm:text-lg">{item.views}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end px-6 py-4 text-primary text-sm font-medium">
          <button type="button" className="inline-flex items-center gap-1 hover:text-primary/80 transition-colors">
            View pages and screens
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card">
        <h3 className="text-xl font-playfair font-bold mb-6">Top Performing Content</h3>
        <div className="space-y-4">
          {topContent.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-smooth"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-playfair font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.views} views</p>
                </div>
              </div>
              <span
                className={`text-sm font-medium ${
                  item.change < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {item.change > 0 ? "+" : ""}
                {item.change}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h4 className="font-bold mb-4">7-Day Traffic</h4>
          <p className="text-3xl font-playfair font-bold text-foreground">
            {userActivityTrend.length > 0 ? `${Math.round(userActivityTrend.slice(-7).reduce((sum, item) => sum + (item.sessions || 0), 0) / 1000)}K` : "0K"}
          </p>
          <p className="text-green-600 font-medium mt-2">+0%</p>
        </div>
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h4 className="font-bold mb-4">24-Hour Traffic</h4>
          <p className="text-3xl font-playfair font-bold text-foreground">
            {userActivityTrend.length > 0 ? `${Math.round((userActivityTrend[userActivityTrend.length - 1]?.sessions || 0) / 1000)}K` : "0K"}
          </p>
          <p className="text-green-600 font-medium mt-2">+0%</p>
        </div>
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h4 className="font-bold mb-4">Total Sessions</h4>
          <p className="text-3xl font-playfair font-bold text-foreground">
            {userActivityTotals[0]?.value || "0K"}
          </p>
          <p className="text-green-600 font-medium mt-2">Active</p>
        </div>
      </div>
    </div>
  );
}
