import { create } from "zustand";
import { joinRoom, selfId } from "trystero";

export type PeerPose = {
  x: number;
  z: number;
  yaw: number;
  walk: number;
  name: string;
  /** Empty when on foot; lot-sedan / lot-hatch when driving. */
  car: string;
};

type Remote = PeerPose & { id: string; at: number };

type PresenceState = {
  selfId: string;
  guestName: string;
  peers: Remote[];
  connected: boolean;
  setGuestName: (name: string) => void;
  upsert: (id: string, pose: PeerPose) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const NAME_KEY = "ashley-guest-name";

function defaultName() {
  if (typeof window === "undefined") return "Guest";
  const saved = localStorage.getItem(NAME_KEY)?.trim();
  if (saved) return saved.slice(0, 18);
  return `Guest-${selfId.slice(0, 4).toUpperCase()}`;
}

export const usePresence = create<PresenceState>((set, get) => ({
  selfId,
  guestName: defaultName(),
  peers: [],
  connected: false,
  setGuestName: (name) => {
    const clean = name.trim().slice(0, 18) || defaultName();
    if (typeof window !== "undefined") localStorage.setItem(NAME_KEY, clean);
    set({ guestName: clean });
  },
  upsert: (id, pose) => {
    if (id === get().selfId) return;
    set((s) => {
      const rest = s.peers.filter((p) => p.id !== id);
      const next = [...rest, { ...pose, id, at: performance.now() }].slice(-16);
      return { peers: next };
    });
  },
  remove: (id) => set((s) => ({ peers: s.peers.filter((p) => p.id !== id) })),
  clear: () => set({ peers: [], connected: false }),
}));

type RoomHandle = {
  leave: () => Promise<void>;
  send: (pose: PeerPose) => void;
};

let roomHandle: RoomHandle | null = null;
let lastSend = 0;
let lastPose: PeerPose = { x: 0, z: 23.5, yaw: 0, walk: 0, name: "Guest", car: "" };

export function sendMyPose(pose: PeerPose) {
  lastPose = pose;
  const now = performance.now();
  if (now - lastSend < 80) return;
  lastSend = now;
  roomHandle?.send(pose);
}

export function joinShowroom() {
  if (roomHandle || typeof window === "undefined") return;
  try {
    const room = joinRoom({ appId: "ashley-virtual-experience-store" }, "showroom");
    const pose = room.makeAction<PeerPose>("pose");
    pose.onMessage = (data, ctx) => {
      if (!data || typeof data.x !== "number" || typeof data.z !== "number") return;
      usePresence.getState().upsert(ctx.peerId, {
        x: data.x,
        z: data.z,
        yaw: Number(data.yaw) || 0,
        walk: data.walk ? 1 : 0,
        name: String(data.name || "Guest").slice(0, 18),
        car: typeof data.car === "string" ? data.car : "",
      });
    };
    room.onPeerJoin = (peerId) => {
      pose.send({ ...lastPose, name: usePresence.getState().guestName }, { target: peerId });
    };
    room.onPeerLeave = (peerId) => usePresence.getState().remove(peerId);
    roomHandle = {
      leave: () => room.leave(),
      send: (p) => {
        void pose.send(p);
      },
    };
    usePresence.setState({ connected: true, selfId });
  } catch (err) {
    console.warn("Showroom presence unavailable", err);
    roomHandle = null;
  }
}

export function leaveShowroom() {
  const h = roomHandle;
  roomHandle = null;
  usePresence.getState().clear();
  void h?.leave();
}
