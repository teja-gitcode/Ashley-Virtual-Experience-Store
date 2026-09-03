import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoomId } from "./catalog";
import type { HostLead } from "./host";

const defaultCarPoses = (): Record<string, { x: number; z: number; yaw: number }> => ({
  "lot-sedan": { x: -9.5, z: 25.2, yaw: 0 },
  "lot-hatch": { x: 9.5, z: 25.2, yaw: 0 },
});

type Bag = Record<string, number>;
export type CatalogView = "map" | "shop";

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
  drivingId: string | null;
  nearbyCarId: string | null;
  driveSpeed: number;
  carPoses: Record<string, { x: number; z: number; yaw: number }>;
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
  setNearbyCar: (id: string | null) => void;
  enterCar: (id: string) => void;
  exitCar: () => void;
  setCarPose: (id: string, x: number, z: number, yaw: number, speed: number) => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
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
      drivingId: null,
      nearbyCarId: null,
      driveSpeed: 0,
      carPoses: defaultCarPoses(),
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
    }),
    {
      name: "ashley-experience-bag",
      partialize: (s) => ({
        bag: s.bag,
        dusk: s.dusk,
        camDist: s.camDist,
        coupons: s.coupons,
        muted: s.muted,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ExperienceState>;
        return {
          ...current,
          ...p,
          coupons: Array.isArray(p.coupons) ? p.coupons : [],
          bag: p.bag && typeof p.bag === "object" ? p.bag : current.bag,
        };
      },
    },
  ),
);

export function bagCount(bag: Bag) {
  return Object.values(bag).reduce((n, q) => n + q, 0);
}

export { ZOOM_MIN, ZOOM_MAX };
