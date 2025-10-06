export default function PrivacyPolicy() {
  return (
    <section className="container py-12 max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Protecting your personal information is a responsibility we take
          seriously. This policy explains what data we collect, how it is used,
          and the choices available to you.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>
            <span className="font-medium">Account Details:</span> name, email,
            password hash, and shipping address.
          </li>
          <li>
            <span className="font-medium">Order Information:</span> products
            purchased, payment method, and transaction IDs.
          </li>
          <li>
            <span className="font-medium">Device Data:</span> IP address,
            browser type, and anonymized analytics to improve site performance.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How We Use Your Data</h2>
        <p className="text-muted-foreground">
          Data is processed to fulfill orders, personalize recommendations,
          deliver marketing communications (with your consent), and prevent
          fraudulent activity. We do not sell or rent your personal data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Sharing With Service Providers
        </h2>
        <p className="text-muted-foreground">
          We share information with trusted partners that help us run our
          business, such as payment processors, shipping carriers, and analytics
          providers. These partners are contractually required to safeguard your
          data and use it only for agreed-upon purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your Rights &amp; Choices</h2>
        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
          <li>Update or correct your account information at any time.</li>
          <li>Opt out of marketing emails by using the unsubscribe link.</li>
          <li>
            Request a copy or deletion of your personal data by contacting our
            privacy team.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Data Security</h2>
        <p className="text-muted-foreground">
          We employ encryption, access controls, and routine security audits to
          protect your information. Despite our efforts, no method of
          transmission over the internet is 100% secure, so please use strong
          passwords and keep your credentials confidential.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Contact Us</h2>
        <p className="text-muted-foreground">
          For questions or requests regarding this policy, email
          <a
            href="mailto:privacy@azorix.shop"
            className="text-primary underline-offset-2 hover:underline"
          >
            privacy@azorix.shop
          </a>{" "}
          or write to AZORIX Privacy Office, 123 Market Street, Suite 400,
          Seattle, WA 98101.
        </p>
      </section>
    </section>
  );
}
