import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Search, Menu, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/state/cart";
import { supabase } from "@/lib/supabase";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setIsAdmin(false);
      const { data, error } = await supabase
        .from("admin_emails")
        .select("email")
        .eq("email", user.email!)
        .maybeSingle();
      setIsAdmin(!!data && !error);
    })();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="group inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-accent text-white grid place-items-center font-bold">
              A
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              AZORIX
              <span className="text-primary">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products"
              className="w-64 pl-10 pr-3 py-2 rounded-md bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring border border-input placeholder:text-muted-foreground"
            />
          </div>
          <Link to="/cart" className="relative inline-flex">
            <Button variant="ghost" size="icon" aria-label="Shopping cart">
              <ShoppingBag />
            </Button>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {count}
              </span>
            )}
          </Link>
          <Link to="/auth">
            <Button variant="ghost" size="icon" aria-label="Account">
              <User />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Menu />
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container grid py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-2 py-3 text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/cart"
              onClick={() => setOpen(false)}
              className="px-2 py-3 text-sm font-medium"
            >
              Cart
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-sm font-medium"
              >
                Admin
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
