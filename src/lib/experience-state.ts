import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoomId } from "./catalog";
import type { HostLead } from "./host";
import { oppositeWall, type RoomJoin } from "./home-layout";
import type { DoorWall } from "./room-fit";

const defaultCarPoses = (): Record<string, { x: number; z: number; yaw: number }> => ({
  "lot-sedan": { x: -9.5, z: 25.2, yaw: 0 },
  "lot-hatch": { x: 9.5, z: 25.2, yaw: 0 },
});

type Bag = Record<string, number>;
export type CatalogView = "map" | "shop";
export type FloorFinish = "oak" | "carpet" | "tile";

export type RoomItem = {
  uid: string;
  productId: string;
  x: number;
  z: number;
  rot: number;
};

export type RoomPlan = {
  id: string;
  name: string;
  widthIn: number;
  lengthIn: number;
  heightIn: number;
  floor: FloorFinish;
  doorWall: DoorWall;
  doorOffsetIn: number;
  doorWidthIn: number;
  /** Which side of another room this one is built against. */
  join?: RoomJoin;
  items: RoomItem[];
};

export function defaultRoomPlan(name = "Bedroom"): RoomPlan {
  return {
    id: `room-${Math.random().toString(36).slice(2, 8)}`,
    name,
    widthIn: 12 * 12,
    lengthIn: 14 * 12,
    heightIn: 8 * 12,
    floor: "carpet",
    doorWall: "s",
    doorOffsetIn: 0,
    doorWidthIn: 32,
    items: [],
  };
}

const ROOM_PRESETS: Record<string, Pick<RoomPlan, "name" | "widthIn" | "lengthIn" | "floor">> = {
  living: { name: "Living", widthIn: 12 * 12, lengthIn: 18 * 12, floor: "oak" },
  bedroom: { name: "Bedroom", widthIn: 12 * 12, lengthIn: 14 * 12, floor: "carpet" },
  dining: { name: "Dining", widthIn: 11 * 12, lengthIn: 14 * 12, floor: "oak" },
};

export { ROOM_PRESETS };

