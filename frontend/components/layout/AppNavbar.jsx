"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/92 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
        <Link
          href="/dashboard"
          className="rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#F59E0B]/50"
          aria-label="FinSim dashboard"
        >
          <BrandLogo size="sm" />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                  active
                    ? "bg-[#F59E0B]/10 text-[#F59E0B]"
                    : "text-[#8A8F98] hover:text-[#F5F5F5]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => router.push("/setup")}
            className="ml-1 rounded-lg bg-[#F59E0B] px-3.5 py-2 text-[13px] font-semibold text-[#0A0A0A] transition hover:opacity-95 sm:ml-2 sm:px-4"
          >
            New Simulation
          </button>
        </div>
      </div>
    </nav>
  );
}
