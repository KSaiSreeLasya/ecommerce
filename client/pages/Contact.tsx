import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        const raw = localStorage.getItem("demo_contact_messages");
        const arr = raw ? (JSON.parse(raw) as any[]) : [];
        arr.unshift({ id: crypto.randomUUID(), ...form, created_at: new Date().toISOString() });
        localStorage.setItem("demo_contact_messages", JSON.stringify(arr));
        setSent(true);
        setForm({ name: "", email: "", subject: "", message: "" });
        return;
      }
      const { error } = await supabase.from("contact_messages").insert({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      if (error) {
        alert(`Failed to send message: ${error.message}`);
      } else {
        setSent(true);
        setForm({ name: "", email: "", subject: "", message: "" });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="container py-16 max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>
      <p className="mt-4 text-muted-foreground">
        Have questions about solar panels or kits? We’re here to help.
      </p>
      {sent && (
        <div className="mt-4 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
          Thanks! Your message has been sent.
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="sm:col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <textarea
          className="sm:col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          rows={5}
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />
        <button disabled={sending} className="sm:col-span-2 h-10 rounded-md bg-primary text-primary-foreground disabled:opacity-50">
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </section>
  );
}
