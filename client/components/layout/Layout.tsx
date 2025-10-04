import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { CartProvider } from "@/state/cart";

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    const base = "E Commerce";
    const path = location.pathname.replace(/\/+$/, "");
    if (path === "" || path === "/") {
      document.title = base;
      return;
    }
    const seg = path.split("/").filter(Boolean)[0] || "home";
    const label = seg
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    document.title = `${base} | ${label}`;
  }, [location.pathname]);

  return (
    <CartProvider>
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
