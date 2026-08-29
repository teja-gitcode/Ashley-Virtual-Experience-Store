import { useEffect } from "react";
import { useExperience } from "@/lib/experience-state";
import { joinShowroom, leaveShowroom } from "@/lib/presence";
import { PeerCrowd } from "./peers";

export function PresenceGate() {
  const phase = useExperience((s) => s.phase);
  useEffect(() => {
    if (phase !== "play") {
      leaveShowroom();
      return;
    }
    joinShowroom();
    return () => leaveShowroom();
  }, [phase]);
  if (phase !== "play") return null;
  return <PeerCrowd />;
}
