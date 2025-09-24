import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <section className="container py-16 max-w-md">
        <h1 className="text-2xl font-bold">Authentication unavailable</h1>
        <p className="text-muted-foreground mt-2">
          Connect Supabase to enable sign‑in.
        </p>
      </section>
    );
  }

  const send = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (!error) setSent(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  if (userEmail) {
    return (
      <section className="container py-16 max-w-md">
        <h1 className="text-2xl font-bold">Signed in</h1>
        <p className="text-muted-foreground mt-2">{userEmail}</p>
        <Button className="mt-6" onClick={signOut}>
          Sign out
        </Button>
      </section>
    );
  }

  return (
    <section className="container py-16 max-w-md">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-muted-foreground mt-2">
        We’ll send a magic link to your email.
      </p>
      <div className="mt-6 grid gap-3">
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button onClick={send}>Send magic link</Button>
        {sent && (
          <p className="text-sm text-muted-foreground">
            Check your email for the sign-in link.
          </p>
        )}
      </div>
    </section>
  );
}
