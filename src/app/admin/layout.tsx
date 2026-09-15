import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  LayoutGrid,
  Package,
  Boxes,
  Video,
  TicketPercent,
  Truck,
  Users,
  Star,
  Settings,
  AlertCircle,
  Store,
  LogOut,
} from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/hero", label: "Hero Banner", icon: Video },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/errors", label: "Error Logs", icon: AlertCircle },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f6efe7]">
      <div className="mx-auto max-w-[1400px] lg:grid lg:grid-cols-[248px_1fr]">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col sticky top-0 h-screen border-r border-rosewood-100 bg-rosewood-950 text-cream-100 p-4">
          <Link href="/admin" className="px-2 py-3">
            <span className="font-display text-2xl tracking-[0.12em]">SUSHRE</span>
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-300">Admin Panel</span>
          </Link>
          <nav aria-label="Admin" className="mt-3 space-y-1 overflow-y-auto">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] font-medium text-cream-100/85 hover:bg-white/10 hover:text-white transition min-h-12"
              >
                <n.icon size={19} strokeWidth={1.75} aria-hidden />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-2 border-t border-white/10 pt-3">
            <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm hover:bg-white/10 transition min-h-11">
              <Store size={17} aria-hidden /> View Store
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm hover:bg-white/10 transition min-h-11">
                <LogOut size={17} aria-hidden /> Sign out ({user.name.split(" ")[0]})
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Topbar — mobile */}
          <div className="lg:hidden sticky top-16 sm:top-[72px] z-30 bg-rosewood-950 text-cream-100 border-b border-white/10">
            <nav aria-label="Admin" className="flex gap-1 overflow-x-auto no-scrollbar px-3 py-2">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2.5 text-[13px] font-medium min-h-10">
                  <n.icon size={15} strokeWidth={1.75} aria-hidden /> {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
