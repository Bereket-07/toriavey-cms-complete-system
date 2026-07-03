import {
  MousePointerClick,
  Users,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Activity,
  LayoutDashboard,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";

import { DateRangePicker, SortButton, PresetRangeKey } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { fetchSlickstreamPageMetrics, fetchSlickstreamSite } from "@/lib/api";

export default function Slickstream() {
  const { showLoading } = useLoading();
  const [siteSummary, setSiteSummary] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [
    clickTrendData,
    setClickTrendData,
  ] = useState<{ date: string; slickstreamClicks: number; linkClicks: number }[]>([]);


  const handleSort = (_preset: PresetRangeKey) => showLoading();
  const handleDate = () => showLoading();
  useEffect(() => {
    // Fetch Slickstream data; page metrics are primary, site summary is optional
    (async () => {
      setApiError(null);
      try {
        const pages = await fetchSlickstreamPageMetrics(50);

        const items = Array.isArray(pages?.results)
          ? pages.results
          : Array.isArray(pages)
            ? pages
            : [];

        const agg: Record<string, { slick: number; link: number }> = {};
        for (const it of items) {
          const dateStr = typeof it?.last_updated === "string" ? it.last_updated : "";
          const key = dateStr ? dateStr.slice(0, 10) : "unknown"; // YYYY-MM-DD
          const views = Number((it as any)?.views ?? 0) || 0;
          const favorites = Number((it as any)?.favorites ?? 0) || 0;
          if (!agg[key]) agg[key] = { slick: 0, link: 0 };
          agg[key].slick += favorites;
          agg[key].link += views;
        }

        const trend = Object.entries(agg)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([d, v]) => ({ date: d, slickstreamClicks: v.slick, linkClicks: v.link }));

        setClickTrendData(trend);
      } catch (e: any) {
        setApiError(e?.message || "Failed to load Slickstream page metrics");
      }

      // Fetch site summary separately; don't block trend chart if it fails
      try {
        const site = await fetchSlickstreamSite();
        setSiteSummary(site);
      } catch (e) {
        // ignore
      }
    })();
  }, []);
  const totalSlickstreamClicks = clickTrendData.reduce((sum, item) => sum + item.slickstreamClicks, 0);
  const totalLinkClicks = clickTrendData.reduce((sum, item) => sum + item.linkClicks, 0);
  const trafficStats = [
    {
      label: "Total Pageviews",
      description: "The total number of pageviews on this site that we detected and processed.",
      value: siteSummary?.total_pageviews?.toLocaleString() || "—",
    },
    {
      label: "Net Pageviews",
      description:
        "This is the number of pageviews we processed, but excludes any pageviews from bots, crawlers, or spiders that we detected. This is the number that is used to compute your monthly Slickstream fees. All other analytics on this site related to pageviews are based on this count.",
      value: siteSummary?.net_pageviews?.toLocaleString() || "—",
    },
    {
      label: "Ad Blockers",
      description: "This is the percentage of net pageviews on which we detected that an ad blocker was in use.",
      value: siteSummary?.ad_blockers ? `${(siteSummary.ad_blockers * 100).toFixed(1)}%` : "—",
    },
    {
      label: "Unblocked Pageviews",
      description:
        "This is the approximate number of pageviews that will appear in other analytics, such as Google Analytics. This is the Total Pageviews minus those from bots (which are typically excluded by Google Analytics) minus those with ad blockers (where the ad blocker typically inhibits reporting to Google Analytics to avoid tracking).",
      value: siteSummary?.unblocked_pageviews?.toLocaleString() || "—",
    },
    {
      label: "Sessions",
      description:
        "Sessions are sequences of pageviews within the same 30-minute window from the same visitor. This excludes bots, so corresponds to Net Pageviews shown above.",
      value: siteSummary?.sessions?.toLocaleString() || "—",
    },
  ];
  const engagementStats = [
    {
      label: "Immediate bounces",
      description: "Pageviews with absolutely no visitor activity (click, scroll, etc.).",
      value: siteSummary?.immediate_bounces ? `${(siteSummary.immediate_bounces * 100).toFixed(1)}%` : "—",
    },
    {
      label: "Active time",
      description: "Average active time per session (excluding bounces) recorded in 10 second windows.",
      value: siteSummary?.active_time_per_session ? `${Math.floor(siteSummary.active_time_per_session / 60)}m ${siteSummary.active_time_per_session % 60}s` : "—",
    },
    {
      label: "Pageviews per Session",
      description: "Average number of pageviews for each session.",
      value: siteSummary?.pageviews_per_session?.toFixed(2) || "—",
    },
    {
      label: "Return visitors",
      description: "Percentage of sessions from visitors returning after an earlier visit.",
      value: siteSummary?.return_visitors ? `${(siteSummary.return_visitors * 100).toFixed(1)}%` : "—",
    },
  ];
  const widgetStats = [
    { label: "Filmstrip toolbar", value: siteSummary?.filmstrip_toolbar ? `${(siteSummary.filmstrip_toolbar * 100).toFixed(1)}%` : "—" },
    { label: "Search panel", value: siteSummary?.search_panel ? `${(siteSummary.search_panel * 100).toFixed(1)}%` : "—" },
    { label: "DCM", value: siteSummary?.dcm ? `${(siteSummary.dcm * 100).toFixed(1)}%` : "—" },
    {
      label: "Back-To-Top",
      description: "Percent of pageviews where the back-to-top button was used at least once.",
      value: siteSummary?.back_to_top ? `${(siteSummary.back_to_top * 100).toFixed(1)}%` : "—",
    },
    {
      label: "Story Sources",
      description: "Pageviews originating from a related-page link in a Slickstream-hosted web story.",
      value: siteSummary?.story_sources?.toString() || "—",
    },
  ];
  return (
    <div className="space-y-8">
      {apiError ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Failed to load Slickstream data: {apiError}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Slickstream Engagement"
          description="Analyze user behavior and widget performance"
          icon={MousePointerClick}
        />
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleDate} />
          <SortButton onChange={handleSort} />
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-recipe-card overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary font-playfair">
                TA
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-playfair font-bold text-foreground">Tori Avey</h2>
                  <a
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    href="https://toriavey.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit site
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Browse hundreds of healthy, easy and delicious recipes from the Mediterranean and beyond.
                  Join popular food writer Tori Avey on a culinary journey to discover delicious global flavors.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm lg:items-end">
              <span className="uppercase tracking-wide text-muted-foreground">Account ID</span>
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                {import.meta.env.VITE_SLICKSTREAM_SITE_KEY || 'SITE_KEY'}
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Last 30 Days
            </span>
            <span className="text-xs text-muted-foreground">Updated moments ago</span>
          </div>
        </div>

        <div className="border-t border-border bg-muted/40 px-6 py-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Slickstream Usage
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View usage details
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4 shadow-sm bg-white text-foreground dark:bg-slate-950 dark:text-card-foreground">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span>Pageviews ({siteSummary?.searches?.toLocaleString() || "5,555"})</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/80" />
              </div>
              <p className="mt-2 text-3xl font-playfair font-bold text-foreground">
                {siteSummary?.searches?.toLocaleString() || "—"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Number of pageviews with at least one search
              </p>
            </Card>
            <Card className="p-4 shadow-sm bg-white text-foreground dark:bg-slate-950 dark:text-card-foreground">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span>Favorites</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/80" />
              </div>
              <p className="mt-2 text-3xl font-playfair font-bold text-foreground">
                {siteSummary?.favorites?.toLocaleString() || "—"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Number of times a viewer marked one of your pages as a favorite
              </p>
            </Card>
            <Card className="p-4 shadow-sm bg-white text-foreground dark:bg-slate-950 dark:text-card-foreground">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span>Total Members</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/80" />
              </div>
              <p className="mt-2 text-3xl font-playfair font-bold text-foreground">
                {siteSummary?.members?.toLocaleString() || "—"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Number of visitors who have signed in
              </p>
            </Card>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border border-border bg-card shadow-recipe-card">
        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-playfair font-bold text-foreground">Click Engagement Trends</h3>
              <p className="text-sm text-muted-foreground">
                Track how Slickstream widgets drive on-site pageviews compared to traditional link clicks.
              </p>
            </div>
            <div className="h-80 rounded-xl bg-background px-4 py-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={clickTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="slickstreamGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff73a1" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#ff73a1" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="linkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5a8df6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#5a8df6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeOpacity={0.1} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                    contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="slickstreamClicks"
                    stroke="#ff73a1"
                    strokeWidth={3}
                    fill="url(#slickstreamGradient)"
                    name="Slickstream clicks"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="linkClicks"
                    stroke="#5a8df6"
                    strokeWidth={3}
                    fill="url(#linkGradient)"
                    name="Link clicks"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-sm bg-[#ff73a1]" />
                Slick widget clicks: {totalSlickstreamClicks.toLocaleString()} (0%)
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-sm bg-[#5a8df6]" />
                Other link clicks: {totalLinkClicks.toLocaleString()} (0%)
              </div>
            </div>
            <div className="mt-2 text-lg font-semibold text-foreground">
              {(totalSlickstreamClicks + totalLinkClicks).toLocaleString()} Clicks
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-2xl bg-[#ff73a1] px-6 py-8 text-white shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] opacity-80">Total</p>
              <p className="mt-2 text-5xl font-bold font-playfair">{(totalSlickstreamClicks + totalLinkClicks).toLocaleString()}</p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.25em]">Clicks</p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-background/80 p-6 text-sm text-muted-foreground">
              <div>
                <h4 className="text-base font-semibold text-foreground">Slickstream clicks</h4>
                <p>Number of clicks on Slickstream widgets resulting in a new on-site pageview.</p>
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground">Link clicks</h4>
                <p>Number of clicks (excluding Slickstream widgets) resulting in a new on-site pageview.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden border border-border bg-card shadow-recipe-card">
          <div className="flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Traffic</span>
            </div>
            <ChevronRight className="h-5 w-5" />
          </div>
          <div className="divide-y divide-border/60">
            {trafficStats.map((metric) => (
              <div
                key={metric.label}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="max-w-2xl space-y-1">
                  <h4 className="text-base font-semibold text-foreground">{metric.label}</h4>
                  {metric.description ? (
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  ) : null}
                </div>
                <span className="text-3xl font-playfair font-bold text-foreground sm:text-right">{metric.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden border border-border bg-card shadow-recipe-card">
          <div className="flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Engagement</span>
            </div>
            <ChevronRight className="h-5 w-5" />
          </div>
          <div className="divide-y divide-border/60">
            {engagementStats.map((metric) => (
              <div
                key={metric.label}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="max-w-2xl space-y-1">
                  <h4 className="text-base font-semibold text-foreground">{metric.label}</h4>
                  {metric.description ? (
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  ) : null}
                </div>
                <span className="text-3xl font-playfair font-bold text-foreground sm:text-right">{metric.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden border border-border bg-card shadow-recipe-card">
          <div className="flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Widgets</span>
            </div>
            <ChevronRight className="h-5 w-5" />
          </div>
          <div className="divide-y divide-border/60">
            {widgetStats.map((metric) => (
              <div
                key={metric.label}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="max-w-2xl space-y-1">
                  <h4 className="text-base font-semibold text-foreground">{metric.label}</h4>
                  {metric.description ? (
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  ) : null}
                </div>
                <span className="text-3xl font-playfair font-bold text-foreground sm:text-right">{metric.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Pageviews"
          value={siteSummary?.total_pageviews?.toLocaleString() || "—"}
          icon={Users}
          iconColor="bg-cyan-100 text-cyan-600"
        />
        <MetricCard
          title="Sessions"
          value={siteSummary?.sessions?.toLocaleString() || "—"}
          icon={Users}
          iconColor="bg-cyan-100 text-cyan-600"
        />
        <MetricCard
          title="Active Time/Session"
          value={siteSummary?.active_time_per_session ? `${Math.floor(siteSummary.active_time_per_session / 60)}m ${siteSummary.active_time_per_session % 60}s` : "—"}
          icon={Clock}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Pageviews/Session"
          value={siteSummary?.pageviews_per_session?.toFixed(2) || "—"}
          icon={MousePointerClick}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h3 className="text-xl font-playfair font-bold mb-6">Engagement Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Immediate Bounces</span>
              <span className="font-bold text-lg text-green-600">
                {siteSummary?.immediate_bounces ? `${(siteSummary.immediate_bounces * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Return Visitors</span>
              <span className="font-bold text-lg">
                {siteSummary?.return_visitors ? `${(siteSummary.return_visitors * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Ad Blockers</span>
              <span className="font-bold text-lg text-green-600">
                {siteSummary?.ad_blockers ? `${(siteSummary.ad_blockers * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h3 className="text-xl font-playfair font-bold mb-6">Widget Performance</h3>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Search Panel</span>
                <span className="font-bold">
                  {siteSummary?.search_panel ? `${(siteSummary.search_panel * 100).toFixed(1)}%` : "—"}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{
                  width: siteSummary?.search_panel ? `${(siteSummary.search_panel * 100).toFixed(1)}%` : "0%"
                }}></div>
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">DCM</span>
                <span className="font-bold">
                  {siteSummary?.dcm ? `${(siteSummary.dcm * 100).toFixed(1)}%` : "—"}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{
                  width: siteSummary?.dcm ? `${(siteSummary.dcm * 100).toFixed(1)}%` : "0%"
                }}></div>
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Filmstrip Toolbar</span>
                <span className="font-bold">
                  {siteSummary?.filmstrip_toolbar ? `${(siteSummary.filmstrip_toolbar * 100).toFixed(1)}%` : "—"}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-terracotta h-2 rounded-full" style={{
                  width: siteSummary?.filmstrip_toolbar ? `${(siteSummary.filmstrip_toolbar * 100).toFixed(1)}%` : "0%"
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-playfair font-bold">Site Searches</h3>
          </div>
          <p className="text-4xl font-playfair font-bold text-foreground">
            {siteSummary?.searches?.toLocaleString() || "—"}
          </p>
          <p className="text-muted-foreground mt-2">Total searches this period</p>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <div className="flex items-center gap-3 mb-4">
            <MousePointerClick className="h-6 w-6 text-secondary" />
            <h3 className="text-xl font-playfair font-bold">Favorites Added</h3>
          </div>
          <p className="text-4xl font-playfair font-bold text-foreground">
            {siteSummary?.favorites?.toLocaleString() || "—"}
          </p>
          <p className="text-muted-foreground mt-2">Recipes saved by users</p>
        </div>
      </div>
    </div>
  );
}
