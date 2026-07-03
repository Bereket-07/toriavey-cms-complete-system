import { BarChart3, DollarSign, MousePointerClick, Instagram, Search, Mail, Lightbulb, LayoutDashboard, Sparkles, Clock, BarChart, CalendarCheck2, Settings as SettingsIcon, Calendar, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Overview", url: "/dashboard/overview", icon: LayoutDashboard },
  { title: "Social Media", url: "/dashboard/social", icon: Instagram },
  { title: "Google Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Mediavine", url: "/dashboard/mediavine", icon: DollarSign },
  { title: "Slickstream", url: "/dashboard/slickstream", icon: MousePointerClick },
  { title: "Search Console", url: "/dashboard/search-console", icon: Search },
  { title: "ConvertKit", url: "/dashboard/convertkit", icon: Mail },
  { title: "Clariti SEO", url: "/dashboard/clariti", icon: Lightbulb },
  { title: "Sparkloop", url: "/dashboard/sparkloop", icon: Sparkles },
];

export function AppSidebar() {
  const { logout, auth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <h2
          className="font-playfair text-xl font-bold text-primary transition-all duration-200 overflow-hidden whitespace-nowrap"
          style={{
            maxWidth: '100%',
          }}
        >
          <span className="block md:inline group-data-[collapsible=icon]:hidden">Tori Avey</span>
          <span className="hidden group-data-[collapsible=icon]:block" title="Tori's Kitchen">
            <svg width="16" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="8" fill="#7C9A6D"/><text x="16" y="21" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">TK</text></svg>
          </span>
        </h2>
        <p className="text-xs text-muted-foreground transition-all duration-200 group-data-[collapsible=icon]:hidden">Analytics Dashboard</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="transition-all duration-200 overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            {auth.user?.picture && (
              <img
                src={auth.user.picture}
                alt={auth.user.name || "User"}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="truncate">{auth.user?.name || auth.user?.email || "User"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:ml-0"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
