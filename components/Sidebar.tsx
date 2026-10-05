"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut,
  Zap,
  ChevronRight,
  LayoutDashboard,
  CheckSquare,
  Users,
  Settings,
  Home,
  ShoppingCart,
  FileText,
  Bell,
  MapPin,
  Menu,
  X,
  Package,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

interface SidebarProps {
  role: string;
  userName: string;
  initials: string;
  signOutAction: () => Promise<void>;
}

export default function Sidebar({
  role,
  userName,
  initials,
  signOutAction,
}: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Define nav items internally based on the role to prevent passing React components
  const navItems = role === "Manager"
    ? [
        { href: "/manager/dashboard", label: "Dashboard",   icon: LayoutDashboard },
        { href: "/manager/approvals", label: "Approvals",   icon: CheckSquare, showBadge: true },
        { href: "/manager/forecasting", label: "Forecasting", icon: TrendingUp },
        { href: "/manager/visit-matrix", label: "Visit Matrix", icon: MapPin },
        { href: "/manager/team",      label: "Team",        icon: Users },
        { href: "/manager/leads",     label: "Leads",       icon: Zap },
        { href: "/manager/settings",  label: "Settings",    icon: Settings },
      ]
    : [
        { href: "/rep/home",        label: "Home",        icon: Home },
        { href: "/rep/customers",   label: "Customers",   icon: Users },
        { href: "/rep/products",    label: "Products",    icon: Package },
        { href: "/rep/forecasting", label: "Forecasting", icon: TrendingUp },
        { href: "/rep/order/new",   label: "New Order",   icon: ShoppingCart },
        { href: "/rep/documents",   label: "Documents",   icon: FileText },
        { href: "/rep/alerts",      label: "Alerts",      icon: Bell },
        { href: "/rep/visit",       label: "Visits",      icon: MapPin },
      ];

  // Fetch pending approvals for Managers and subscribe to real-time changes
  useEffect(() => {
    if (role !== "Manager") return;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from("discount_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (!error && count !== null) {
        setPendingApprovalsCount(count);
      }
    };

    fetchCount();

    // Subscribe to realtime database updates
    const channel = supabase
      .channel("discount-requests-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "discount_requests" },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  // Close the drawer automatically when the pathname changes (e.g. user navigates)
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 1. Mobile top header bar */}
      <header className="mobile-header-root">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Open navigation drawer"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <BrandLogo size="sm" variant="light" />
        </div>

        <div className="relative">
          <Bell size={18} className="text-gray-400" />
          {role === "Manager" && pendingApprovalsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {pendingApprovalsCount}
            </span>
          )}
        </div>
      </header>

      {/* 2. Dark backdrop overlay on mobile */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className={`sidebar-backdrop${isDrawerOpen ? " backdrop-open" : ""}`}
      />

      {/* 3. The sliding drawer/sidebar */}
      <aside className={`sidebar-root${isDrawerOpen ? " sidebar-open" : ""}`}>
        {/* Drawer header inside sidebar */}
        <div className="sidebar-logo justify-between">
          <BrandLogo size="md" variant="glass" roleSubtitle={role} />

          {/* Close button visible only on mobile inside side drawer */}
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Navigation</p>
          {navItems.map(({ href, label, icon: Icon, showBadge }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link${active ? " sidebar-link-active" : ""}`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                <span className="flex-1">{label}</span>
                {showBadge && pendingApprovalsCount > 0 && (
                  <span className="sidebar-badge">{pendingApprovalsCount}</span>
                )}
                {active && !showBadge && <ChevronRight size={13} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User profile card & Log out */}
        <div className="sidebar-user-card">
          <div className="w-9 h-9 avatar text-sm flex-shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">{userName}</p>
            <p className="text-[10px] text-blue-300 leading-tight capitalize">{role}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              className="sidebar-logout-btn"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
