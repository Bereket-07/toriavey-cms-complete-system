import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Instagram, Twitter, Facebook, Linkedin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiGet, apiPost } from "@/lib/api";

const CMS_BACKEND_URL = import.meta.env.VITE_CMS_BACKEND_URL || "http://localhost:7000";

interface PendingContent {
  id: number;
  platform: string;
  caption: string;
  hashtags: string[];
  status: string;
  created_at: string;
  recipe_title?: string;
}

export default function ContentPending() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pendingContents, setPendingContents] = useState<PendingContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const platforms = {
    instagram: { icon: Instagram, color: "text-pink-500" },
    twitter: { icon: Twitter, color: "text-blue-400" },
    threads: { icon: Instagram, color: "text-black" },
    facebook: { icon: Facebook, color: "text-blue-600" },
    linkedin: { icon: Linkedin, color: "text-blue-700" },
  };

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    setLoading(true);
    try {
      const data = await apiGet<any>("/api/content/pending");

      // Mock data for demonstration if empty or error (the original code implied successful fetch but then set mock data? No, it waited for json().)
      // Actually original code ignored json result and set mock data!
      // "const data = await response.json(); // Mock data for demonstration \n setPendingContents([...])"
      // Wait, the original code sets HARDCODED mock data inside the success block!
      // I should preserve that behavior or use real data? 
      // "setPendingContents([...mock data...])"

      // If I want to use real data I should use `data`. But the original code was explicitly using mock data.
      // I will assume the user wanted to use the API eventually.
      // But looking at the original code:
      // const data = await response.json();
      // setPendingContents([... hardcoded ...]);
      // So `data` was unused!

      // I will keep the mock data for now to avoid breaking the "demo" aspect if the backend is not ready,
      // but I will call apiGet so auth is handled.
      // Actually, if the backend returns 403, apiGet throws.
      // So this is good for testing auth.

      setPendingContents([
        {
          id: 1,
          platform: "instagram",
          caption: "🍪 Cookie craving? Satisfy it with these Classic Chocolate Chip Cookies!",
          hashtags: ["cookies", "baking", "dessert", "homemade"],
          status: "pending",
          created_at: new Date().toISOString(),
          recipe_title: "Classic Chocolate Chip Cookies",
        },
        {
          id: 2,
          platform: "twitter",
          caption: "Craving a classic? 🍪 Whip up these foolproof Chocolate Chip Cookies!",
          hashtags: ["chocolatechipcookies", "baking"],
          status: "pending",
          created_at: new Date().toISOString(),
          recipe_title: "Classic Chocolate Chip Cookies",
        },
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (content: PendingContent, action: "approve" | "reject") => {
    setSelectedContent(content);
    setActionType(action);
    setShowDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedContent || !actionType) return;

    try {
      const endpoint = actionType === "approve" ? "approve" : "reject";
      await apiPost(`/api/content/${endpoint}`, {
        content_id: selectedContent.id,
        ...(actionType === "reject" && { rejection_reason: "Not suitable" }),
      });

      toast({
        title: "Success",
        description: `Content ${actionType}d successfully`,
      });

      // Remove from pending list
      setPendingContents((prev) => prev.filter((c) => c.id !== selectedContent.id));
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionType} content`,
        variant: "destructive",
      });
    } finally {
      setShowDialog(false);
      setSelectedContent(null);
      setActionType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Content</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve AI-generated content before posting
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="mr-2 h-4 w-4" />
          {pendingContents.length} Pending
        </Badge>
      </div>

      {pendingContents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending content to review</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingContents.map((content) => {
            const platformInfo = platforms[content.platform as keyof typeof platforms];

            return (
              <Card key={content.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {platformInfo && (
                        <div className={`p-2 rounded-lg bg-muted`}>
                          <platformInfo.icon className={`h-5 w-5 ${platformInfo.color}`} />
                        </div>
                      )}
                      <div>
                        <CardTitle className="capitalize">{content.platform}</CardTitle>
                        {content.recipe_title && (
                          <CardDescription>{content.recipe_title}</CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {new Date(content.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm mb-3">{content.caption}</p>
                    <div className="flex flex-wrap gap-2">
                      {content.hashtags.map((tag, i) => (
                        <Badge key={i} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t">
                    <Button
                      onClick={() => handleAction(content, "approve")}
                      className="flex-1"
                      variant="default"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleAction(content, "reject")}
                      className="flex-1"
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Content" : "Reject Content"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this content? It will be ready for posting."
                : "Are you sure you want to reject this content? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
