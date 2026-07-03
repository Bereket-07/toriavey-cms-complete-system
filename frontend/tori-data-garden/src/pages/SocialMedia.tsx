import { useId, useState } from "react";

import { Instagram, Youtube, Facebook, Twitter } from "lucide-react";
import { FaPinterest } from "react-icons/fa";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DateRangePicker, SortButton, PresetRangeKey } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";

const subscriberTrendTemplate: number[] = [
  4,
  -2,
  9,
  6,
  3,
  7,
  -5,
  8,
  5,
  6,
  -3,
  4,
  2,
  7,
  -1,
  6,
  3,
  9,
  2,
  5,
  -4,
  11,
  1,
  6,
];

const viewsTrendTemplate: number[] = [
  920,
  310,
  240,
  180,
  140,
  210,
  190,
  260,
  220,
  310,
  270,
  240,
  260,
  330,
  290,
  310,
  280,
  360,
  340,
  400,
  370,
  520,
  410,
  460,
];

function buildMonthlySeries<K extends string>(
  values: number[],
  currentMonthStart: Date,
  key: K,
): Array<{ date: number; monthLabel: string } & Record<K, number>> {
  return values.map((value, index) => {
    const monthsBack = values.length - 1 - index;
    const monthDate = subMonths(currentMonthStart, monthsBack);

    return {
      date: monthDate.getTime(),
      monthLabel: format(monthDate, "MMM yyyy"),
      [key]: value,
    } as { date: number; monthLabel: string } & Record<K, number>;
  });
}

