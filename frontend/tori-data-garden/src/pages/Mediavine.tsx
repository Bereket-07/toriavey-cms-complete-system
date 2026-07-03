import { useState } from "react";
import { DollarSign, TrendingUp, ExternalLink } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";

import { DateRangePicker, SortButton, PresetRangeKey } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, startOfDay, subDays } from "date-fns";

export default function Mediavine() {
  const { showLoading } = useLoading();
  const handleSort = (_preset: PresetRangeKey) => showLoading();
  const handleDate = () => showLoading();
  const chartStartDate = startOfDay(new Date(2025, 8, 29));
  const chartPoints = Array.from({ length: 28 }).map((_, index) => {
    const date = subDays(chartStartDate, 27 - index);
    const sessionsBase = 20000 + Math.sin(index / 3) * 8000 + (index === 23 ? 25000 : 0);
    const earningsBase = 900 + Math.cos(index / 2.5) * 400 + (index === 23 ? 1500 : 0);
    const rpmBase = 55 + Math.sin(index / 4) * 10 + (index >= 10 && index <= 20 ? 6 : 0) + (index === 23 ? 18 : 0);
    return {
      date,
      dateLabel: format(date, "MMM d, yyyy"),
      displayLabel: format(date, "MMM d"),
      sessions: Math.max(8000, Math.round(sessionsBase)),
      earnings: Math.max(300, Math.round(earningsBase)),
      rpm: Math.max(22, Math.round(rpmBase * 100) / 100),
    };
  });
  const [showEarnings, setShowEarnings] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [showRpm, setShowRpm] = useState(true);
  const [showRpmSessions, setShowRpmSessions] = useState(true);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Mediavine Monetization"
          description="Track ad revenue and RPM performance"
          icon={DollarSign}
        />
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleDate} />
          <SortButton onChange={handleSort} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Yesterday's Earnings"
          value="$1,133.16"
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Month to Date"
          value="$29,319.63"
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Session RPM"
          value="$56.23"
          icon={TrendingUp}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Page RPM"
          value="$42.80"
          icon={TrendingUp}
          iconColor="bg-blue-100 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h3 className="text-xl font-playfair font-bold mb-6">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Daily Average</span>
              <span className="font-bold text-lg">$1,133.16</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Monthly Projection</span>
              <span className="font-bold text-lg text-green-600">~$34K</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Avg Monthly RPM</span>
              <span className="font-bold text-lg">$56.34</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h3 className="text-xl font-playfair font-bold mb-6">Traffic Correlation</h3>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Yesterday's Sessions</p>
              <p className="text-2xl font-bold">16,050</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Yesterday's Pageviews</p>
              <p className="text-2xl font-bold">21,085</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Monthly Sessions</p>
              <p className="text-2xl font-bold">500,313</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-playfair font-bold text-green-900">Performance Insights</h3>
        </div>
        <p className="text-green-800">
          Your RPM is performing above industry average. Yesterday's session RPM of $56.23 indicates strong
          ad engagement and quality traffic. Continue focusing on content that drives engaged visitors.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)]">
        <div className="rounded-3xl overflow-hidden shadow-xl border border-[#e4d6c4] bg-[#fdf9f3]">
          <div className="bg-gradient-to-br from-[#f6ede1] via-[#fdf9f3] to-white text-[#3b3a36] px-8 py-6 relative">
            <div className="absolute right-6 top-6 h-16 w-16 rounded-full bg-[#d0bfa9]/40 blur-md" />
            <h2 className="text-2xl font-semibold tracking-tight">Earnings Summary</h2>
            <p className="text-sm text-[#5b564f]">Snapshot of your recent Mediavine performance</p>
            <div className="mt-4 grid gap-6 md:grid-cols-3 text-base">
              <div className="space-y-1 border-[#e4d6c4] md:border-r pr-0 md:pr-6">
                <p className="text-sm uppercase tracking-wide text-[#6e6458]">Yesterday</p>
                <p className="text-xs text-[#867a6b]">Sep 30</p>
                <p className="text-2xl font-bold text-[#3b3a36]">$764.12</p>
              </div>
              <div className="space-y-1 border-[#e4d6c4]/70 md:border-r px-0 md:px-6">
                <p className="text-sm uppercase tracking-wide text-[#6e6458]">Month to Date</p>
                <p className="text-xs text-[#867a6b]">Sep 1 – Sep 30</p>
                <p className="text-2xl font-bold text-[#3b3a36]">$30,818.76</p>
              </div>
              <div className="space-y-1 pl-0 md:pl-6">
                <p className="text-sm uppercase tracking-wide text-[#6e6458]">Last Month</p>
                <p className="text-xs text-[#867a6b]">Aug 1 – Aug 31</p>
                <p className="text-2xl font-bold text-[#3b3a36]">$0.00</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-white text-[#3b3a36] border-t border-[#e4d6c4]">
            <h3 className="text-lg font-semibold uppercase tracking-wide text-[#2f7760]">RPM</h3>
            <div className="mt-4 grid gap-6 md:grid-cols-3 text-base">
              <div className="space-y-1 md:border-r border-[#e4d6c4] pr-0 md:pr-6">
                <p className="text-sm text-[#6e6458]">Sep 29</p>
                <p className="text-xs text-[#8c8173] uppercase">Session RPM</p>
                <p className="text-2xl font-semibold text-[#2f7760]">$44.27</p>
                <p className="text-xs text-[#8c8173]">Page RPM: <span className="font-semibold text-[#2f7760]">$33.33</span></p>
              </div>
              <div className="space-y-1 md:border-r border-[#e4d6c4] px-0 md:px-6">
                <p className="text-sm text-[#6e6458]">Sep 1 - Sep 29</p>
                <p className="text-xs text-[#8c8173] uppercase">Session RPM</p>
                <p className="text-2xl font-semibold text-[#2f7760]">$55.73</p>
                <p className="text-xs text-[#8c8173]">Page RPM: <span className="font-semibold text-[#2f7760]">$37.95</span></p>
              </div>
              <div className="space-y-1 pl-0 md:pl-6">
                <p className="text-sm text-[#6e6458]">Last Month</p>
                <p className="text-xs text-[#8c8173] uppercase">Session RPM</p>
                <p className="text-2xl font-semibold text-[#2f7760]">$0.00</p>
                <p className="text-xs text-[#8c8173]">Page RPM: <span className="font-semibold text-[#2f7760]">$0.00</span></p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-[#f6ede1] text-[#3b3a36] border-t border-[#e4d6c4]">
            <h3 className="text-lg font-semibold uppercase tracking-wide text-[#2f7760]">Traffic</h3>
            <div className="mt-4 grid gap-6 md:grid-cols-3 text-base">
              <div className="space-y-1 md:border-r border-[#e4d6c4] pr-0 md:pr-6">
                <p className="text-sm text-[#6e6458]">Sep 29</p>
                <p className="text-xs uppercase text-[#8c8173]">Sessions:</p>
                <p className="text-2xl font-semibold text-[#2f7760]">16,603</p>
                <p className="text-xs text-[#8c8173]">Pageviews: <span className="font-semibold text-[#2f7760]">22,055</span></p>
              </div>
              <div className="space-y-1 md:border-r border-[#e4d6c4] px-0 md:px-6">
                <p className="text-sm text-[#6e6458]">Sep 1 - Sep 29</p>
                <p className="text-xs uppercase text-[#8c8173]">Sessions:</p>
                <p className="text-2xl font-semibold text-[#2f7760]">539,307</p>
                <p className="text-xs text-[#8c8173]">Pageviews: <span className="font-semibold text-[#2f7760]">791,938</span></p>
              </div>
              <div className="space-y-1 pl-0 md:pl-6">
                <p className="text-sm text-[#6e6458]">Last Month</p>
                <p className="text-xs uppercase text-[#8c8173]">Sessions:</p>
                <p className="text-2xl font-semibold text-[#2f7760]">0</p>
                <p className="text-xs text-[#8c8173]">Pageviews: <span className="font-semibold text-[#2f7760]">0</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-3xl overflow-hidden shadow-xl border border-[#e4d6c4] bg-[#fdf9f3]">
          <div className="bg-gradient-to-r from-[#2f7760] to-[#255d4b] text-white px-6 py-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <select className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/70">
                <option className="text-slate-800">Custom</option>
                <option className="text-slate-800">Last 7 Days</option>
                <option className="text-slate-800">Last 30 Days</option>
              </select>
              <label className="flex items-center gap-2 bg-white/15 border border-white/30 rounded-xl px-4 py-2 text-sm font-medium">
                <input type="checkbox" className="h-4 w-4 rounded border-white/50 bg-white/30 accent-[#f0c29d]" defaultChecked />
                Compare: Last Period
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-white/15 rounded-full p-1 text-sm font-medium">
                <button className="px-4 py-1 rounded-full bg-white text-[#2f7760] shadow-sm">Sessions</button>
                <button className="px-4 py-1 rounded-full text-white/90 hover:text-white">Pageviews</button>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6 text-[#3b3a36]">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#e4d6c4] pb-4">
              <h3 className="text-xl font-semibold">Revenue</h3>
              <p className="text-sm text-[#6e6458]">
                <span className="font-semibold text-[#2f7760]">Lifetime:</span> Sep 2, 2025 – Sep 29, 2025
                <span className="mx-2 text-[#d0bfa9]">•</span>
                compared to <span className="font-semibold text-[#2f7760]">Last Period:</span> Aug 5, 2025 – Sep 1, 2025
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#e4d6c4] bg-white px-6 py-5 space-y-2 text-center shadow-sm">
                <h4 className="text-sm text-[#8c8173] uppercase tracking-wide">Revenue</h4>
                <p className="text-3xl font-bold text-[#2f7760]">$30,054.63</p>
                <p className="text-xs text-[#8c8173]">Comparison not available</p>
              </div>
              <div className="rounded-2xl border border-[#e4d6c4] bg-white px-6 py-5 space-y-2 text-center shadow-sm">
                <h4 className="text-sm text-[#8c8173] uppercase tracking-wide">Sessions</h4>
                <p className="text-3xl font-bold text-[#2f7760]">539,307</p>
                <p className="text-xs text-[#8c8173]">Comparison not available</p>
              </div>
              <div className="rounded-2xl border border-[#e4d6c4] bg-white px-6 py-5 space-y-2 text-center shadow-sm">
                <h4 className="text-sm text-[#8c8173] uppercase tracking-wide">RPM</h4>
                <p className="text-3xl font-bold text-[#2f7760]">$55.73</p>
                <p className="text-xs text-[#8c8173]">Comparison not available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-3xl overflow-hidden shadow-xl border border-[#e4d6c4] bg-[#fdf9f3]">
          <div className="bg-gradient-to-r from-[#2f7760] to-[#255d4b] text-white px-8 py-6">
            <h3 className="text-2xl font-semibold">Earnings</h3>
          </div>
          <div className="px-8 py-6 space-y-6 text-[#3b3a36]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[#6e6458]">
                <span className="font-semibold text-[#2f7760]">Lifetime:</span> Sep 2, 2025 – Sep 29, 2025
              </p>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showEarnings}
                    onChange={(event) => setShowEarnings(event.target.checked)}
                    className="h-4 w-4 rounded border-[#d0bfa9] bg-white accent-[#f0c29d]"
                  />
                  Earnings
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showSessions}
                    onChange={(event) => setShowSessions(event.target.checked)}
                    className="h-4 w-4 rounded border-[#d0bfa9] bg-white accent-[#2f7760]"
                  />
                  Sessions
                </label>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer>
                <AreaChart data={chartPoints} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mediavine-earnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f0c29d" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#f0c29d" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="mediavine-sessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f7760" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="#2f7760" stopOpacity={0.12} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4d6c4" />
                  <XAxis
                    dataKey="displayLabel"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6e6458" }}
                    minTickGap={24}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6e6458" }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    hide={!showEarnings}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6e6458" }}
                    tickFormatter={(value) => value.toLocaleString()}
                    hide={!showSessions}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fdf9f3", borderColor: "#e4d6c4", borderRadius: "0.75rem", color: "#3b3a36" }}
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value, name) => [name === "earnings" ? `$${value.toLocaleString()}` : value.toLocaleString(), name]}
                  />
                  {showEarnings && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="earnings"
                      stroke="#f0a66f"
                      strokeWidth={3}
                      fill="url(#mediavine-earnings)"
                      dot={{ r: 3, strokeWidth: 2, fill: "#fdf9f3" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {showSessions && (
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="sessions"
                      stroke="#2f7760"
                      strokeWidth={3}
                      fill="url(#mediavine-sessions)"
                      dot={{ r: 3, strokeWidth: 2, fill: "#fdf9f3" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-3xl overflow-hidden shadow-xl border border-[#e4d6c4] bg-[#fdf9f3]">
          <div className="bg-gradient-to-r from-[#2f7760] to-[#255d4b] text-white px-8 py-6">
            <h3 className="text-2xl font-semibold">RPM</h3>
          </div>
          <div className="px-8 py-6 space-y-6 text-[#3b3a36]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[#6e6458]">
                <span className="font-semibold text-[#2f7760]">Lifetime:</span> Sep 2, 2025 – Sep 29, 2025
              </p>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showRpm}
                    onChange={(event) => setShowRpm(event.target.checked)}
                    className="h-4 w-4 rounded border-[#d0bfa9] bg-white accent-[#d97757]"
                  />
                  RPM
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showRpmSessions}
                    onChange={(event) => setShowRpmSessions(event.target.checked)}
                    className="h-4 w-4 rounded border-[#d0bfa9] bg-white accent-[#2f7760]"
                  />
                  Sessions
                </label>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer>
                <AreaChart data={chartPoints} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mediavine-rpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f0a66f" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#f0a66f" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="mediavine-sessions-alt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f7760" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="#2f7760" stopOpacity={0.12} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4d6c4" />
                  <XAxis
                    dataKey="displayLabel"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6e6458" }}
                    minTickGap={24}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6e6458" }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    hide={!showRpm}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6e6458" }}
                    tickFormatter={(value) => value.toLocaleString()}
                    hide={!showRpmSessions}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fdf9f3", borderColor: "#e4d6c4", borderRadius: "0.75rem", color: "#3b3a36" }}
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value, name) => [name === "rpm" ? `$${value.toLocaleString()}` : value.toLocaleString(), name]}
                  />
                  {showRpm && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="rpm"
                      stroke="#d97757"
                      strokeWidth={3}
                      fill="url(#mediavine-rpm)"
                      dot={{ r: 3, strokeWidth: 2, fill: "#fdf9f3" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {showRpmSessions && (
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="sessions"
                      stroke="#2f7760"
                      strokeWidth={3}
                      fill="url(#mediavine-sessions-alt)"
                      dot={{ r: 3, strokeWidth: 2, fill: "#fdf9f3" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
