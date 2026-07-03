import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar, Clock, Instagram, Facebook, Youtube, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const scheduledPosts = [
  {
    time: "09:00 AM",
    title: "Morning Recipe Reel",
    platform: "Instagram",
    icon: Instagram,
    status: "Scheduled",
  },
  {
    time: "12:30 PM",
    title: "Lunch Ideas Tutorial",
    platform: "YouTube",
    icon: Youtube,
    status: "Scheduled",
  },
  {
    time: "03:00 PM",
    title: "Cooking Tips Post",
    platform: "Facebook",
    icon: Facebook,
    status: "Scheduled",
  },
  {
    time: "06:00 PM",
    title: "Dinner Recipe Short",
    platform: "Instagram",
    icon: Instagram,
    status: "Scheduled",
  },
];

const weekOverview = [
  { day: "Mon", date: "13", posts: 4, isToday: false },
  { day: "Tue", date: "14", posts: 5, isToday: true },
  { day: "Wed", date: "15", posts: 3, isToday: false },
  { day: "Thu", date: "16", posts: 6, isToday: false },
  { day: "Fri", date: "17", posts: 4, isToday: false },
  { day: "Sat", date: "18", posts: 2, isToday: false },
  { day: "Sun", date: "19", posts: 3, isToday: false },
];

export default function Schedule() {
  const navigate = useNavigate();
  return (
    <Dialog>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Content Schedule</h1>
              <p className="text-muted-foreground text-lg">Plan and manage your posts</p>
            </div>
          </div>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white shadow-soft hover:shadow-glow">
              <Plus className="w-5 h-5 mr-2" />
              Schedule New Post
            </Button>
          </DialogTrigger>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">This Week</p>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-3xl font-bold">27</h3>
          <p className="text-sm text-green-500">+8 from last week</p>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Today</p>
            <Clock className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-3xl font-bold">5</h3>
          <p className="text-sm text-muted-foreground">posts scheduled</p>
        </Card>
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Best Time</p>
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-3xl font-bold">6 PM</h3>
          <p className="text-sm text-muted-foreground">highest engagement</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card p-6 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <h3 className="text-xl font-bold">Today's Schedule</h3>
              <p className="text-sm text-muted-foreground">Tuesday, Oct 14, 2025</p>
            </div>
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <div
                  key={`${post.title}-${post.time}`}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 glass-card rounded-xl transition-smooth hover:shadow-soft group"
                >
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <post.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold group-hover:text-primary transition-smooth">
                        {post.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {post.platform}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{post.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:ml-auto">
                    <Badge className="gradient-accent text-white uppercase tracking-wide px-3 py-1 text-xs">
                      {post.status}
                    </Badge>
                    <Button size="sm" variant="outline" className="whitespace-nowrap">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-6 shadow-soft">
            <h3 className="text-xl font-bold mb-4">Platform Distribution</h3>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    <span className="text-sm font-medium">Instagram</span>
                  </div>
                  <span className="text-sm font-semibold">45%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="w-[45%] h-full gradient-primary" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Facebook</span>
                  </div>
                  <span className="text-sm font-semibold">30%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="w-[30%] h-full gradient-secondary" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium">YouTube</span>
                  </div>
                  <span className="text-sm font-semibold">25%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="w-[25%] h-full gradient-accent" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card p-6 shadow-soft">
            <h3 className="text-xl font-bold mb-4">Week Overview</h3>
            <div className="space-y-3">
              {weekOverview.map((day) => (
                <div
                  key={`${day.day}-${day.date}`}
                  className={`p-4 rounded-xl transition-smooth cursor-pointer ${
                    day.isToday
                      ? "gradient-primary text-white shadow-soft"
                      : "glass-card hover:shadow-soft"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${day.isToday ? "text-white" : "text-muted-foreground"}`}>
                        {day.day}
                      </p>
                      <p className="text-2xl font-bold">{day.date}</p>
                    </div>
                    <div className={`text-right ${day.isToday ? "text-white" : "text-foreground"}`}>
                      <p className="text-2xl font-bold">{day.posts}</p>
                      <p className={`text-xs ${day.isToday ? "text-white/80" : "text-muted-foreground"}`}>
                        posts
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-6 shadow-soft">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <DialogTrigger asChild>
                <Button className="w-full justify-start gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Post
                </Button>
              </DialogTrigger>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/content/calendar')}>
                <Calendar className="w-4 h-4 mr-2" />
                View Full Calendar
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Best Times
              </Button>
            </div>
          </Card>
        </div>
      </div>
      </div>

      <DialogContent className="max-w-2xl overflow-hidden rounded-[32px] border border-white/60 bg-white/95 p-0 shadow-soft">
        <div className="gradient-primary px-6 py-6 text-white">
          <DialogTitle className="text-2xl font-semibold text-white">Schedule New Post</DialogTitle>
          <DialogDescription className="text-white/80">
            Choose the platform, timing, and caption to keep your content calendar on track.
          </DialogDescription>
        </div>

        <form className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="post-title">Post Title</Label>
              <Input id="post-title" placeholder="Morning Recipe Reel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publish-date">Publish Date</Label>
              <Input id="publish-date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publish-time">Publish Time</Label>
              <Input id="publish-time" type="time" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Tease the recipe, highlight the key hook, or paste an AI-generated caption here..."
              className="min-h-[120px] rounded-3xl border border-white/60 bg-white/80 p-4 text-sm shadow-sm backdrop-blur-sm"
            />
          </div>

          <div className="rounded-3xl bg-muted/70 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <p className="font-medium text-foreground">Pro tip</p>
            <p className="mt-1">
              Keep captions short, add one primary CTA, and make sure to tag collaborators before scheduling.
            </p>
          </div>

          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button className="gradient-primary text-white shadow-soft hover:shadow-glow">Save Schedule</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
