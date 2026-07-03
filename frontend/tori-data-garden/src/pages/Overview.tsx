import { Users, Eye, DollarSign, MousePointerClick, TrendingUp, Mail } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { LayoutDashboard } from "lucide-react";

import { DateRangePicker, SortButton, PresetRangeKey } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";

export default function Overview() {
  const { showLoading } = useLoading();
  const handleSort = (_preset: PresetRangeKey) => showLoading();
  const handleDate = () => showLoading();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Analytics Overview"
          description="Your daily snapshot of key metrics across all platforms"
          icon={LayoutDashboard}
        />
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleDate} />
          <SortButton onChange={handleSort} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Active Users (GA)"
          value="203K"
          change={-4.1}
          icon={Users}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Pinterest Monthly Views"
          value="4.47M"
          change={30}
          icon={TrendingUp}
          iconColor="bg-red-100 text-pinterest"
        />
        <MetricCard
          title="Mediavine Revenue"
          value="$1,133"
          subtitle="Yesterday"
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Search Impressions"
          value="159M"
          icon={Eye}
          iconColor="bg-purple-100 text-purple-600"
        />
        <MetricCard
          title="Email Subscribers"
          value="143.1K"
          icon={Mail}
          iconColor="bg-orange-100 text-secondary"
        />
        <MetricCard
          title="Slickstream Sessions"
          value="638K"
          icon={MousePointerClick}
          iconColor="bg-cyan-100 text-cyan-600"
        />
        <MetricCard
          title="Sparkloop Subscribers"
          value="45.2K"
          change={12.5}
          icon={Mail}
          iconColor="bg-indigo-100 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h3 className="text-xl font-playfair font-bold mb-4">Top Performing Content</h3>
          <div className="space-y-4">
            {[
              { title: "Exploring Mediterranean Cuisine...", views: "30K", change: -1.4 },
              { title: "Rosh Hashanah Honey Apple Cake", views: "27K", change: -2.8 },
              { title: "Sweet Lokshen Kugel", views: "20K", change: -2.2 },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.views} views</p>
                </div>
                <span className={`text-sm font-medium ${item.change < 0 ? "text-red-600" : "text-green-600"}`}>
                  {item.change}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h3 className="text-xl font-playfair font-bold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Page RPM</span>
              <span className="font-bold text-lg">$42.80</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Email Open Rate</span>
              <span className="font-bold text-lg">35.93%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Avg Engagement Time</span>
              <span className="font-bold text-lg">1m 08s</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Search CTR</span>
              <span className="font-bold text-lg">2.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
