import { createFileRoute, Link } from "@tanstack/react-router";
import { HouseMark } from "@/components/house-mark";

export const Route = createFileRoute("/roblox")({ component: RobloxKit });

const FILES = [
  { href: "/roblox-kit/README.md", label: "README.md", hint: "Studio steps" },
  { href: "/roblox-kit/BuildShowroom.lua", label: "BuildShowroom.lua", hint: "ServerScriptService" },
  { href: "/roblox-kit/ShopClient.lua", label: "ShopClient.lua", hint: "StarterGui LocalScript" },
  { href: "/roblox-kit.zip", label: "roblox-kit.zip", hint: "All three files" },
];

function RobloxKit() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/" className="mb-10 flex items-center gap-3 text-navy">
          <HouseMark className="h-8 w-9" />
          <span className="font-display text-2xl font-semibold tracking-tight">ASHLEY</span>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-dark">
          Roblox Studio kit
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">
          This preview cannot be uploaded to Roblox
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone">
          Roblox runs its own engine. The walkable store you just used is a
          browser scene — it will not import as a .rbxl place. Rebuild it in
          Studio with the two scripts below, then publish from your account.
        </p>

        <ol className="mt-8 space-y-4 text-sm leading-relaxed">
          <li>
            <span className="font-semibold text-navy">1. Install Studio.</span>{" "}
            Create a Roblox account and download{" "}
            <a
              className="font-semibold text-orange-dark underline-offset-2 hover:underline"
              href="https://create.roblox.com/landing"
              target="_blank"
              rel="noreferrer"
            >
              Roblox Studio
            </a>
            .
          </li>
          <li>
            <span className="font-semibold text-navy">2. New Baseplate.</span>{" "}
            Open Studio → New → Baseplate.
          </li>
          <li>
            <span className="font-semibold text-navy">3. Paste the builder.</span>{" "}
            ServerScriptService → Script named <code className="text-navy">BuildShowroom</code>{" "}
            → paste <code className="text-navy">BuildShowroom.lua</code>.
          </li>
          <li>
            <span className="font-semibold text-navy">4. Paste the shop UI.</span>{" "}
            StarterGui → ScreenGui named <code className="text-navy">AshleyShop</code> →
            LocalScript named <code className="text-navy">ShopClient</code> → paste{" "}
            <code className="text-navy">ShopClient.lua</code>.
          </li>
          <li>
            <span className="font-semibold text-navy">5. Play, then publish.</span>{" "}
            Press Play, walk up to a sofa, press E. Stop, then File → Publish to
            Roblox.
          </li>
        </ol>

        <div className="mt-8 divide-y divide-line rounded-lg border border-line bg-cream">
          {FILES.map((f) => (
            <a
              key={f.href}
              href={f.href}
              download
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-paper"
            >
              <span className="font-medium">{f.label}</span>
              <span className="text-xs text-stone">{f.hint}</span>
            </a>
          ))}
        </div>

        <p className="mt-8 text-sm leading-relaxed text-stone">
          Private play is available to any account. Making the experience{" "}
          <span className="font-medium text-ink">public</span> now also needs
          Roblox ID verification or a prior Roblox purchase, plus a content
          maturity rating. Ashley is a trademark — keep a public version
          unofficial, or get written permission / rebrand.
        </p>

        <Link
          to="/"
          className="mt-8 inline-block text-sm font-semibold text-navy underline-offset-4 hover:underline"
        >
          Back to the floor
        </Link>
      </div>
    </main>
  );
}
