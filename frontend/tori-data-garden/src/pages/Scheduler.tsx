import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WPRMSchedulerTab } from "@/components/WPRMSchedulerTab";
import { YouTubeSchedulerTab } from "@/components/YouTubeSchedulerTab";
import { Calendar, Info, X, ChefHat, Clapperboard } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHero } from "@/components/studio";

export default function Scheduler() {
  const [showGuide, setShowGuide] = useState(true);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <PageHero
        eyebrow="Automation"
        title="Content Scheduler"
        subtitle="Automate your publishing pipeline. Configure how and when content is generated for a consistent stream of recipes and videos."
        icon={Calendar}
      />

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-[hsl(var(--olive)/0.06)] p-6"
          >
            <button
              onClick={() => setShowGuide(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss guide"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-4">
              <div className="h-fit rounded-xl bg-card p-3 text-primary shadow-[var(--shadow-sm)]">
                <Info className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  How to use the Scheduler
                </h3>
                <div className="max-w-3xl leading-relaxed text-muted-foreground">
                  This tool runs in the background to automatically generate
                  content.
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    <li>
                      <strong className="text-foreground">
                        Recipe Content (WPRM):
                      </strong>{" "}
                      Scans your WordPress site for new recipes and generates
                      social posts and blog content.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        YouTube Clips:
                      </strong>{" "}
                      Monitors your YouTube channel for new long-form videos and
                      creates shorts automatically.
                    </li>
                  </ul>
                  <span className="mt-2 block text-xs font-semibold uppercase tracking-wide opacity-80">
                    Tip: set a longer interval (e.g. 60 min) to avoid
                    overloading the AI services.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="wprm" className="space-y-8">
        <div className="flex justify-center">
          <TabsList className="grid h-14 w-full max-w-md grid-cols-2 rounded-2xl border border-border bg-card p-1 shadow-[var(--shadow-sm)]">
            <TabsTrigger
              value="wprm"
              className="gap-2 rounded-xl text-base font-semibold text-muted-foreground transition-all data-[state=active]:bg-[hsl(var(--olive)/0.1)] data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <ChefHat className="h-4 w-4" /> Recipe Content
            </TabsTrigger>
            <TabsTrigger
              value="youtube"
              className="gap-2 rounded-xl text-base font-semibold text-muted-foreground transition-all data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-none"
            >
              <Clapperboard className="h-4 w-4" /> YouTube Clips
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="wprm"
          className="animate-in slide-in-from-bottom-5 duration-500"
        >
          <WPRMSchedulerTab />
        </TabsContent>
        <TabsContent
          value="youtube"
          className="animate-in slide-in-from-bottom-5 duration-500"
        >
          <YouTubeSchedulerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
