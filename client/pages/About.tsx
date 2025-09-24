export default function About() {
  return (
    <section className="container py-16 max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">
        About AZORIX Solar
      </h1>
      <p className="mt-4 text-muted-foreground">
        AZORIX is a solar-first storefront offering premium mono PERC panels,
        on‑grid and off‑grid kits, inverters, batteries and accessories. We
        focus on high efficiency, transparent pricing, and fast delivery across
        India.
      </p>
      <div className="mt-8 grid gap-6">
        <div>
          <h2 className="font-semibold">What we offer</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Branded panels from 130W to 550W with BIS compliance</li>
            <li>
              Complete DIY kits (1–5kW) with wiring, protection and mounting
            </li>
            <li>String and micro inverters with 5–10 year warranties</li>
            <li>Installation guidance and sizing help</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Why choose us</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Genuine products and transparent specs</li>
            <li>Fast support and easy returns</li>
            <li>Bundle discounts and seasonal offers</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reach us anytime at support@azorix.store — we typically respond
            within hours.
          </p>
        </div>
      </div>
    </section>
  );
}
