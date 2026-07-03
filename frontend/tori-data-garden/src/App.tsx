import AuthCallback from "./pages/AuthCallback";
import { LoadingProvider, useLoading } from "@/components/ui/LoadingContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CMSNavigation } from "@/components/CMSNavigation";
import { AuthProvider } from "@/context/AuthContext";
import RequireAuth from "@/components/auth/RequireAuth";
import Overview from "./pages/Overview";
import Login from "./pages/Login";
import SocialMedia from "./pages/SocialMedia";
import GoogleAnalytics from "./pages/GoogleAnalytics";
import Mediavine from "./pages/Mediavine";
import Slickstream from "./pages/Slickstream";
import Pinterest from "./pages/Pinterest";
import SearchConsole from "./pages/SearchConsole";
import ConvertKit from "./pages/ConvertKit";
import Clariti from "./pages/Clariti";
import Sparkloop from "./pages/Sparkloop";
import NotFound from "./pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import WPRMRecipes from "@/pages/WPRMRecipes";
import WPRMReview from "@/pages/WPRMReview";
import WPRMReviewDetail from "@/pages/WPRMReviewDetail";
import WPRMStats from "@/pages/WPRMStats";
import WPRMPending from "@/pages/WPRMPending";
import VideoClips from "@/pages/VideoClips";
import Scheduler from "@/pages/Scheduler";
import AdminUsersPage from "@/pages/AdminUsersPage";

const queryClient = new QueryClient();

const App = () => (
  <LoadingProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GlobalLoadingOverlay />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Routes */}


              <Route element={<RequireAuth />}>
                <Route
                  path="/cms/*"
                  element={
                    <div className="min-h-screen flex w-full bg-[#FAFAF9]">
                      <div className="flex-1 flex flex-col w-full max-w-[100vw] overflow-x-hidden">
                        <CMSNavigation />
                        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-28">
                          <Outlet />
                        </main>
                      </div>
                    </div>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="recipes" element={<WPRMRecipes />} />
                  <Route path="review" element={<WPRMReview />} />
                  <Route path="review-detail/:recipeId" element={<WPRMReviewDetail />} />
                  <Route path="pending" element={<WPRMPending />} />
                  <Route path="stats" element={<WPRMStats />} />
                  <Route path="clips" element={<VideoClips />} />
                  <Route path="scheduler" element={<Scheduler />} />
                  <Route path="admin/users" element={<AdminUsersPage />} />
                </Route>

              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </LoadingProvider>
);

function GlobalLoadingOverlay() {
  const { loading } = useLoading();
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-10 w-10 text-[#7C9A6D] mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-[#7C9A6D] font-semibold">Loading analytics...</span>
      </div>
    </div>
  );
}

export default App;
