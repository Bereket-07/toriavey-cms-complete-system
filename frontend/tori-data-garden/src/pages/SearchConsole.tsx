import {
  Search,
  MousePointerClick,
  Eye,
  TrendingUp,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import React from "react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { DateRangePicker, SortButton, PresetRangeKey } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

type MetricKey = "clicks" | "impressions" | "ctr" | "position";

type TrendPoint = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  property_variant?: string;
};

const parseISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatISODate = (date: Date) => date.toISOString().slice(0, 10);

const enumerateDateRange = (start: string, end: string): string[] => {
  if (!start || !end) return [];
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);
  const result: string[] = [];
  for (let time = startDate.getTime(); time <= endDate.getTime(); time += 86_400_000) {
    result.push(formatISODate(new Date(time)));
  }
  return result;
};

const fillTrendSeries = (points: TrendPoint[], start: string, end: string): TrendPoint[] => {
  if (!points || points.length === 0) {
    return enumerateDateRange(start, end).map((date) => ({ date, clicks: 0, impressions: 0, ctr: 0, position: 0 }));
  }
  const map = new Map<string, TrendPoint>();
  points.forEach((point) => {
    if (point?.date) {
      map.set(point.date, point);
    }
  });
  const propertyVariant = points.find((p) => p.property_variant)?.property_variant;
  return enumerateDateRange(start, end).map((date, index) => {
    const existing = map.get(date);
    const normalized: TrendPoint = {
      date,
      clicks: existing?.clicks ?? 0,
      impressions: existing?.impressions ?? 0,
      ctr: existing?.ctr ?? 0,
      position: existing?.position ?? 0,
    };
    if (existing?.property_variant) {
      normalized.property_variant = existing.property_variant;
    } else if (propertyVariant && index === 0) {
      normalized.property_variant = propertyVariant;
    }
    return normalized;
  });
};

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCompactNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0";
  return compactFormatter.format(value);
};

const humanNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
};

