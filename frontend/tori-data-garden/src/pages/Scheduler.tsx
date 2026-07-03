import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WPRMSchedulerTab } from "@/components/WPRMSchedulerTab";
import { YouTubeSchedulerTab } from "@/components/YouTubeSchedulerTab";
import { Calendar, Info, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Scheduler() {
  const [showGuide, setShowGuide] = useState(true);

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-8 animate-in fade-in duration-700">

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-600 p-10 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Content Scheduler</h1>
          <p className="text-blue-50/90 text-lg max-w-2xl">
            Automate your publishing pipeline. Configure how and when your content is generated,
            ensuring a consistent stream of recipes and videos across all your channels.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 bg-blue-400/30 rounded-full blur-3xl" />
      </div>

      {/* Guide Section */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-blue-50 border border-blue-100 p-6 relative overflow-hidden"
          >
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-blue-100/50 text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm h-fit text-blue-600">
                <Info className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-blue-900 text-lg">How to use the Scheduler</h3>
                <p className="text-blue-700 max-w-3xl leading-relaxed">
                  This tool runs in the background to automatically generate content.
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li><strong>Recipe Content (WPRM):</strong> Scans your WordPress site for new recipes and generates social posts and blog content.</li>
                    <li><strong>YouTube Clips:</strong> Monitors your YouTube channel for new long-form videos and creates shorts automatically.</li>
                  </ul>
                  <span className="text-xs font-semibold mt-2 block opacity-80 uppercase tracking-wide">
                    Tip: Set a longer interval (e.g., 60 mins) to avoid overloading the AI services.
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="wprm" className="space-y-8">
        <div className="flex justify-center">
          <TabsList className="bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-gray-200/50 shadow-sm w-full max-w-md grid grid-cols-2 h-14">
            <TabsTrigger
              value="wprm"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md font-semibold text-gray-500 transition-all text-base"
            >
              🍳 Recipe Content
            </TabsTrigger>
            <TabsTrigger
              value="youtube"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-md font-semibold text-gray-500 transition-all text-base"
            >
              🎬 YouTube Clips
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="wprm" className="animate-in slide-in-from-bottom-5 duration-500">
          <WPRMSchedulerTab />
        </TabsContent>

        <TabsContent value="youtube" className="animate-in slide-in-from-bottom-5 duration-500">
          <YouTubeSchedulerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
