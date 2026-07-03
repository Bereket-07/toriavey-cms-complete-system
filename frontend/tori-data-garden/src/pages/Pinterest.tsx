import { TrendingUp, Eye, MousePointerClick, Heart } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";

import { DateRangePicker, SortButton, PresetRangeKey } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";

export default function Pinterest() {
  const { showLoading } = useLoading();
  const handleSort = (_preset: PresetRangeKey) => showLoading();
  const handleDate = () => showLoading();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Pinterest Analytics"
          description="Track your visual content performance and engagement"
          icon={TrendingUp}
        />
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleDate} />
          <SortButton onChange={handleSort} />
        </div>
      </div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Impressions"
          value="4.47M"
          change={30}
          icon={Eye}
          iconColor="bg-red-100 text-pinterest"
        />
        <MetricCard
          title="Engagements"
          value="283.78K"
          change={30}
          icon={MousePointerClick}
          iconColor="bg-red-100 text-pinterest"
        />
        <MetricCard
          title="Outbound Clicks"
          value="90.46K"
          change={30}
          icon={TrendingUp}
          iconColor="bg-red-100 text-pinterest"
        />
        <MetricCard
          title="Saves"
          value="32.66K"
          change={37}
          icon={Heart}
          iconColor="bg-red-100 text-pinterest"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h3 className="text-xl font-playfair font-bold mb-6">Audience Growth</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Total Audience</span>
              <div className="text-right">
                <p className="font-bold text-lg">1.94M</p>
                <p className="text-sm text-green-600 font-medium">+27%</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Engaged Audience</span>
              <div className="text-right">
                <p className="font-bold text-lg">127.01K</p>
                <p className="text-sm text-green-600 font-medium">+29%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <h3 className="text-xl font-playfair font-bold mb-6">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Save Rate</span>
              <span className="font-bold text-lg">11.5%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Click Rate</span>
              <span className="font-bold text-lg">20.2%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Engagement Rate</span>
              <span className="font-bold text-lg">6.3%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-pinterest" />
          <h3 className="text-xl font-playfair font-bold text-red-900">Pinterest Insights</h3>
        </div>
        <p className="text-red-800 mb-4">
          Outstanding growth this month! Your Pinterest presence is expanding rapidly with a 30% increase in
          impressions and engagements. The 37% growth in saves indicates highly valuable content that users
          want to reference later.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-3 bg-white rounded-lg">
            <p className="text-sm text-muted-foreground">Monthly Views</p>
            <p className="text-2xl font-bold text-pinterest">4.47M</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-sm text-muted-foreground">Growth Rate</p>
            <p className="text-2xl font-bold text-green-600">+30%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