export default function SearchConsole() {

  const { showLoading } = useLoading();

  const [summary, setSummary] = React.useState<{
    total_clicks: string;
    total_impressions: string;
    average_ctr: string;
    avg_position: string;
    demo?: boolean;
  } | null>(null);
  // Default to the past 12 months BUT clamp end date to (today - 2 days)
  // Rationale: GSC data typically lags ~2 days. Using today introduces
  // 0-impression tail days causing smaller totals than backend calls that
  // intentionally end at last processed day. This aligns with the manual
  // backend request you validated (end = today - 2 days).
  const getDefaultDateRange = () => {
    const end = new Date();
    end.setDate(end.getDate() - 2); // clamp to last likely processed day
    const start = new Date(end);
    // Use setFullYear to retain leap-day span (gives 366 days if leap occurred)
    start.setFullYear(end.getFullYear() - 1);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { start: fmt(start), end: fmt(end) };
  };
  const [dateRange, setDateRange] = React.useState<{ start: string; end: string }>(getDefaultDateRange());
  const [dataFreshness, setDataFreshness] = React.useState<{ lastDate?: string; lagDays?: number } | null>(null);
  const topQueries = [
    { query: "Ginger Beer Recipe", clicks: "45.2K", impressions: "892K", ctr: "5.1%", position: 3.2 },
    { query: "Challah Recipe", clicks: "38.7K", impressions: "756K", ctr: "5.1%", position: 2.8 },
    { query: "Matzo Ball Soup", clicks: "32.1K", impressions: "698K", ctr: "4.6%", position: 4.1 },
    { query: "Kosher Recipes", clicks: "28.4K", impressions: "612K", ctr: "4.6%", position: 5.2 },
    { query: "Jewish Food", clicks: "24.8K", impressions: "589K", ctr: "4.2%", position: 6.7 },
  ];

  // performanceSummary removed to avoid duplicating metrics already shown above

  const [trendData, setTrendData] = React.useState<TrendPoint[]>([]);
  const [granularity, setGranularity] = React.useState<'daily' | 'weekly'>('daily');
  const [activeMetrics, setActiveMetrics] = React.useState<Record<MetricKey, boolean>>({
    clicks: true,
    impressions: true,
    ctr: true,
    position: true,
  });

  const toggleMetric = React.useCallback((key: MetricKey) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const [coreWebVitalsMobileData, setCoreWebVitalsMobileData] = React.useState<{ date: string; poor: number; needsImprovement: number; good: number }[]>([]);
  const [coreWebVitalsMobileSummary, setCoreWebVitalsMobileSummary] = React.useState<{ label: string; value: string; detail?: string; color?: string; indicator?: string }[]>([]);
  const [coreWebVitalsDesktopData, setCoreWebVitalsDesktopData] = React.useState<{ date: string; poor: number; needsImprovement: number; good: number }[]>([]);
  const [coreWebVitalsDesktopSummary, setCoreWebVitalsDesktopSummary] = React.useState<{ label: string; value: string; detail?: string; color?: string; indicator?: string }[]>([]);
  const [experienceData, setExperienceData] = React.useState<any>(null);

  // fetch experience & enhancements
  React.useEffect(() => {
    async function fetchExperience() {
      if (!dateRange.start || !dateRange.end) return;
      try {
        const { apiPost } = await import("@/lib/api");
        const data = await apiPost("/api/v1/gsc/experience", {
          site_url: "https://www.toriavey.com/",
          date_range: { start_date: dateRange.start, end_date: dateRange.end },
        });
        console.log("GSC experience:", data);
        setExperienceData(data);
      } catch (err) {
        console.error("Failed to fetch experience:", err);
      }
    }
    fetchExperience();
  }, [dateRange.start, dateRange.end]);

  const [pageIndexingSummary, setPageIndexingSummary] = React.useState<
    { label: string; value: string; helper?: string; border?: string; text?: string; background?: string; dotColor?: string }[]
  >([
    { label: "Not indexed", value: "—", helper: "", border: "border-red-200", text: "text-red-600", background: "bg-red-50", dotColor: "bg-red-500" },
    { label: "Indexed", value: "—", helper: "", border: "border-emerald-200", text: "text-emerald-600", background: "bg-emerald-50", dotColor: "bg-emerald-500" },
  ]);

  const [pageIndexingTrend, setPageIndexingTrend] = React.useState<{ date: string; notIndexed: number; indexed: number; impressions: number }[]>([]);

  React.useEffect(() => {
    async function fetchIndexing() {
      if (!dateRange.start || !dateRange.end) return;
      try {
        const { apiPost } = await import("@/lib/api");
        const data = await apiPost("/api/v1/gsc/indexing", {
          site_url: "https://www.toriavey.com/",
          date_range: { start_date: dateRange.start, end_date: dateRange.end },
        });
        console.log("GSC indexing:", data);
        const summary = data.summary || {};
        setPageIndexingSummary([
          { label: "Not indexed", value: summary.notIndexed?.toLocaleString?.() ?? String(summary.notIndexed ?? "—"), helper: "Possible reasons", border: "border-red-200", text: "text-red-600", background: "bg-red-50", dotColor: "bg-red-500" },
          { label: "Indexed", value: summary.indexed?.toLocaleString?.() ?? String(summary.indexed ?? "—"), helper: "Valid pages", border: "border-emerald-200", text: "text-emerald-600", background: "bg-emerald-50", dotColor: "bg-emerald-500" },
        ]);
        setPageIndexingTrend(data.trend || []);
      } catch (err) {
        console.error("Failed to fetch indexing:", err);
      }
    }
    fetchIndexing();
  }, [dateRange.start, dateRange.end]);

  // fetch Core Web Vitals data from backend
  React.useEffect(() => {
    async function fetchCoreVitals() {
      if (!dateRange.start || !dateRange.end) return;
      try {
        const { apiPost } = await import("@/lib/api");
        const data = await apiPost("/api/v1/gsc/core-vitals", {
          site_url: "https://www.toriavey.com/",
          date_range: { start_date: dateRange.start, end_date: dateRange.end },
        });
        console.log("GSC core vitals:", data);
        // map mobile
        const mobile = data.mobile || { summary: { good: 0, needsImprovement: 0, poor: 0 }, trend: [] };
        setCoreWebVitalsMobileData(mobile.trend || []);
        setCoreWebVitalsMobileSummary([
          { label: "Poor URLs", value: String(mobile.summary.poor ?? 0), detail: "poor URLs", color: "text-red-500", indicator: "bg-red-500" },
          { label: "Needs improvement", value: String(mobile.summary.needsImprovement ?? 0), detail: "URLs need improvement", color: "text-amber-500", indicator: "bg-amber-400" },
          { label: "Good URLs", value: (mobile.summary.good ?? 0).toLocaleString(), detail: "good URLs", color: "text-emerald-600", indicator: "bg-emerald-500" },
        ]);
        // map desktop
        const desktop = data.desktop || { summary: { good: 0, needsImprovement: 0, poor: 0 }, trend: [] };
        setCoreWebVitalsDesktopData(desktop.trend || []);
        setCoreWebVitalsDesktopSummary([
          { label: "Poor URLs", value: String(desktop.summary.poor ?? 0), detail: "poor URLs", color: "text-red-500", indicator: "bg-red-500" },
          { label: "Needs improvement", value: String(desktop.summary.needsImprovement ?? 0), detail: "URLs need improvement", color: "text-amber-500", indicator: "bg-amber-400" },
          { label: "Good URLs", value: (desktop.summary.good ?? 0).toLocaleString(), detail: "good URLs", color: "text-emerald-600", indicator: "bg-emerald-500" },
        ]);
      } catch (err) {
        console.error("Failed to fetch core vitals:", err);
      }
    }
    fetchCoreVitals();
  }, [dateRange.start, dateRange.end]);

  

  const httpsExperienceTrend = [
    { date: "07/03/25", good: 1230, needsImprovement: 0, poor: 0 },
    { date: "07/15/25", good: 1210, needsImprovement: 0, poor: 0 },
    { date: "07/27/25", good: 1220, needsImprovement: 0, poor: 0 },
    { date: "08/08/25", good: 1235, needsImprovement: 0, poor: 0 },
    { date: "08/20/25", good: 1244, needsImprovement: 0, poor: 0 },
    { date: "09/01/25", good: 1251, needsImprovement: 0, poor: 0 },
    { date: "09/13/25", good: 1256, needsImprovement: 0, poor: 0 },
    { date: "09/25/25", good: 1262, needsImprovement: 0, poor: 0 },
  ];

  const experienceSections = [
    {
      group: "Core Web Vitals",
      rows: [
        {
          key: "mobile",
          label: "Mobile",
          // coreWebVitalsMobileSummary is [Poor, Needs improvement, Good]
          good: coreWebVitalsMobileSummary[2]?.value ?? "—",
          needsImprovement: coreWebVitalsMobileSummary[1]?.value ?? "—",
          poor: coreWebVitalsMobileSummary[0]?.value ?? "—",
          trend: coreWebVitalsMobileData,
        },
        {
          key: "desktop",
          label: "Desktop",
          good: coreWebVitalsDesktopSummary[2]?.value ?? "—",
          needsImprovement: coreWebVitalsDesktopSummary[1]?.value ?? "—",
          poor: coreWebVitalsDesktopSummary[0]?.value ?? "—",
          trend: coreWebVitalsDesktopData,
        },
      ],
    },
    {
      group: "HTTPS",
      rows: [
        {
          key: "https",
          label: "HTTPS",
          good: "1,262",
          needsImprovement: "0",
          poor: "0",
          trend: httpsExperienceTrend,
        },
      ],
    },
  ];

  const enhancementsTrendData: Record<string, { date: string; valid: number; invalid: number }[]> = {
    amp: [
      { date: "07/01/25", valid: 6, invalid: 0 },
      { date: "07/15/25", valid: 6, invalid: 0 },
      { date: "07/29/25", valid: 6, invalid: 0 },
      { date: "08/12/25", valid: 6, invalid: 0 },
      { date: "08/26/25", valid: 6, invalid: 0 },
      { date: "09/09/25", valid: 6, invalid: 0 },
      { date: "09/23/25", valid: 6, invalid: 0 },
    ],
    breadcrumbs: [
      { date: "07/01/25", valid: 1200, invalid: 0 },
      { date: "07/15/25", valid: 1215, invalid: 0 },
      { date: "07/29/25", valid: 1220, invalid: 0 },
      { date: "08/12/25", valid: 1230, invalid: 0 },
      { date: "08/26/25", valid: 1240, invalid: 0 },
      { date: "09/09/25", valid: 1248, invalid: 0 },
      { date: "09/23/25", valid: 1255, invalid: 0 },
    ],
    faq: [
      { date: "07/01/25", valid: 24, invalid: 0 },
      { date: "07/15/25", valid: 26, invalid: 0 },
      { date: "07/29/25", valid: 28, invalid: 0 },
      { date: "08/12/25", valid: 30, invalid: 0 },
      { date: "08/26/25", valid: 31, invalid: 0 },
      { date: "09/09/25", valid: 32, invalid: 0 },
      { date: "09/23/25", valid: 33, invalid: 0 },
    ],
    recipes: [
      { date: "07/01/25", valid: 840, invalid: 0 },
      { date: "07/15/25", valid: 852, invalid: 0 },
      { date: "07/29/25", valid: 860, invalid: 0 },
      { date: "08/12/25", valid: 868, invalid: 0 },
      { date: "08/26/25", valid: 872, invalid: 0 },
      { date: "09/09/25", valid: 874, invalid: 0 },
      { date: "09/23/25", valid: 876, invalid: 0 },
    ],
    reviews: [
      { date: "07/01/25", valid: 5800, invalid: 0 },
      { date: "07/15/25", valid: 5810, invalid: 0 },
      { date: "07/29/25", valid: 5820, invalid: 0 },
      { date: "08/12/25", valid: 5832, invalid: 0 },
      { date: "08/26/25", valid: 5844, invalid: 0 },
      { date: "09/09/25", valid: 5856, invalid: 0 },
      { date: "09/23/25", valid: 5824, invalid: 0 },
    ],
    videos: [
      { date: "07/01/25", valid: 295, invalid: 0 },
      { date: "07/15/25", valid: 288, invalid: 0 },
      { date: "07/29/25", valid: 278, invalid: 0 },
      { date: "08/12/25", valid: 272, invalid: 0 },
      { date: "08/26/25", valid: 268, invalid: 0 },
      { date: "09/09/25", valid: 268, invalid: 0 },
      { date: "09/23/25", valid: 268, invalid: 0 },
    ],
  };

  const enhancements = [
    { key: "amp", label: "AMP", valid: "6", invalid: "0", trend: enhancementsTrendData.amp },
    { key: "breadcrumbs", label: "Breadcrumbs", valid: "1,231", invalid: "0", trend: enhancementsTrendData.breadcrumbs },
    { key: "faq", label: "FAQ", valid: "33", invalid: "0", trend: enhancementsTrendData.faq },
    { key: "recipes", label: "Recipes", valid: "876", invalid: "0", trend: enhancementsTrendData.recipes },
    { key: "reviews", label: "Review snippets", valid: "5,824", invalid: "0", trend: enhancementsTrendData.reviews },
    { key: "videos", label: "Videos", valid: "268", invalid: "0", trend: enhancementsTrendData.videos },
  ];

  const applyPresetRange = React.useCallback((preset: PresetRangeKey) => {
    const today = new Date();
    const adjustedToday = new Date(today);
    adjustedToday.setDate(adjustedToday.getDate() - 2);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const makeRange = (start: Date, end: Date) => ({ start: fmt(start), end: fmt(end) });
    const endDate = new Date(adjustedToday);
    let startDate = new Date(endDate);

    switch (preset) {
      case "today":
        // start == end gives single-day window (last processed day)
        break;
      case "last_week":
        startDate.setDate(endDate.getDate() - 6);
        break;
      case "last_month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "last_3_months":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "last_6_months":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "last_9_months":
        startDate.setMonth(endDate.getMonth() - 9);
        break;
      case "last_year":
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "custom":
        return; // handled via manual date picker
    }

    const range = makeRange(startDate, endDate);
    setDateRange(range);
    showLoading();
  }, [showLoading]);

  const handleSort = (preset: PresetRangeKey) => {
    applyPresetRange(preset);
  };

  const handleDate = (range: { start: string; end: string }) => {
    setDateRange({ start: range.start, end: range.end });
    showLoading();
  };

  // Helper: aggregate daily points into weekly by summing clicks/impressions and averaging ctr/position
  const aggregateWeekly = (points: typeof trendData) => {
    if (!points || points.length === 0) return points;
    // naive weekly grouping: group every 7 points in order (assumes evenly spaced)
    const grouped: typeof trendData = [];
    for (let i = 0; i < points.length; i += 7) {
      const slice = points.slice(i, i + 7);
      const date = slice[slice.length - 1].date;
      const clicks = slice.reduce((s, p) => s + (p.clicks || 0), 0);
      const impressions = slice.reduce((s, p) => s + (p.impressions || 0), 0);
      // Compute CTR from sums to avoid deviation: (clicks / impressions) * 100 => percent
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      // Compute impressions-weighted average position for better accuracy
      const weightedPosSum = slice.reduce((s, p) => s + (p.position || 0) * (p.impressions || 0), 0);
      const position = impressions > 0 ? weightedPosSum / impressions : 0;
      grouped.push({ date, clicks, impressions, ctr, position });
    }
    return grouped;
  };

  // Fetch summary using default site when dateRange changes
  React.useEffect(() => {
    const fetchSummary = async () => {
      const defaultSite = "https://www.toriavey.com/";
      try {
        const { apiPost } = await import("@/lib/api");
        const data = await apiPost("/api/v1/gsc/summary", {
          site_url: defaultSite,
          date_range: { start_date: dateRange.start, end_date: dateRange.end },
        });
        console.log("GSC summary:", data);
        setSummary(data);
        // If backend exposes debug freshness (when we later enable debug), adapt end date
        if ((data as any)?.debug?.freshness?.last_date_with_data) {
          const last = (data as any).debug.freshness.last_date_with_data;
          const lag = (data as any).debug.freshness.freshness_lag_days;
          setDataFreshness({ lastDate: last, lagDays: lag });
          // If user's selected end is beyond last processed date, show a subtle notice or clamp view
          if (dateRange.end > last) {
            // We don't mutate user selected dateRange directly here to avoid confusion; could optionally do so.
          }
        } else {
          setDataFreshness(null);
        }
        // fetch trend points
        try {
          try {
            const { apiPost } = await import("@/lib/api");
            const trendJson = await apiPost("/api/v1/gsc/trend", {
              site_url: defaultSite,
              date_range: { start_date: dateRange.start, end_date: dateRange.end },
            });
            console.log("GSC trend:", trendJson);
            const sanitized: TrendPoint[] = Array.isArray(trendJson)
              ? trendJson
                  .filter((p: any) => p && typeof p.date === "string")
                  .map((p: any) => ({
                    date: p.date,
                    clicks: Number(p.clicks ?? 0),
                    impressions: Number(p.impressions ?? 0),
                    ctr: Number(p.ctr ?? 0),
                    position: Number(p.position ?? 0),
                    property_variant: p.property_variant,
                  }))
                  .sort((a, b) => a.date.localeCompare(b.date))
              : [];
            const normalized = fillTrendSeries(sanitized, dateRange.start, dateRange.end);
            setTrendData(normalized);
          } catch (err) {
            console.error("Failed to fetch GSC trend:", err);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch GSC trend:", err);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch GSC summary:", err);
      }
    };

    if (dateRange.start && dateRange.end) fetchSummary();
  }, [dateRange]);
  const displayedData = granularity === 'weekly' ? aggregateWeekly(trendData) : trendData;
  const latestPoint = React.useMemo(() => (displayedData && displayedData.length > 0 ? displayedData[displayedData.length - 1] : null), [displayedData]);
  const metricCards = [
    {
      key: "clicks" as MetricKey,
      title: "Total Clicks",
      value: summary ? summary.total_clicks : "—",
      icon: MousePointerClick,
      iconColor: "bg-blue-100 text-blue-600",
      subtitle: latestPoint ? `${formatCompactNumber(latestPoint.clicks)} on ${latestPoint.date}` : undefined,
    },
    {
      key: "impressions" as MetricKey,
      title: "Total Impressions",
      value: summary ? summary.total_impressions : "—",
      icon: Eye,
      iconColor: "bg-purple-100 text-purple-600",
      subtitle: latestPoint ? `${formatCompactNumber(latestPoint.impressions)} on ${latestPoint.date}` : undefined,
    },
    {
      key: "ctr" as MetricKey,
      title: "Average CTR",
      value: summary ? summary.average_ctr : "—",
      icon: TrendingUp,
      iconColor: "bg-green-100 text-green-600",
      subtitle: latestPoint ? `${latestPoint.ctr.toFixed(1)}% on ${latestPoint?.date}` : undefined,
    },
    {
      key: "position" as MetricKey,
      title: "Avg Position",
      value: summary ? summary.avg_position : "—",
      icon: Search,
      iconColor: "bg-orange-100 text-secondary",
      subtitle: latestPoint ? `${latestPoint.position.toFixed(1)} on ${latestPoint.date}` : undefined,
    },
  ];

  // Adaptively reduce X-axis ticks so labels are not overcrowded
  const xTicks = React.useMemo(() => {
    if (!displayedData || displayedData.length === 0) return [] as string[];
    // Target a maximum number of tick labels (rough heuristic for readability)
    const MAX_TICKS = 12; // show at most 12 labels (about monthly over a year)
    if (displayedData.length <= MAX_TICKS) {
      return displayedData.map(p => p.date);
    }
    const step = Math.ceil(displayedData.length / MAX_TICKS);
    const ticks: string[] = [];
    for (let i = 0; i < displayedData.length; i += step) {
      ticks.push(displayedData[i].date);
    }
    // Ensure last point is included
    const last = displayedData[displayedData.length - 1].date;
    if (ticks[ticks.length - 1] !== last) ticks.push(last);
    return ticks;
  }, [displayedData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Google Search Console"
          description="Monitor your SEO performance and search visibility"
          icon={Search}
        />
        {dataFreshness?.lagDays !== undefined && dataFreshness.lagDays > 0 && (
          <div className="text-xs text-muted-foreground w-full order-last md:order-none md:w-auto md:ml-auto md:text-right">
            Data through <span className="font-medium text-foreground">{dataFreshness.lastDate}</span> (≈{dataFreshness.lagDays} day lag)
          </div>
        )}
        {/* Right-corner site selector and demo badge removed */}
        <div className="flex items-center gap-4">
          <DateRangePicker value={dateRange} onChange={handleDate} />
          <SortButton onChange={handleSort} />
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as 'daily' | 'weekly')}
            className="px-3 py-2 border rounded-md"
            aria-label="Granularity"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card) => (
          <MetricCard
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconColor={card.iconColor}
            subtitle={card.subtitle}
            onClick={() => toggleMetric(card.key)}
            active={activeMetrics[card.key]}
            className={activeMetrics[card.key] ? "border border-primary/60" : "border border-border"}
          />
        ))}
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card space-y-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                dy={6}
                ticks={xTicks}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                width={100}
                ticks={[0,150000,300000,450000,600000]}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
                  return `${(value/1000).toFixed(0)}k`;
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={60}
                ticks={[0,4,8,12,16]}
              />
              <Tooltip
                formatter={(raw: number, key: string) => {
                  if (key === 'ctr') return [`${raw.toFixed(1)}%`, 'Average CTR'];
                  if (key === 'position') return [raw.toFixed(1), 'Average position'];
                  if (key === 'clicks') return [humanNumber(raw), 'Total clicks'];
                  if (key === 'impressions') return [humanNumber(raw), 'Total impressions'];
                  return [raw.toString(), key];
                }}
                labelFormatter={(label) => granularity === 'weekly' ? `Week ending ${label}` : label}
                contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--muted))" }}
              />
              <Legend wrapperStyle={{ paddingTop: 16 }} />
              {activeMetrics.clicks && (
                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="Total clicks"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                  yAxisId="left"
                />
              )}
              {activeMetrics.impressions && (
                <Line
                  type="monotone"
                  dataKey="impressions"
                  name="Total impressions"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                  yAxisId="left"
                />
              )}
              {activeMetrics.ctr && (
                <Line
                  type="monotone"
                  dataKey="ctr"
                  name="Average CTR"
                  stroke="#0f766e"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                  yAxisId="right"
                />
              )}
              {activeMetrics.position && (
                <Line
                  type="monotone"
                  dataKey="position"
                  name="Average position"
                  stroke="#ea580c"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                  yAxisId="right"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-playfair font-bold">Page indexing</h3>
            <p className="text-sm text-muted-foreground">All known pages</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <button className="inline-flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-full">
              All known pages
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              Last updated: <span className="font-medium text-foreground">9/26/25</span>
            </span>
            <button className="inline-flex items-center gap-2 px-3 py-1 border border-border rounded-full text-foreground hover:bg-muted/40">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pageIndexingSummary.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border ${item.border} ${item.background} p-5`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${item.dotColor}`} />
                {item.label}
              </div>
              <p className="mt-3 text-3xl font-playfair font-bold text-foreground">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.helper}</p>
            </div>
          ))}
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={pageIndexingTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} dy={6} />
              <YAxis
                yAxisId="pages"
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(value) => `${Math.round(value / 1000)}K`}
              />
              <YAxis
                yAxisId="impressions"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(value) => `${Math.round(value / 1000)}K`}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "impressions") {
                    return [value.toLocaleString(), "Impressions"];
                  }
                  return [value.toLocaleString(), name === "indexed" ? "Indexed pages" : "Not indexed pages"];
                }}
                labelFormatter={(label) => `Week of ${label}`}
                contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--muted))" }}
              />
              <Legend wrapperStyle={{ paddingTop: 12 }} />
              <Bar dataKey="notIndexed" stackId="pages" fill="#d1d5db" name="Not indexed" radius={[6, 6, 0, 0]} yAxisId="pages" />
              <Bar dataKey="indexed" stackId="pages" fill="#10b981" name="Indexed" radius={[0, 0, 6, 6]} yAxisId="pages" />
              <Line
                type="monotone"
                dataKey="impressions"
                name="Impressions"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                yAxisId="impressions"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-playfair font-bold">Core Web Vitals</h3>
            <p className="text-sm text-muted-foreground">
              Mobile • Source: <span className="font-medium text-foreground">Chrome UX report</span> • Last updated: <span className="font-medium text-foreground">{dateRange.end}</span> { /* demo badge could be added here if needed */ }
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted/40 transition-smooth">
            Open report
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={coreWebVitalsMobileData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} dy={6} />
                <YAxis tickLine={false} axisLine={false} width={70} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labelMap: Record<string, string> = {
                      good: "Good URLs",
                      needsImprovement: "Needs improvement",
                      poor: "Poor URLs",
                    };
                    return [value.toLocaleString(), labelMap[name] ?? name];
                  }}
                  labelFormatter={(label) => `Week of ${label}`}
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--muted))" }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Area type="monotone" dataKey="good" name="Good URLs" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                <Area type="monotone" dataKey="needsImprovement" name="Needs improvement" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                <Area type="monotone" dataKey="poor" name="Poor URLs" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {coreWebVitalsMobileSummary.map((item) => (
              <div key={item.label} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.indicator}`} />
                    <span className="text-sm font-semibold text-muted-foreground">{item.label}</span>
                  </div>
                  <span className={`text-xl font-playfair font-bold ${item.color}`}>{item.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>Field data collected over a rolling 28-day window.</span>
          <button className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary transition-smooth">
            View detailed report
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-playfair font-bold">Core Web Vitals</h3>
            <p className="text-sm text-muted-foreground">
              Desktop • Source: <span className="font-medium text-foreground">Chrome UX report</span> • Last updated: <span className="font-medium text-foreground">{dateRange.end}</span>
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted/40 transition-smooth">
            Open report
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={coreWebVitalsDesktopData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} dy={6} />
                <YAxis tickLine={false} axisLine={false} width={70} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labelMap: Record<string, string> = {
                      good: "Good URLs",
                      needsImprovement: "Needs improvement",
                      poor: "Poor URLs",
                    };
                    return [value.toLocaleString(), labelMap[name] ?? name];
                  }}
                  labelFormatter={(label) => `Week of ${label}`}
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--muted))" }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Area type="monotone" dataKey="good" name="Good URLs" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                <Area type="monotone" dataKey="needsImprovement" name="Needs improvement" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                <Area type="monotone" dataKey="poor" name="Poor URLs" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {coreWebVitalsDesktopSummary.map((item) => (
              <div key={item.label} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.indicator}`} />
                    <span className="text-sm font-semibold text-muted-foreground">{item.label}</span>
                  </div>
                  <span className={`text-xl font-playfair font-bold ${item.color}`}>{item.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>Desktop data shows consistent good experience across pages.</span>
          <button className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary transition-smooth">
            View detailed report
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-playfair font-bold">Experience</h3>
          <p className="text-sm text-muted-foreground">Overview of site experience signals</p>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-muted/40">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-semibold text-left">Type</th>
                <th className="px-4 py-3 font-semibold text-right">Good</th>
                <th className="px-4 py-3 font-semibold text-right">Needs improvement</th>
                <th className="px-4 py-3 font-semibold text-right">Poor</th>
                <th className="px-4 py-3 font-semibold text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {experienceSections.map((section) =>
                section.rows.map((row, index) => (
                  <tr key={`${section.group}-${row.key}`} className="bg-card">
                    <td className="px-4 py-4 align-top">
                      <div className={`font-semibold text-foreground ${index > 0 ? "invisible h-0" : ""}`}>
                        {section.group}
                      </div>
                      <div className={`text-sm text-muted-foreground ${index === 0 ? "mt-1" : ""}`}>
                        {index === 0 ? row.label : <span className="pl-6 block">{row.label}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600">{row.good}</td>
                    <td className="px-4 py-4 text-right text-amber-500 font-medium">{row.needsImprovement}</td>
                    <td className="px-4 py-4 text-right text-red-500 font-medium">{row.poor}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-12 w-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={row.trend} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
                              <XAxis dataKey="date" hide />
                              <YAxis hide domain={[0, "auto"]} />
                              <Line type="monotone" dataKey="good" stroke="#10b981" strokeWidth={2.5} dot={false} />
                              <Line type="monotone" dataKey="needsImprovement" stroke="#f59e0b" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="poor" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        <div className="p-6 bg-card rounded-xl shadow-recipe-card space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-playfair font-bold">Enhancements</h3>
            <p className="text-sm text-muted-foreground">Status of structured data enhancements</p>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-muted/40">
                <tr className="text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-semibold text-left">Type</th>
                  <th className="px-4 py-3 font-semibold text-right">Valid</th>
                  <th className="px-4 py-3 font-semibold text-right">Invalid</th>
                  <th className="px-4 py-3 font-semibold text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {enhancements.map((item) => (
                  <tr key={item.key} className="bg-card">
                    <td className="px-4 py-4 font-medium text-foreground">{item.label}</td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600">{item.valid}</td>
                    <td className="px-4 py-4 text-right text-red-500 font-medium">{item.invalid}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-12 w-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={item.trend} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
                              <XAxis dataKey="date" hide />
                              <YAxis hide domain={[0, "auto"]} />
                              <Line type="monotone" dataKey="valid" stroke="#10b981" strokeWidth={2.5} dot={false} />
                              <Line type="monotone" dataKey="invalid" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card">
        <h3 className="text-xl font-playfair font-bold mb-6">Top Performing Queries</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Query</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Clicks</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Impressions</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">CTR</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Position</th>
              </tr>
            </thead>
            <tbody>
              {topQueries.map((query, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/30 transition-smooth">
                  <td className="py-3 px-4 font-medium">{query.query}</td>
                  <td className="py-3 px-4 text-right">{query.clicks}</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{query.impressions}</td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">{query.ctr}</td>
                  <td className="py-3 px-4 text-right">{query.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h4 className="font-bold mb-4 text-muted-foreground">Indexed Pages</h4>
          <p className="text-3xl font-playfair font-bold text-foreground">2.11K</p>
          <p className="text-green-600 font-medium mt-2">Valid</p>
        </div>
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h4 className="font-bold mb-4 text-muted-foreground">Core Web Vitals</h4>
          <p className="text-3xl font-playfair font-bold text-foreground">1,209</p>
          <p className="text-green-600 font-medium mt-2">Good URLs</p>
        </div>
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h4 className="font-bold mb-4 text-muted-foreground">Rich Results</h4>
          <p className="text-3xl font-playfair font-bold text-foreground">864</p>
          <p className="text-green-600 font-medium mt-2">Recipes Valid</p>
        </div>
      </div>
    </div>
  );
}
