import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ReturnPolicy() {
  return (
    <section className="container py-12 max-w-3xl space-y-8">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="h-auto px-0 text-sm font-medium">
          <Link to="/">← Back to home</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Return Policy</h1>
        <p className="text-muted-foreground">
          We want you to be thrilled with your purchase. If something is not
          quite right, review the details below to understand how to start a
          hassle-free return.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Eligibility Window</h2>
        <p className="text-muted-foreground">
          Returns are accepted within <strong>30 days</strong> of the delivery
          date. Items must be unused, unwashed, and in their original packaging
          with all tags attached. For bundled items, all components must be
          returned together.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How to Start a Return</h2>
        <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
          <li>Log in to your account and visit the Orders section.</li>
          <li>Select the item you would like to return and choose a reason.</li>
          <li>
            Print the prepaid return label we provide and securely pack your
            item.
          </li>
          <li>
            Drop the package at any carrier location indicated on the label.
          </li>
        </ol>
        <p className="text-sm text-muted-foreground/80">
          If you checked out as a guest, contact our support team with your
          order number to receive a return label.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Non-Returnable Items</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            Final sale or clearance items clearly marked as non-returnable.
          </li>
          <li>Gift cards, downloadable software, or perishable goods.</li>
          <li>
            Items damaged through improper use or missing essential components.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Return Shipping</h2>
        <p className="text-muted-foreground">
          Domestic returns using our prepaid label are free. If you choose a
          different shipping method, shipping fees are non-refundable. For
          international orders, return shipping charges are the responsibility
          of the customer unless the item was received defective or incorrect.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Need Assistance?</h2>
        <p className="text-muted-foreground">
          Our customer care team is available seven days a week. Reach us at
          <a
            href="mailto:support@azorix.shop"
            className="text-primary underline-offset-2 hover:underline"
          >
            support@azorix.shop
          </a>{" "}
          or call <span className="font-medium">(800) 123-4567</span> for
          real-time guidance.
        </p>
      </section>
    </section>
  );
}
