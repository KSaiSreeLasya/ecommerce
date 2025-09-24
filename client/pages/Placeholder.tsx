import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Placeholder() {
  const { pathname } = useLocation();
  const label = pathname.replace("/", "").replaceAll("-", " ") || "Home";

  return (
    <section className="container py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </h1>
        <p className="mt-3 text-muted-foreground">
          This page is ready to be customized. Tell me what to show here and
          I’ll build it next.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link to="/">Back to homepage</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
