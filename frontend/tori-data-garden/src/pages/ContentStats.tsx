import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2, XCircle, Clock, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";

const CMS_BACKEND_URL = import.meta.env.VITE_CMS_BACKEND_URL || "http://localhost:7000";

interface ContentStats {
  total_generated: number;
  pending: number;
  approved: number;
  rejected: number;
  posted: number;
  by_platform: Record<string, number>;
  by_status: Record<string, number>;
}

export default function ContentStats() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContentStats>({
    total_generated: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    posted: 0,
    by_platform: {},
    by_status: {},
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiGet<any>("/api/content/stats");

      // Mock data for demonstration (preserving original logic)
      setStats({
        total_generated: 156,
        pending: 12,
        approved: 98,
        rejected: 28,
        posted: 85,
        by_platform: {
          instagram: 62,
          twitter: 48,
          facebook: 30,
          threads: 16,
        },
        by_status: {
          pending: 12,
          approved: 98,
          rejected: 28,
          posted: 85,
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch content statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Generated",
      value: stats.total_generated,
      icon: BarChart3,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Posted",
      value: stats.posted,
      icon: Send,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Statistics</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your AI-generated content performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Content by Platform</CardTitle>
          <CardDescription>Distribution of generated content across platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.by_platform).map(([platform, count]) => {
              const percentage = (count / stats.total_generated) * 100;
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{platform}</span>
                    <span className="text-sm text-muted-foreground">{count} posts</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Content by Status</CardTitle>
          <CardDescription>Track content through the approval workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.by_status).map(([status, count]) => {
              const percentage = (count / stats.total_generated) * 100;
              const colors = {
                pending: "bg-yellow-500",
                approved: "bg-green-500",
                rejected: "bg-red-500",
                posted: "bg-purple-500",
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{status}</span>
                    <span className="text-sm text-muted-foreground">{count} items</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`${colors[status as keyof typeof colors]} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Approval Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500">
                {((stats.approved / (stats.approved + stats.rejected)) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.approved} approved / {stats.rejected} rejected
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posting Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-500">
                {((stats.posted / stats.approved) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.posted} posted / {stats.approved} approved
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500">
                {((stats.posted / stats.total_generated) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.posted} posted / {stats.total_generated} generated
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
