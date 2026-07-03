import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";

import { DateRangePicker, SortButton } from "@/components/ui/DateSortControls";
import { useLoading } from "@/components/ui/LoadingContext";

export default function Clariti() {
  const { showLoading } = useLoading();
  const opportunities = [
    {
      title: "High Potential, Low Traffic",
      page: "Turkish Coffee Recipe",
      issue: "Ranking #8 for high-volume keyword",
      action: "Optimize content + build backlinks",
      priority: "high",
    },
    {
      title: "Content Gap",
      page: "Missing: Sephardic Recipes Hub",
      issue: "Competitors ranking for this cluster",
      action: "Create comprehensive guide",
      priority: "high",
    },
    {
      title: "Metadata Optimization",
      page: "45 recipe pages",
      issue: "Missing or duplicate meta descriptions",
      action: "Write unique descriptions",
      priority: "medium",
    },
    {
      title: "Rising Traffic Opportunity",
      page: "Latkes Recipe",
      issue: "Seasonal trend starting",
      action: "Update and promote now",
      priority: "high",
    },
  ];

  const handleSort = () => showLoading();
  const handleDate = () => showLoading();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Clariti SEO Intelligence"
          description="Discover content opportunities and optimization insights"
          icon={Lightbulb}
        />
        <div className="flex items-center gap-4">
          <DateRangePicker onChange={handleDate} />
          <SortButton onChange={handleSort} />
        </div>
  {/* header section ends here */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Rising Traffic Pages"
          value="12"
          icon={TrendingUp}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Falling Traffic Pages"
          value="8"
          icon={AlertTriangle}
          iconColor="bg-red-100 text-red-600"
        />
        <MetricCard
          title="Top Opportunities"
          value="15"
          icon={Lightbulb}
          iconColor="bg-yellow-100 text-yellow-600"
        />
        <MetricCard
          title="Content Gaps"
          value="23"
          icon={AlertTriangle}
          iconColor="bg-orange-100 text-secondary"
        />
      </div>

      <div className="p-6 bg-card rounded-xl shadow-recipe-card">
        <h3 className="text-xl font-playfair font-bold mb-6">SEO Opportunities</h3>
        <div className="space-y-4">
          {opportunities.map((opp, index) => (
            <div
              key={index}
              className="p-5 bg-muted/30 rounded-lg hover:bg-muted/50 transition-smooth border-l-4"
              style={{
                borderLeftColor:
                  opp.priority === "high"
                    ? "hsl(var(--terracotta))"
                    : "hsl(var(--olive))",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        opp.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {opp.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{opp.title}</h4>
                  <p className="text-muted-foreground mb-2">{opp.page}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Issue</p>
                  <p className="text-sm">{opp.issue}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Recommended Action
                  </p>
                  <p className="text-sm font-medium text-primary">{opp.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-playfair font-bold">Quick Wins</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <p className="text-sm">
                <strong>7 pages</strong> ranking positions 4-7 (one push to page 1)
              </p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <p className="text-sm">
                <strong>12 images</strong> missing alt text (accessibility + SEO)
              </p>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <p className="text-sm">
                <strong>23 internal links</strong> opportunities to improve site structure
              </p>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-recipe-card">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-playfair font-bold">Competitive Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Keyword Gap vs Competitors</p>
              <p className="text-2xl font-bold">342</p>
              <p className="text-xs text-muted-foreground">Keywords they rank for, you don't</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Content Refresh Needed</p>
              <p className="text-2xl font-bold">28</p>
              <p className="text-xs text-muted-foreground">Pages over 18 months old</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
