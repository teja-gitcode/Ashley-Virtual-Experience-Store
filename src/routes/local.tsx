import { createFileRoute, Link } from "@tanstack/react-router";
import { HouseMark } from "@/components/house-mark";

export const Route = createFileRoute("/local")({ component: LocalRun });

function LocalRun() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/" className="mb-10 flex items-center gap-3 text-navy">
          <HouseMark className="h-8 w-9" />
          <span className="font-display text-2xl font-semibold tracking-tight">ASHLEY</span>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-dark">
          Your computer
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">
          Run the store on localhost
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone">
          The preview you are in already is the live app. To run the same
          project on your machine, download the source, install Node 22, then
          start the dev server on port 8080.
        </p>

        <ol className="mt-8 space-y-4 text-sm leading-relaxed">
          <li>
            <span className="font-semibold text-navy">1. Install Node.js 22.</span>{" "}
            From{" "}
            <a
              className="font-semibold text-orange-dark underline-offset-2 hover:underline"
              href="https://nodejs.org"
              target="_blank"
              rel="noreferrer"
            >
              nodejs.org
            </a>
            . Confirm with <code className="text-navy">node -v</code>.
          </li>
          <li>
            <span className="font-semibold text-navy">2. Download the project.</span>{" "}
            Use the zip below, or export / download from this Grok project if
            that control is in your project menu.
          </li>
          <li>
            <span className="font-semibold text-navy">3. Unzip and install.</span>
            <pre className="mt-2 overflow-x-auto rounded-md bg-navy p-4 text-xs text-paper">
{`cd ashley-experience-store
npm install`}
            </pre>
          </li>
          <li>
            <span className="font-semibold text-navy">4. Start it.</span>
            <pre className="mt-2 overflow-x-auto rounded-md bg-navy p-4 text-xs text-paper">
{`npm run dev`}
            </pre>
            Open{" "}
            <span className="font-medium text-ink">http://localhost:8080</span>.
            Stay on port 8080 so sign-in keeps working.
          </li>
        </ol>

        <a
          href="/ashley-experience-store.zip"
          download
          className="mt-8 inline-flex rounded-md bg-navy px-5 py-3 text-sm font-semibold text-paper"
        >
          Download source zip
        </a>

        <p className="mt-8 text-sm leading-relaxed text-stone">
          Production-style local run: <code className="text-navy">npm run build</code> then{" "}
          <code className="text-navy">npm run preview</code> — still port 8080.
          No database to provision. Roblox is a separate path; leave that kit
          for later.
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