export default function SocialMedia() {
  const { showLoading } = useLoading();
  const subscriberGradientId = useId();
  const viewsGradientId = useId();
  const subscribersGradientKey = `${subscriberGradientId.replace(/:/g, "")}-subscribers`;
  const viewsGradientKey = `${viewsGradientId.replace(/:/g, "")}-views`;
  // Instagram-specific gradients and series (placeholder data using same templates)
  const instagramSubscriberGradientId = useId();
  const instagramViewsGradientId = useId();
  const instagramSubscribersGradientKey = `${instagramSubscriberGradientId.replace(/:/g, "")}-subscribers`;
  const instagramViewsGradientKey = `${instagramViewsGradientId.replace(/:/g, "")}-views`;
  // Facebook-specific gradients and series (placeholder data using same templates)
  const facebookSubscriberGradientId = useId();
  const facebookViewsGradientId = useId();
  const facebookSubscribersGradientKey = `${facebookSubscriberGradientId.replace(/:/g, "")}-subscribers`;
  const facebookViewsGradientKey = `${facebookViewsGradientId.replace(/:/g, "")}-views`;
  // Pinterest-specific gradients and series (placeholder data)
  const pinterestImpressionsGradientId = useId();
  const pinterestEngagementsGradientId = useId();
  const pinterestSavesGradientId = useId();
  const pinterestImpressionsGradientKey = `${pinterestImpressionsGradientId.replace(/:/g, "")}-impressions`;
  const pinterestEngagementsGradientKey = `${pinterestEngagementsGradientId.replace(/:/g, "")}-engagements`;
  const pinterestSavesGradientKey = `${pinterestSavesGradientId.replace(/:/g, "")}-saves`;
  const currentMonthStart = startOfMonth(new Date());
  const [pinterestMetric, setPinterestMetric] = useState<"impressions" | "engagements" | "saves">("impressions");
  const youtubeSubscribersTrend = buildMonthlySeries(subscriberTrendTemplate, currentMonthStart, "subscribers");
  const youtubeViewsTrend = buildMonthlySeries(viewsTrendTemplate, currentMonthStart, "views");
  const instagramSubscribersTrend = buildMonthlySeries(subscriberTrendTemplate, currentMonthStart, "subscribers");
  const instagramViewsTrend = buildMonthlySeries(viewsTrendTemplate, currentMonthStart, "views");
  const facebookSubscribersTrend = buildMonthlySeries(subscriberTrendTemplate, currentMonthStart, "subscribers");
  const facebookViewsTrend = buildMonthlySeries(viewsTrendTemplate, currentMonthStart, "views");
  // Use the last 11 months (current month + previous 10 months)
  const last11Views = viewsTrendTemplate.slice(-11);
  const last11Engagements = viewsTrendTemplate.slice(-11).map((v) => Math.max(1, Math.round(v * 0.06)));
  const last11Saves = viewsTrendTemplate.slice(-11).map((v) => Math.max(1, Math.round(v * 0.02)));
  const pinterestImpressionsTrend = buildMonthlySeries(last11Views, currentMonthStart, "impressions");
  const pinterestEngagementsTrend = buildMonthlySeries(last11Engagements, currentMonthStart, "engagements");
  const pinterestSavesTrend = buildMonthlySeries(last11Saves, currentMonthStart, "saves");
  const subscribersTicks = youtubeSubscribersTrend.map((point) => point.date);
  const viewsTicks = youtubeViewsTrend.map((point) => point.date);
  const instagramSubscribersTicks = instagramSubscribersTrend.map((point) => point.date);
  const instagramViewsTicks = instagramViewsTrend.map((point) => point.date);
  const facebookSubscribersTicks = facebookSubscribersTrend.map((point) => point.date);
  const facebookViewsTicks = facebookViewsTrend.map((point) => point.date);
  const pinterestImpressionsTicks = pinterestImpressionsTrend.map((p) => p.date);
  const pinterestEngagementsTicks = pinterestEngagementsTrend.map((p) => p.date);
  const pinterestSavesTicks = pinterestSavesTrend.map((p) => p.date);
  const subscribersChartConfig: ChartConfig = {
    subscribers: {
      label: "Gained Subscribers",
      color: "hsl(0 72% 60%)",
    },
  };
  const viewsChartConfig: ChartConfig = {
    views: {
      label: "Gained Views",
      color: "hsl(0 78% 64%)",
    },
  };
  // Instagram chart configs (use different colors)
  const instagramSubscribersChartConfig: ChartConfig = {
    subscribers: {
      label: "Gained Followers",
      color: "hsl(320 80% 55%)",
    },
  };
  const instagramViewsChartConfig: ChartConfig = {
    views: {
      label: "Gained Likes",
      color: "hsl(280 80% 55%)",
    },
  };
  const facebookSubscribersChartConfig: ChartConfig = {
    subscribers: {
      label: "Gained Page Likes",
      color: "hsl(212 100% 45%)",
    },
  };
  const facebookViewsChartConfig: ChartConfig = {
    views: {
      label: "Gained Reach",
      color: "hsl(210 90% 50%)",
    },
  };
  const pinterestChartConfig: ChartConfig = {
    impressions: { label: "Impressions", color: "hsl(214 90% 45%)" },
    engagements: { label: "Engagements", color: "hsl(220 50% 40%)" },
    saves: { label: "Saves", color: "hsl(260 60% 50%)" },
  };
  const pinterestChartMargin = { top: 10, right: 20, left: 0, bottom: 0 };
  const formatPinterestYAxis = (value: number) => {
    if (Math.abs(value) >= 1000) {
      const formatted = (value / 1000).toFixed(Math.abs(value) % 1000 === 0 ? 0 : 1);
      return `${formatted.replace(/\.0$/, "")}k`;
    }

    return value.toString();
  };
  const pinterestXAxisTickFormatter = (value: number) => format(value, "MMM yyyy");
  const renderPinterestChart = () => {
    switch (pinterestMetric) {
      case "impressions":
        return (
          <AreaChart
            key="pinterest-impressions"
            data={pinterestImpressionsTrend}
            margin={pinterestChartMargin}
          >
            <defs>
              <linearGradient id={pinterestImpressionsGradientKey} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(214 90% 45%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(214 90% 45%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={pinterestImpressionsTicks}
              tickFormatter={pinterestXAxisTickFormatter}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} tickFormatter={formatPinterestYAxis} />
            <ChartTooltip
              cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }}
              content={<ChartTooltipContent labelKey="monthLabel" />}
            />
            <Area
              type="monotone"
              dataKey="impressions"
              stroke="hsl(214 90% 45%)"
              strokeOpacity={1}
              fill={`url(#${pinterestImpressionsGradientKey})`}
              fillOpacity={0.12}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        );
      case "engagements":
        return (
          <AreaChart
            key="pinterest-engagements"
            data={pinterestEngagementsTrend}
            margin={pinterestChartMargin}
          >
            <defs>
              <linearGradient id={pinterestEngagementsGradientKey} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220 50% 40%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(220 50% 40%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={pinterestEngagementsTicks}
              tickFormatter={pinterestXAxisTickFormatter}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} tickFormatter={formatPinterestYAxis} />
            <ChartTooltip
              cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }}
              content={<ChartTooltipContent labelKey="monthLabel" />}
            />
            <Area
              type="monotone"
              dataKey="engagements"
              stroke="hsl(220 50% 40%)"
              strokeOpacity={1}
              fill={`url(#${pinterestEngagementsGradientKey})`}
              fillOpacity={0.12}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        );
      case "saves":
        return (
          <AreaChart key="pinterest-saves" data={pinterestSavesTrend} margin={pinterestChartMargin}>
            <defs>
              <linearGradient id={pinterestSavesGradientKey} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(260 60% 50%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(260 60% 50%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={pinterestSavesTicks}
              tickFormatter={pinterestXAxisTickFormatter}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} tickFormatter={formatPinterestYAxis} />
            <ChartTooltip
              cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }}
              content={<ChartTooltipContent labelKey="monthLabel" />}
            />
            <Area
              type="monotone"
              dataKey="saves"
              stroke="hsl(260 60% 50%)"
              strokeOpacity={1}
              fill={`url(#${pinterestSavesGradientKey})`}
              fillOpacity={0.12}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        );
      default:
        return null;
    }
  };
  const handleSort = (_preset: PresetRangeKey) => showLoading();
  const handleDate = () => showLoading();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Social Media Analytics"
          description="Track your performance across YouTube, Facebook, Instagram, Pinterest, and X"
          icon={Instagram}
        />
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleDate} />
          <SortButton onChange={handleSort} />
        </div>
      </div>
      <Tabs defaultValue="youtube" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-md">
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="pinterest">Pinterest</TabsTrigger>
          <TabsTrigger value="x">X</TabsTrigger>
        </TabsList>
        <TabsContent value="youtube" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Subscribers" value="1.81K" subtitle="SB Rank: 1,058,360th" icon={Youtube} iconColor="bg-red-100 text-youtube" />
            <MetricCard title="Views" value="28,301" subtitle="Views Rank: 5,219,707th" icon={Youtube} iconColor="bg-red-100 text-youtube" />
            <MetricCard title="Videos" value="12" subtitle="Created On: April 6, 2016" icon={Youtube} iconColor="bg-red-100 text-youtube" />
            <MetricCard title="Subscribers Rank" value="3,940th" icon={Youtube} iconColor="bg-red-100 text-youtube" />
            <MetricCard title="Country Rank" value="TBD" icon={Youtube} iconColor="bg-red-100 text-youtube" />
            <MetricCard title="People Rank" value="3,500th" icon={Youtube} iconColor="bg-red-100 text-youtube" />
            <MetricCard title="Grade" value="C-" icon={Youtube} iconColor="bg-red-100 text-youtube" />
          </div>
          {/* Daily Channel Metrics Table */}
          <div className="mt-10 bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Daily Channel Metrics</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Date range</label>
                  <select className="border rounded px-2 py-1 text-sm bg-gray-50">
                    <option>Custom</option>
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Today</option>
                  </select>
                  <input type="date" className="border rounded px-2 py-1 text-sm bg-white" />
                  <input type="date" className="border rounded px-2 py-1 text-sm bg-white" />
                  <select className="border rounded px-2 py-1 text-sm bg-gray-50">
                    <option>All</option>
                  </select>
                  <button className="text-sm text-gray-500 underline">More filters</button>
                </div>
            </div>
            <table className="min-w-full text-sm text-center">
              <thead className="bg-red-700 text-white">
                <tr>
                  <th className="px-6 py-2 font-semibold">Date</th>
                  <th className="px-6 py-2 font-semibold">Subscribers</th>
                  <th className="px-6 py-2 font-semibold">Views</th>
                  <th className="px-6 py-2 font-semibold">Videos</th>
                  <th className="px-6 py-2 font-semibold">Estimated Earnings</th>
                </tr>
              </thead>
              <tbody>
                {/* Example rows, you can replace with dynamic data */}
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-01</td>
                  <td className="px-6 py-2">--</td>
                  <td className="px-6 py-2 text-green-600">+5</td>
                  <td className="px-6 py-2">28,183</td>
                  <td className="px-6 py-2">$0 - $0</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-02</td>
                  <td className="px-6 py-2">--</td>
                  <td className="px-6 py-2 text-green-600">+2</td>
                  <td className="px-6 py-2">28,185</td>
                  <td className="px-6 py-2">$0 - $0</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-03</td>
                  <td className="px-6 py-2">--</td>
                  <td className="px-6 py-2 text-green-600">+7</td>
                  <td className="px-6 py-2">28,194</td>
                  <td className="px-6 py-2">$0 - $0</td>
                </tr>
                {/* ...more rows as needed... */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-2">Daily Average</td>
                  <td className="px-6 py-2">+0</td>
                  <td className="px-6 py-2">+4</td>
                  <td className="px-6 py-2">--</td>
                  <td className="px-6 py-2">$0 - $0</td>
                </tr>
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-2">Weekly Average</td>
                  <td className="px-6 py-2">0</td>
                  <td className="px-6 py-2">+32</td>
                  <td className="px-6 py-2">--</td>
                  <td className="px-6 py-2">$0 - $0</td>
                </tr>
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-2">Last 30 Days</td>
                  <td className="px-6 py-2">+10</td>
                  <td className="px-6 py-2">+111</td>
                  <td className="px-6 py-2">--</td>
                  <td className="px-6 py-2">$0 - $0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-10 space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">Momentum Charts</h2>
              <p className="text-sm text-gray-500">
                Monthly gains for subscribers and views based on Social Blade trendlines.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6 transition-transform duration-500 hover:-translate-y-1">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">YouTube Subscriber Velocity</h3>
                  <span className="text-sm text-gray-500">Net subscribers gained each month</span>
                </div>
                <ChartContainer config={subscribersChartConfig} className="h-72 w-full">
                  <AreaChart data={youtubeSubscribersTrend}>
                    <defs>
                      <linearGradient id={subscribersGradientKey} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0 84% 58%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(0 84% 58%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      ticks={subscribersTicks}
                      tickFormatter={(value: number) => format(value, "MMM yyyy")}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={16}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                      tickFormatter={(value: number) => (value > 0 ? `+${value}` : value.toString())}
                    />
                    <ChartTooltip
                      cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }}
                      content={<ChartTooltipContent labelKey="monthLabel" />}
                    />
                    <Area
                      type="monotone"
                      dataKey="subscribers"
                      stroke="hsl(0 84% 58%)"
                      fill={`url(#${subscribersGradientKey})`}
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      isAnimationActive
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6 transition-transform duration-500 hover:-translate-y-1">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">YouTube View Momentum</h3>
                  <span className="text-sm text-gray-500">Monthly views added</span>
                </div>
                <ChartContainer config={viewsChartConfig} className="h-72 w-full">
                  <AreaChart data={youtubeViewsTrend}>
                    <defs>
                      <linearGradient id={viewsGradientKey} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0 70% 60%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(0 70% 60%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      ticks={viewsTicks}
                      tickFormatter={(value: number) => format(value, "MMM yyyy")}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={16}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                      tickFormatter={(value: number) => value.toLocaleString()}
                    />
                    <ChartTooltip
                      cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }}
                      content={<ChartTooltipContent labelKey="monthLabel" />}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(0 70% 60%)"
                      fill={`url(#${viewsGradientKey})`}
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      isAnimationActive
                      animationDuration={1300}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="facebook" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard title="Page Likes" value="89,922" icon={Facebook} iconColor="bg-blue-100 text-facebook" />
            <MetricCard title="Talking About" value="156" icon={Facebook} iconColor="bg-blue-100 text-facebook" />
            <MetricCard title="Page Rank" value="58,401" subtitle="Grade: B+" icon={Facebook} iconColor="bg-blue-100 text-facebook" />
          </div>
          {/* Daily Page Metrics Table for Facebook */}
          <div className="mt-10 bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Daily Page Metrics</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Date range</label>
                  <select className="border rounded px-2 py-1 text-sm bg-gray-50">
                    <option>Custom</option>
                    <option>Last 30 Days</option>
                    <option>Last 7 Days</option>
                    <option>Today</option>
                  </select>
                  <input type="date" className="border rounded px-2 py-1 text-sm bg-white" />
                  <input type="date" className="border rounded px-2 py-1 text-sm bg-white" />
                  <select className="border rounded px-2 py-1 text-sm bg-gray-50">
                    <option>All</option>
                  </select>
                  <button className="text-sm text-gray-500 underline">More filters</button>
                </div>
            </div>
            <table className="min-w-full text-sm text-center">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="px-6 py-2 font-semibold">Date</th>
                  <th className="px-6 py-2 font-semibold">Page Likes</th>
                  <th className="px-6 py-2 font-semibold">Reach</th>
                  <th className="px-6 py-2 font-semibold">Posts</th>
                  <th className="px-6 py-2 font-semibold">Talking About</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-01</td>
                  <td className="px-6 py-2 text-green-600">+34</td>
                  <td className="px-6 py-2 text-green-600">+2.1K</td>
                  <td className="px-6 py-2">2</td>
                  <td className="px-6 py-2">45</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-02</td>
                  <td className="px-6 py-2 text-green-600">+12</td>
                  <td className="px-6 py-2 text-green-600">+1.2K</td>
                  <td className="px-6 py-2">1</td>
                  <td className="px-6 py-2">12</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-03</td>
                  <td className="px-6 py-2 text-red-600">-5</td>
                  <td className="px-6 py-2 text-green-600">+800</td>
                  <td className="px-6 py-2">0</td>
                  <td className="px-6 py-2">8</td>
                </tr>
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-2">Daily Average</td>
                  <td className="px-6 py-2">+13</td>
                  <td className="px-6 py-2">+1.4K</td>
                  <td className="px-6 py-2">1</td>
                  <td className="px-6 py-2">21.6</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-10 space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">Momentum Charts</h2>
              <p className="text-sm text-gray-500">Monthly gains for page likes and reach based on trendlines.</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6 transition-transform duration-500 hover:-translate-y-1">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Facebook Page Like Velocity</h3>
                  <span className="text-sm text-gray-500">Net page likes gained each month</span>
                </div>
                <ChartContainer config={facebookSubscribersChartConfig} className="h-72 w-full">
                  <AreaChart data={facebookSubscribersTrend}>
                    <defs>
                      <linearGradient id={facebookSubscribersGradientKey} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(212 100% 45%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(212 100% 45%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      ticks={facebookSubscribersTicks}
                      tickFormatter={(value: number) => format(value, "MMM yyyy")}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={16}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                      tickFormatter={(value: number) => (value > 0 ? `+${value}` : value.toString())}
                    />
                    <ChartTooltip cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }} content={<ChartTooltipContent labelKey="monthLabel" />} />
                    <Area
                      type="monotone"
                      dataKey="subscribers"
                      stroke="hsl(212 100% 45%)"
                      fill={`url(#${facebookSubscribersGradientKey})`}
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      isAnimationActive
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6 transition-transform duration-500 hover:-translate-y-1">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Facebook Reach Momentum</h3>
                  <span className="text-sm text-gray-500">Monthly reach added</span>
                </div>
                <ChartContainer config={facebookViewsChartConfig} className="h-72 w-full">
                  <AreaChart data={facebookViewsTrend}>
                    <defs>
                      <linearGradient id={facebookViewsGradientKey} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(210 90% 50%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(210 90% 50%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      ticks={facebookViewsTicks}
                      tickFormatter={(value: number) => format(value, "MMM yyyy")}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={16}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                      tickFormatter={(value: number) => value.toLocaleString()}
                    />
                    <ChartTooltip cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }} content={<ChartTooltipContent labelKey="monthLabel" />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(210 90% 50%)"
                      fill={`url(#${facebookViewsGradientKey})`}
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      isAnimationActive
                      animationDuration={1300}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="instagram" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard title="Followers" value="23,616" icon={Instagram} iconColor="bg-gradient-to-br from-purple-100 to-pink-100 text-pink-600" />
            <MetricCard title="Engagement Rate" value="2.1%" icon={Instagram} iconColor="bg-gradient-to-br from-purple-100 to-pink-100 text-pink-600" />
            <MetricCard title="Avg Likes" value="495" subtitle="Per post" icon={Instagram} iconColor="bg-gradient-to-br from-purple-100 to-pink-100 text-pink-600" />
          </div>
          {/* Daily Channel Metrics Table for Instagram */}
          <div className="mt-10 bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Daily Channel Metrics</h2>
              <select className="border rounded px-2 py-1 text-sm bg-gray-50">
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Today</option>
                <option>Last 3 Months</option>
                <option>Last 6 Months</option>
                <option>Last 9 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <table className="min-w-full text-sm text-center">
              <thead className="bg-pink-600 text-white">
                <tr>
                  <th className="px-6 py-2 font-semibold">Date</th>
                  <th className="px-6 py-2 font-semibold">Followers</th>
                  <th className="px-6 py-2 font-semibold">Likes</th>
                  <th className="px-6 py-2 font-semibold">Posts</th>
                  <th className="px-6 py-2 font-semibold">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {/* Example rows, replace with dynamic data when available */}
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-01</td>
                  <td className="px-6 py-2 text-green-600">+12</td>
                  <td className="px-6 py-2 text-green-600">+48</td>
                  <td className="px-6 py-2">3</td>
                  <td className="px-6 py-2">0.21%</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-02</td>
                  <td className="px-6 py-2 text-red-600">-2</td>
                  <td className="px-6 py-2 text-green-600">+32</td>
                  <td className="px-6 py-2">1</td>
                  <td className="px-6 py-2">0.18%</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-2">2025-09-03</td>
                  <td className="px-6 py-2 text-green-600">+7</td>
                  <td className="px-6 py-2 text-green-600">+20</td>
                  <td className="px-6 py-2">2</td>
                  <td className="px-6 py-2">0.25%</td>
                </tr>
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-2">Daily Average</td>
                  <td className="px-6 py-2">+6</td>
                  <td className="px-6 py-2">+33</td>
                  <td className="px-6 py-2">2</td>
                  <td className="px-6 py-2">0.21%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-10 space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">Momentum Charts</h2>
              <p className="text-sm text-gray-500">Monthly gains for followers and likes based on Social Blade style trendlines.</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6 transition-transform duration-500 hover:-translate-y-1">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Instagram Follower Velocity</h3>
                  <span className="text-sm text-gray-500">Net followers gained each month</span>
                </div>
                <ChartContainer config={instagramSubscribersChartConfig} className="h-72 w-full">
                  <AreaChart data={instagramSubscribersTrend}>
                    <defs>
                      <linearGradient id={instagramSubscribersGradientKey} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(320 80% 55%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(320 80% 55%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      ticks={instagramSubscribersTicks}
                      tickFormatter={(value: number) => format(value, "MMM yyyy")}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={16}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                      tickFormatter={(value: number) => (value > 0 ? `+${value}` : value.toString())}
                    />
                    <ChartTooltip cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }} content={<ChartTooltipContent labelKey="monthLabel" />} />
                    <Area
                      type="monotone"
                      dataKey="subscribers"
                      stroke="hsl(320 80% 55%)"
                      fill={`url(#${instagramSubscribersGradientKey})`}
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      isAnimationActive
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6 transition-transform duration-500 hover:-translate-y-1">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Instagram Like Momentum</h3>
                  <span className="text-sm text-gray-500">Monthly likes added</span>
                </div>
                <ChartContainer config={instagramViewsChartConfig} className="h-72 w-full">
                  <AreaChart data={instagramViewsTrend}>
                    <defs>
                      <linearGradient id={instagramViewsGradientKey} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(280 80% 55%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(280 80% 55%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 91%)" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      ticks={instagramViewsTicks}
                      tickFormatter={(value: number) => format(value, "MMM yyyy")}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={16}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tick={{ fill: "hsl(215 16% 47%)" }}
                      tickFormatter={(value: number) => value.toLocaleString()}
                    />
                    <ChartTooltip cursor={{ stroke: "hsl(0 0% 81%)", strokeWidth: 1 }} content={<ChartTooltipContent labelKey="monthLabel" />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(280 80% 55%)"
                      fill={`url(#${instagramViewsGradientKey})`}
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      isAnimationActive
                      animationDuration={1300}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="pinterest" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Percent changes are compared to a previous period. Audience metrics updated recently.</p>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center text-center">
              <div>
                <div className="text-sm text-gray-500">Impressions</div>
                <div className="text-2xl font-semibold text-gray-900">4.49m <span className="text-red-600 text-sm font-medium">↓ 31%</span></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Engagements</div>
                <div className="text-2xl font-semibold text-gray-900">284.57k <span className="text-red-600 text-sm font-medium">↓ 30%</span></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Outbound clicks</div>
                <div className="text-2xl font-semibold text-gray-900">90.69k <span className="text-red-600 text-sm font-medium">↓ 30%</span></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Saves</div>
                <div className="text-2xl font-semibold text-gray-900">32.74k <span className="text-red-600 text-sm font-medium">↓ 38%</span></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total audience</div>
                <div className="text-2xl font-semibold text-gray-900">1.94m <span className="text-red-600 text-sm font-medium">↓ 27%</span></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Engaged audience</div>
                <div className="text-2xl font-semibold text-gray-900">127.34k <span className="text-red-600 text-sm font-medium">↓ 30%</span></div>
              </div>
            </div>
          </div>
          {/* Performance over time chart for Pinterest */}
          <div className="mt-8 bg-white rounded-xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Performance over time</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Metric</label>
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={pinterestMetric}
                  onChange={(e) => setPinterestMetric(e.target.value as "impressions" | "engagements" | "saves")}
                >
                  <option value="impressions">Impressions</option>
                  <option value="engagements">Engagements</option>
                  <option value="saves">Saves</option>
                </select>
              </div>
            </div>
            <ChartContainer config={pinterestChartConfig} className="h-72 w-full">
              {renderPinterestChart()}
            </ChartContainer>
          </div>
        </TabsContent>
        <TabsContent value="x" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard title="Followers" value="8,900" icon={Twitter} iconColor="bg-blue-100 text-twitter" />
            <MetricCard title="Tweets" value="2,340" icon={Twitter} iconColor="bg-blue-100 text-twitter" />
            <MetricCard title="Engagement Rate" value="1.8%" icon={Twitter} iconColor="bg-blue-100 text-twitter" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
