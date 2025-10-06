import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Disclaimer() {
  return (
    <section className="container py-12 max-w-3xl space-y-8">
      <header className="space-y-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-auto px-0 text-sm font-medium"
        >
          <Link to="/">← Back to home</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Disclaimer</h1>
        <p className="text-muted-foreground">
          This page outlines important notices about product information,
          third-party content, and responsibility when shopping with AZORIX.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Product Information</h2>
        <p className="text-muted-foreground">
          We strive to describe products accurately; however, colors, materials,
          and specifications may vary slightly from the images shown. Packaging
          may be updated by manufacturers without prior notice. Always review
          the instructions included with your purchase before use.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Health &amp; Safety</h2>
        <p className="text-muted-foreground">
          Any wellness, beauty, or fitness products sold on our site are not
          substitutes for professional medical advice. Consult a licensed
          healthcare provider before starting new treatments or routines. AZORIX
          is not liable for injuries or damages resulting from misuse of
          products.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Third-Party Links</h2>
        <p className="text-muted-foreground">
          Our website may include links to third-party resources for your
          convenience. AZORIX does not endorse or control the content on
          external sites and is not responsible for losses caused by relying on
          information found there.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Limitation of Liability</h2>
        <p className="text-muted-foreground">
          To the fullest extent permitted by law, AZORIX will not be liable for
          indirect, incidental, or consequential damages arising from the use of
          our products or website. Your sole remedy for dissatisfaction is to
          discontinue use of the site or return the product in accordance with
          our policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Contact Us</h2>
        <p className="text-muted-foreground">
          Questions about this disclaimer can be directed to
          <a
            href="mailto:legal@azorix.shop"
            className="text-primary underline-offset-2 hover:underline"
          >
            legal@azorix.shop
          </a>{" "}
          or by mail at AZORIX Legal, 123 Market Street, Suite 400, Seattle, WA
          98101.
        </p>
      </section>
    </section>
  );
}
