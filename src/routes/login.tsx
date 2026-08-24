import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { HouseMark } from "@/components/house-mark";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-navy text-paper">
      <img
        src="/showroom/living.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
        <Link to="/" className="mb-10 flex items-center gap-3 text-paper">
          <HouseMark className="h-9 w-10" />
          <span className="font-display text-3xl font-semibold tracking-tight">ASHLEY</span>
        </Link>
        <p className="text-sm uppercase tracking-[0.22em] text-orange">Member save</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">
          Sign in to keep your bag
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Save pieces from the showroom and pick them up later. Guest bags stay on this device.
        </p>
        <div className="mt-8 space-y-3">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="w-full rounded-md bg-paper px-4 py-3 text-sm font-semibold text-navy transition hover:bg-cream"
              >
                Continue with {p.label}
              </button>
            ))
          ) : (
            <p className="text-sm text-mist">Sign-in is disabled.</p>
          )}
        </div>
        <Link
          to="/"
          className="mt-6 text-sm text-mist underline-offset-4 hover:text-paper hover:underline"
        >
          Back to the floor
        </Link>
      </div>
    </main>
  );
}