function pieceUid() {
  return `piece-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}

function clampIn(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function asPlan(value: unknown): RoomPlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<RoomPlan>;
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || !Array.isArray(raw.items)) return null;
  const items = raw.items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<RoomItem>;
    if (typeof row.uid !== "string" || typeof row.productId !== "string") return [];
    if (typeof row.x !== "number" || typeof row.z !== "number" || typeof row.rot !== "number") return [];
    return [{ uid: row.uid, productId: row.productId, x: row.x, z: row.z, rot: row.rot }];
  });
  const doorWall: DoorWall =
    raw.doorWall === "n" || raw.doorWall === "e" || raw.doorWall === "w" || raw.doorWall === "s"
      ? raw.doorWall
      : "s";
  const floor: FloorFinish = raw.floor === "oak" || raw.floor === "tile" || raw.floor === "carpet" ? raw.floor : "carpet";
  const joined = raw.join;
  const join: RoomJoin | undefined =
    joined &&
    typeof joined === "object" &&
    typeof joined.to === "string" &&
    (joined.side === "n" || joined.side === "e" || joined.side === "s" || joined.side === "w")
      ? { to: joined.to, side: joined.side }
      : undefined;
  return {
    id: raw.id,
    name: raw.name,
    widthIn: clampIn(raw.widthIn ?? 144, 72, 480),
    lengthIn: clampIn(raw.lengthIn ?? 168, 72, 480),
    heightIn: clampIn(raw.heightIn ?? 96, 96, 144),
    floor,
    doorWall,
    doorOffsetIn: clampIn(raw.doorOffsetIn ?? 0, -240, 240),
    doorWidthIn: clampIn(raw.doorWidthIn ?? 32, 28, 48),
    join,
    items,
  };
}

const ZOOM_MIN = 2.2;
const ZOOM_MAX = 14;

export const COUPON_IDS = ["shelf-living", "shelf-office", "shelf-dining"] as const;
export type CouponId = (typeof COUPON_IDS)[number];
export const COUPON_RATE = 0.1;
export const COUPON_MAX = 3;

export function couponOff(coupons: string[]) {
  return Math.min(coupons.length, COUPON_MAX) * COUPON_RATE;
}

export function isCouponId(id: string | null): id is CouponId {
  return !!id && (COUPON_IDS as readonly string[]).includes(id);
}

type ExperienceState = {
  phase: "start" | "play";
  selectedId: string | null;
  hoveredId: string | null;
  bagOpen: boolean;
  catalogOpen: boolean;
  catalogView: CatalogView;
  room: RoomId;
  bag: Bag;
  coupons: string[];
  toast: string | null;
  toastKey: number;
  joyX: number;
  joyY: number;
  lookDx: number;
  lookDy: number;
  teleport: { x: number; z: number } | null;
  camDist: number;
  firstPerson: boolean;
  dusk: boolean;
  gyro: boolean;
  muted: boolean;
  px: number;
  pz: number;
  hostMenuOpen: boolean;
  hostNearby: boolean;
  hostReady: boolean;
  hostLead: HostLead | null;
  hostArrived: string | null;
  hostGreeted: boolean;
  drivingId: string | null;
  nearbyCarId: string | null;
  driveSpeed: number;
  carPoses: Record<string, { x: number; z: number; yaw: number }>;
  studioOpen: boolean;
  shortlist: string[];
  roomPlans: RoomPlan[];
  activeRoomId: string;
  enter: () => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setRoom: (room: RoomId) => void;
  toggleBag: (open?: boolean) => void;
  toggleCatalog: (open?: boolean) => void;
  openCatalog: (view?: CatalogView) => void;
  setCatalogView: (view: CatalogView) => void;
  addToBag: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  claimCoupon: (id: string) => void;
  clearToast: () => void;
  setJoy: (x: number, y: number) => void;
  addLook: (dx: number, dy: number) => void;
  consumeLook: () => { dx: number; dy: number };
  requestTeleport: (x: number, z: number) => void;
  consumeTeleport: () => { x: number; z: number } | null;
  hydrateBag: (bag: Bag) => void;
  nudgeZoom: (delta: number) => void;
  setZoom: (dist: number) => void;
  toggleFirstPerson: () => void;
  toggleDusk: () => void;
  setGyro: (v: boolean) => void;
  toggleGyro: () => void;
  toggleMute: () => void;
  setPos: (x: number, z: number) => void;
  openHostMenu: () => void;
  closeHostMenu: () => void;
  setHostNearby: (v: boolean) => void;
  setHostReady: (v: boolean) => void;
  startHostLead: (lead: HostLead) => void;
  clearHostLead: () => void;
  setHostArrived: (label: string | null) => void;
  markHostGreeted: () => void;
  setNearbyCar: (id: string | null) => void;
  enterCar: (id: string) => void;
  exitCar: () => void;
  setCarPose: (id: string, x: number, z: number, yaw: number, speed: number) => void;
  toggleShortlist: (id: string) => void;
  openStudio: () => void;
  closeStudio: () => void;
  tryInRoom: (productId: string) => void;
  addRoomPlan: (side?: DoorWall) => void;
  removeRoomPlan: (id: string) => void;
  setActiveRoom: (id: string) => void;
  updateActiveRoom: (patch: Partial<Omit<RoomPlan, "id" | "items">>) => void;
  applyRoomPreset: (key: string) => void;
  addRoomItem: (productId: string) => void;
  moveRoomItem: (uid: string, x: number, z: number, rot?: number) => void;
  removeRoomItem: (uid: string) => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function currentRoomId(s: { activeRoomId: string; roomPlans: RoomPlan[] }) {
  if (s.roomPlans.some((plan) => plan.id === s.activeRoomId)) return s.activeRoomId;
  return s.roomPlans[0]?.id ?? "";
}

export const useExperience = create<ExperienceState>()(
  persist(
    (set, get) => ({
      phase: "start",
      selectedId: null,
      hoveredId: null,
      bagOpen: false,
      catalogOpen: false,
      catalogView: "map",
      room: "lot",
      bag: {},
      coupons: [],
      toast: null,
      toastKey: 0,
      joyX: 0,
      joyY: 0,
      lookDx: 0,
      lookDy: 0,
      teleport: null,
      camDist: 6.6,
      firstPerson: false,
      dusk: false,
      gyro: false,
      muted: false,
      px: 0,
      pz: 23.5,
      hostMenuOpen: false,
      hostNearby: false,
      hostReady: false,
      hostLead: null,
      hostArrived: null,
      hostGreeted: false,
      drivingId: null,
      nearbyCarId: null,
      driveSpeed: 0,
      carPoses: defaultCarPoses(),
      studioOpen: false,
      shortlist: [],
      roomPlans: [defaultRoomPlan()],
      activeRoomId: "",
      enter: () => set({ phase: "play", px: 0, pz: 23.5, drivingId: null }),
      select: (id) =>
        set({
          selectedId: id,
          bagOpen: false,
          catalogOpen: false,
          hostMenuOpen: id === "welcome-desk",
        }),
      hover: (id) => set({ hoveredId: id }),
      setRoom: (room) => set({ room }),
      toggleBag: (open) =>
        set((s) => ({
          bagOpen: open ?? !s.bagOpen,
          catalogOpen: false,
          selectedId: null,
        })),
      toggleCatalog: (open) =>
        set((s) => ({
          catalogOpen: open ?? !s.catalogOpen,
          bagOpen: false,
          selectedId: null,
        })),
      openCatalog: (view = "map") =>
        set({
          catalogOpen: true,
          catalogView: view,
          bagOpen: false,
          selectedId: null,
        }),
      setCatalogView: (view) => set({ catalogView: view }),
      addToBag: (id) =>
        set((s) => ({ bag: { ...s.bag, [id]: (s.bag[id] ?? 0) + 1 } })),
      setQty: (id, qty) =>
        set((s) => {
          const next = { ...s.bag };
          if (qty <= 0) delete next[id];
          else next[id] = qty;
          return { bag: next };
        }),
      claimCoupon: (id) =>
        set((s) => {
          if (s.coupons.includes(id)) {
            return { toast: "Already in your bag", toastKey: s.toastKey + 1 };
          }
          return {
            coupons: [...s.coupons, id],
            toast: "Discount coupon found yayy",
            toastKey: s.toastKey + 1,
            bagOpen: true,
            catalogOpen: false,
            selectedId: null,
            hoveredId: null,
            hostMenuOpen: false,
          };
        }),
      clearToast: () => set({ toast: null }),
      setJoy: (x, y) => set({ joyX: x, joyY: y }),
      addLook: (dx, dy) =>
        set((s) => ({ lookDx: s.lookDx + dx, lookDy: s.lookDy + dy })),
      consumeLook: () => {
        const { lookDx, lookDy } = get();
        if (lookDx || lookDy) set({ lookDx: 0, lookDy: 0 });
        return { dx: lookDx, dy: lookDy };
      },
      requestTeleport: (x, z) =>
        set({ teleport: { x, z }, selectedId: null, catalogOpen: false, drivingId: null, driveSpeed: 0 }),
      consumeTeleport: () => {
        const t = get().teleport;
        if (t) set({ teleport: null });
        return t;
      },
      hydrateBag: (bag) => set({ bag: { ...get().bag, ...bag } }),
      nudgeZoom: (delta) =>
        set((s) => {
          if (s.firstPerson && delta > 0) {
            return { firstPerson: false, camDist: ZOOM_MIN + 0.15 };
          }
          return { camDist: clamp(s.camDist + delta, ZOOM_MIN, ZOOM_MAX) };
        }),
      setZoom: (dist) => set({ camDist: clamp(dist, ZOOM_MIN, ZOOM_MAX), firstPerson: false }),
      toggleFirstPerson: () => set((s) => ({ firstPerson: !s.firstPerson })),
      toggleDusk: () => set((s) => ({ dusk: !s.dusk })),
      setGyro: (v) => set({ gyro: v }),
      toggleGyro: () => set((s) => ({ gyro: !s.gyro })),
      toggleMute: () =>
        set((s) => {
          const muted = !s.muted;
          return { muted };
        }),
      setPos: (x, z) => set({ px: x, pz: z }),
      openHostMenu: () =>
        set({
          hostMenuOpen: true,
          hostGreeted: true,
          selectedId: "welcome-desk",
          bagOpen: false,
          catalogOpen: false,
        }),
      closeHostMenu: () =>
        set((s) => ({
          hostMenuOpen: false,
          selectedId: s.selectedId === "welcome-desk" ? null : s.selectedId,
        })),
      setHostNearby: (v) => set({ hostNearby: v }),
      setHostReady: (v) => set({ hostReady: v }),
      startHostLead: (lead) =>
        set({
          hostLead: lead,
          hostMenuOpen: false,
          hostArrived: null,
          selectedId: null,
          catalogOpen: false,
          bagOpen: false,
        }),
      clearHostLead: () => set({ hostLead: null }),
      setHostArrived: (label) => set({ hostArrived: label, hostLead: null }),
      markHostGreeted: () => set({ hostGreeted: true }),
      setNearbyCar: (id) => {
        if (get().nearbyCarId !== id) set({ nearbyCarId: id });
      },
      enterCar: (id) => {
        const s = get();
        const p = s.carPoses[id];
        if (!p) return;
        if (Math.hypot(s.px - p.x, s.pz - p.z) > 5.8) {
          set({ toast: "Walk over to the car", toastKey: s.toastKey + 1 });
          return;
        }
        set({
          drivingId: id,
          nearbyCarId: id,
          selectedId: null,
          catalogOpen: false,
          bagOpen: false,
          hostMenuOpen: false,
          firstPerson: false,
        });
      },
      exitCar: () => {
        const s = get();
        if (!s.drivingId) return;
        const p = s.carPoses[s.drivingId];
        const x = p.x - Math.cos(p.yaw) * 2.35;
        const z = p.z + Math.sin(p.yaw) * 2.35;
        set({
          drivingId: null,
          driveSpeed: 0,
          teleport: { x, z },
        });
      },
      setCarPose: (id, x, z, yaw, speed) =>
        set((s) => ({
          carPoses: { ...s.carPoses, [id]: { x, z, yaw } },
          driveSpeed: speed,
          px: x,
          pz: z,
        })),
      toggleShortlist: (id) =>
        set((s) => ({
          shortlist: s.shortlist.includes(id)
            ? s.shortlist.filter((item) => item !== id)
            : [...s.shortlist, id],
        })),
      openStudio: () =>
        set((s) => ({
          studioOpen: true,
          catalogOpen: false,
          bagOpen: false,
          selectedId: null,
          hostMenuOpen: false,
          activeRoomId: currentRoomId(s),
          roomPlans: s.roomPlans.length ? s.roomPlans : [defaultRoomPlan()],
        })),
      closeStudio: () => set({ studioOpen: false }),
      tryInRoom: (productId) =>
        set((s) => {
          const plans = s.roomPlans.length ? s.roomPlans : [defaultRoomPlan()];
          const activeRoomId = plans.some((plan) => plan.id === s.activeRoomId)
            ? s.activeRoomId
            : plans[0].id;
          const item: RoomItem = { uid: pieceUid(), productId, x: 0, z: 0, rot: 0 };
          return {
            shortlist: s.shortlist.includes(productId) ? s.shortlist : [...s.shortlist, productId],
            roomPlans: plans.map((plan) =>
              plan.id === activeRoomId ? { ...plan, items: [...plan.items, item] } : plan,
            ),
            activeRoomId,
            studioOpen: true,
            catalogOpen: false,
            bagOpen: false,
            selectedId: null,
            hostMenuOpen: false,
          };
        }),
      addRoomPlan: (side: DoorWall = "e") =>
        set((s) => {
          const active = currentRoomId(s);
          const parent = s.roomPlans.find((plan) => plan.id === active) ?? s.roomPlans[0];
          const keys = ["living", "dining", "bedroom"] as const;
          const preset = parent ? ROOM_PRESETS[keys[(s.roomPlans.length - 1) % keys.length]] : undefined;
          const join = parent ? { to: parent.id, side } : undefined;
          const plan: RoomPlan = {
            ...defaultRoomPlan(preset?.name ?? "Living"),
            ...(preset ?? {}),
            join,
            doorWall: join ? oppositeWall(side) : "s",
            doorOffsetIn: 0,
          };
          return { roomPlans: [...s.roomPlans, plan], activeRoomId: plan.id };
        }),
      removeRoomPlan: (id) =>
        set((s) => {
          const removed = s.roomPlans.find((plan) => plan.id === id);
          const roomPlans = s.roomPlans
            .filter((plan) => plan.id !== id)
            .map((plan) => {
              if (plan.join?.to !== id) return plan;
              const fallback = removed?.join?.to;
              if (fallback && fallback !== plan.id) return { ...plan, join: { to: fallback, side: plan.join.side } };
              return { ...plan, join: undefined };
            });
          const next = roomPlans.length ? roomPlans : [defaultRoomPlan()];
          return {
            roomPlans: next,
            activeRoomId: next.some((plan) => plan.id === s.activeRoomId) ? s.activeRoomId : next[0].id,
          };
        }),
      setActiveRoom: (id) => set({ activeRoomId: id }),
      updateActiveRoom: (patch) =>
        set((s) => {
          const id = currentRoomId(s);
          return {
            activeRoomId: id,
            roomPlans: s.roomPlans.map((plan) => {
              if (plan.id !== id) return plan;
              const next = { ...plan, ...patch };
              next.widthIn = clampIn(next.widthIn, 72, 480);
              next.lengthIn = clampIn(next.lengthIn, 72, 480);
              next.heightIn = clampIn(next.heightIn, 96, 144);
              next.doorWidthIn = clampIn(next.doorWidthIn, 28, 48);
              next.doorOffsetIn = clampIn(next.doorOffsetIn, -240, 240);
              return next;
            }),
          };
        }),
      applyRoomPreset: (key) =>
        set((s) => {
          const preset = ROOM_PRESETS[key];
          if (!preset) return {};
          const id = currentRoomId(s);
          return {
            activeRoomId: id,
            roomPlans: s.roomPlans.map((plan) => (plan.id === id ? { ...plan, ...preset } : plan)),
          };
        }),
      addRoomItem: (productId) =>
        set((s) => {
          const id = currentRoomId(s);
          const item: RoomItem = { uid: pieceUid(), productId, x: 0, z: 0, rot: 0 };
          return {
            activeRoomId: id,
            shortlist: s.shortlist.includes(productId) ? s.shortlist : [...s.shortlist, productId],
            roomPlans: s.roomPlans.map((plan) =>
              plan.id === id ? { ...plan, items: [...plan.items, item] } : plan,
            ),
          };
        }),
      moveRoomItem: (uid, x, z, rot) =>
        set((s) => ({
          roomPlans: s.roomPlans.map((plan) => ({
            ...plan,
            items: plan.items.map((item) =>
              item.uid === uid ? { ...item, x, z, rot: rot ?? item.rot } : item,
            ),
          })),
        })),
      removeRoomItem: (uid) =>
        set((s) => ({
          roomPlans: s.roomPlans.map((plan) => ({
            ...plan,
            items: plan.items.filter((item) => item.uid !== uid),
          })),
        })),
    }),
    {
      name: "ashley-experience-bag",
      partialize: (s) => ({
        bag: s.bag,
        dusk: s.dusk,
        camDist: s.camDist,
        coupons: s.coupons,
        muted: s.muted,
        shortlist: s.shortlist,
        roomPlans: s.roomPlans,
        activeRoomId: s.activeRoomId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ExperienceState>;
        const roomPlans = Array.isArray(p.roomPlans)
          ? p.roomPlans.map(asPlan).filter((plan): plan is RoomPlan => plan !== null)
          : [];
        const plans = roomPlans.length ? roomPlans : current.roomPlans;
        const shortlist = Array.isArray(p.shortlist)
          ? p.shortlist.filter((id): id is string => typeof id === "string")
          : [];
        const activeRoomId = plans.some((plan) => plan.id === p.activeRoomId)
          ? (p.activeRoomId as string)
          : plans[0].id;
        return {
          ...current,
          ...p,
          coupons: Array.isArray(p.coupons) ? p.coupons : [],
          bag: p.bag && typeof p.bag === "object" ? p.bag : current.bag,
          shortlist,
          roomPlans: plans,
          activeRoomId,
          studioOpen: false,
        };
      },
    },
  ),
);

export function bagCount(bag: Bag) {
  return Object.values(bag).reduce((n, q) => n + q, 0);
}

export { ZOOM_MIN, ZOOM_MAX };
