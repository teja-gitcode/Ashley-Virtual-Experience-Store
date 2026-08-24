import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { HouseMark } from "@/components/house-mark";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  const [Experience, setExperience] = useState<ComponentType | null>(null);

  useEffect(() => {
    let alive = true;
    void import("@/game/experience").then((mod) => {
      if (alive) setExperience(() => mod.Experience);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!Experience) {
    return (
      <div className="grid min-h-dvh place-items-center bg-navy text-paper">
        <div className="flex flex-col items-center gap-4">
          <HouseMark className="h-12 w-14" />
          <p className="font-display text-2xl tracking-tight">ASHLEY</p>
          <p className="text-sm text-mist">Opening the showroom…</p>
        </div>
      </div>
    );
  }

  return <Experience />;
}
