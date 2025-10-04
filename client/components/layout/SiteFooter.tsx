export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-accent text-white grid place-items-center font-bold">
              A
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              AZORIX
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Elevate your shopping with premium products, curated collections,
            and lightning-fast delivery.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>New Arrivals</li>
            <li>Best Sellers</li>
            <li>Sale</li>
            <li>Gift Cards</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>About</li>
            <li>Careers</li>
            <li>Press</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Help Center</li>
            <li>Shipping</li>
            <li>Returns</li>
            <li>Warranty</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-6 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AZORIX. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p className="opacity-80">Crafted with ♥ for modern commerce</p>
            <a href="/admin" className="underline hover:text-foreground">
              System
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
