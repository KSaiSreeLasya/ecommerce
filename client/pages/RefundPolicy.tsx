export default function RefundPolicy() {
  return (
    <section className="container py-12 max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
        <p className="text-muted-foreground">
          We aim to process refunds quickly so you can shop with confidence. The
          information below explains how we handle refunds for returns,
          cancellations, and order issues.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Refund Methods</h2>
        <p className="text-muted-foreground">
          Approved refunds are issued to the original payment method. For
          buy-now-pay-later services, your provider will adjust the payment
          schedule according to their policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Processing Timeline</h2>
        <p className="text-muted-foreground">
          Once we receive your returned item, please allow <strong>2–3 business
          days</strong> for inspection. After approval, most banks post credits
          within <strong>5–7 business days</strong>. We will email you as soon as
          the refund is released.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Partial Refunds</h2>
        <p className="text-muted-foreground">
          We reserve the right to issue partial refunds for items that show signs
          of use, are missing accessories, or are returned outside the stated
          window. You will be notified of any adjustment before the refund is
          finalized.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Shipping Fees</h2>
        <p className="text-muted-foreground">
          Outbound shipping fees are non-refundable unless the return is due to a
          shipping error or a defective item. If you opted for expedited
          delivery, the service charge will not be reimbursed.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Order Cancellations</h2>
        <p className="text-muted-foreground">
          Orders can be cancelled within <strong>60 minutes</strong> of purchase
          from the order confirmation screen. After this window, please follow
          our standard return process to request a refund once the item arrives.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Still Need Help?</h2>
        <p className="text-muted-foreground">
          Contact our support team at
          <a
            href="mailto:billing@azorix.shop"
            className="text-primary underline-offset-2 hover:underline"
          >
            billing@azorix.shop
          </a>{" "}
          or call <span className="font-medium">(800) 123-4567</span> if your
          refund has not appeared after the estimated timeframe.
        </p>
      </section>
    </section>
  );
}
