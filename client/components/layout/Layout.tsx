import { Outlet } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { CartProvider } from "@/state/cart";

export default function Layout() {
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
