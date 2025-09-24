export default function Contact() {
  return (
    <section className="container py-16 max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>
      <p className="mt-4 text-muted-foreground">
        Have questions about solar panels or kits? We’re here to help.
      </p>
      <form className="mt-6 grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Your name"
        />
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Email"
          type="email"
        />
        <input
          className="sm:col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Subject"
        />
        <textarea
          className="sm:col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          rows={5}
          placeholder="Message"
        />
        <button className="sm:col-span-2 h-10 rounded-md bg-primary text-primary-foreground">
          Send
        </button>
      </form>
    </section>
  );
}
