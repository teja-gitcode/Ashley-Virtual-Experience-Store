import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Armchair,
  Baby,
  BedDouble,
  Briefcase,
  CookingPot,
  Compass,
  Eye,
  Headset,
  Lamp,
  MapPin,
  Moon,
  Search,
  ShoppingBag,
  Sofa,
  Sun,
  Trees,
  Users,
  Utensils,
  X,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { HouseMark } from "@/components/house-mark";
import {
  bagCount,
  couponOff,
  isCouponId,
  useExperience,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/lib/experience-state";
import {
  firstPlacement,
  money,
  productImage,
  PRODUCT_MAP,
  PRODUCTS,
  ROOMS,
  standNear,
  type RoomId,
} from "@/lib/catalog";
import { HOST_NAME, leadToProduct, leadToRoom } from "@/lib/host";
import { cn } from "@/lib/cn";
import { isCoarsePointer, requestOrientationPermission } from "@/lib/handheld";
import { setStickPointer } from "@/lib/stick";
import { usePresence } from "@/lib/presence";
import { xrStore } from "@/game/xr-store";
import { resumeAudio, setMuted } from "@/lib/audio";

const ROOM_ICON: Record<RoomId, typeof Sofa> = {
  lot: MapPin,
  lobby: Lamp,
  living: Sofa,
  bedroom: BedDouble,
  dining: Utensils,
  sleep: Armchair,
  patio: Trees,
  kitchen: CookingPot,
  office: Briefcase,
  kids: Baby,
};

export function StoreChrome() {
  const phase = useExperience((s) => s.phase);
  const enter = useExperience((s) => s.enter);
  const selectedId = useExperience((s) => s.selectedId);
  const hoveredId = useExperience((s) => s.hoveredId);
  const bagOpen = useExperience((s) => s.bagOpen);
  const catalogOpen = useExperience((s) => s.catalogOpen);
  const hostMenuOpen = useExperience((s) => s.hostMenuOpen);
  const room = useExperience((s) => s.room);
  const bag = useExperience((s) => s.bag);
  const muted = useExperience((s) => s.muted);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Escape") {
        useExperience.getState().select(null);
        useExperience.getState().toggleBag(false);
        useExperience.getState().toggleCatalog(false);
      }
      if (useExperience.getState().phase !== "play") return;
      if (e.code === "KeyM") {
        const s = useExperience.getState();
        if (s.catalogOpen && s.catalogView === "map") s.toggleCatalog(false);
        else s.openCatalog("map");
      }
      if (e.code === "KeyG") {
        const s = useExperience.getState();
        if (s.catalogOpen && s.catalogView === "shop") s.toggleCatalog(false);
        else s.openCatalog("shop");
      }
      if (e.code === "KeyB") useExperience.getState().toggleBag();
      if (e.code === "KeyC") useExperience.getState().toggleFirstPerson();
      if (e.code === "KeyL") useExperience.getState().toggleDusk();
      if (e.code === "KeyE") {
        const s = useExperience.getState();
        if (s.hostNearby || s.hostReady) s.openHostMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 text-paper">
      {phase === "start" ? <StartOverlay onEnter={enter} /> : null}

      {phase === "play" ? (
        <>
          <TopBar room={room} count={bagCount(bag)} />
          <RoomRail room={room} />
          <ToastHud />
          {hoveredId && !selectedId && !hostMenuOpen ? <HoverHint id={hoveredId} /> : null}
          <HostHud />
          {selectedId ? <ProductSheet id={selectedId} /> : null}
          {bagOpen ? <BagPanel /> : null}
          {catalogOpen ? <CatalogPanel /> : null}
          <HelpHint />
          <ViewControls />
          <MiniMap />
          <Joystick />
        </>
      ) : null}
    </div>
  );
}

function GuestNameField() {
  const name = usePresence((s) => s.guestName);
  return (
    <label className="mt-5 block max-w-xs">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">
        Your name on the floor
      </span>
      <input
        value={name}
        maxLength={18}
        onChange={(e) => usePresence.getState().setGuestName(e.target.value)}
        className="mt-1 w-full rounded-md border border-paper/20 bg-navy-2/80 px-3 py-2 text-sm text-paper outline-none placeholder:text-mist"
        placeholder="Guest"
      />
    </label>
  );
}

function VisitorCount() {
  const n = usePresence((s) => s.peers.length);
  const connected = usePresence((s) => s.connected);
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-mist">
      <Users className="size-3" />
      {connected
        ? n === 0
          ? "Just you"
          : `${n} other${n === 1 ? "" : "s"} here`
        : "Solo floor"}
    </p>
  );
}

function StartOverlay({ onEnter }: { onEnter: () => void }) {
  const begin = () => {
    if (useExperience.getState().phase === "play") return;
    onEnter();
    if (!isCoarsePointer()) return;
    void (async () => {
      const ok = await Promise.race([
        requestOrientationPermission(),
        new Promise<boolean>((resolve) => {
          window.setTimeout(() => resolve(false), 600);
        }),
      ]);
      if (ok) useExperience.getState().setGyro(true);
    })();
  };
  return (
    <div
      data-ui
      className="pointer-events-auto absolute inset-0 z-50 flex flex-col justify-end md:justify-center"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/10 md:to-transparent" />
      <div className="relative z-10 max-w-xl px-6 pb-10 pt-16 md:px-12">
        <div className="flex items-center gap-3">
          <HouseMark className="h-10 w-11" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange">
            VR showroom
          </p>
        </div>
        <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
          ASHLEY
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-mist">
          Walk a full showroom — living, bedroom, dining, kitchen, kids, office,
          sleep, and patio — styled the way the floor is meant to be shopped.
          Tap any piece for the tag. Hunt the shelves for hidden coupons. Other
          visitors show up as shoppers on the floor.
        </p>
        <GuestNameField />
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              begin();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              begin();
            }}
            className="min-h-12 touch-manipulation rounded-md bg-orange px-6 py-3.5 text-sm font-semibold text-navy transition hover:bg-orange-dark"
          >
            Walk the floor
          </button>
          <VrLaunch className="rounded-md border border-paper/30 px-4 py-3.5 text-sm font-semibold text-paper transition hover:bg-navy-3" />
        </div>
        <p className="mt-4 text-xs text-mist">
          WASD or stick to walk · drag or tilt to look · scroll to zoom · click furniture
        </p>
      </div>
    </div>
  );
}

function TopBar({
  room,
  count,
}: {
  room: RoomId;
  count: number;
}) {
  const roomMeta = ROOMS.find((r) => r.id === room);
  return (
    <header
      data-ui
      className="pointer-events-auto absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 md:p-4"
    >
      <div className="flex items-center gap-3 rounded-lg bg-navy/80 px-3 py-2 shadow-lg backdrop-blur-sm">
        <HouseMark className="h-6 w-7" />
        <div>
          <p className="font-display text-lg font-semibold leading-none tracking-tight">
            ASHLEY
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-mist">
            <MapPin className="size-3" />
            {roomMeta?.label ?? "Gallery"}
          </p>
          <VisitorCount />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => useExperience.getState().openCatalog("map")}
          className="rounded-md bg-navy/80 p-2.5 text-paper backdrop-blur-sm md:hidden"
          aria-label="Floor plan"
        >
          <MapPin className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => useExperience.getState().openCatalog("shop")}
          className="rounded-md bg-navy/80 p-2.5 text-paper backdrop-blur-sm md:hidden"
          aria-label="Catalog"
        >
          <Search className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => useExperience.getState().openCatalog("map")}
          className="hidden rounded-md bg-navy/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-paper backdrop-blur-sm md:block"
        >
          Floor plan
        </button>
        <button
          type="button"
          onClick={() => useExperience.getState().openCatalog("shop")}
          className="hidden rounded-md bg-navy/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-paper backdrop-blur-sm md:block"
        >
          Catalog
        </button>
        <button
          type="button"
          onClick={() => useExperience.getState().toggleBag()}
          className="relative rounded-md bg-navy/80 p-2.5 text-paper backdrop-blur-sm"
          aria-label="Open bag"
        >
          <ShoppingBag className="size-5" />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1 text-[10px] font-semibold text-navy">
              {count}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}

function RoomRail({ room }: { room: RoomId }) {
  return (
    <nav
      data-ui
      className="pointer-events-auto absolute left-1/2 top-auto bottom-36 flex max-w-[70vw] -translate-x-1/2 gap-1 overflow-x-auto rounded-lg bg-navy/80 p-1 backdrop-blur-sm md:bottom-auto md:left-4 md:top-1/2 md:max-w-none md:w-auto md:-translate-x-0 md:-translate-y-1/2 md:flex-col"
    >
      {ROOMS.filter((r) => r.id !== "lot").map((r) => {
        const Icon = ROOM_ICON[r.id];
        const active = r.id === room;
        return (
          <button
            key={r.id}
            type="button"
            title={r.label}
            onClick={() =>
              useExperience.getState().requestTeleport(r.spawn[0], r.spawn[1])
            }
            className={cn(
              "flex min-w-11 items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium",
              active ? "bg-orange text-navy" : "text-paper hover:bg-navy-3",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="hidden md:inline">{r.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function HoverHint({ id }: { id: string }) {
  const product = PRODUCT_MAP[id];
  const coupon = isCouponId(id);
  const label = coupon
    ? "Hidden coupon"
    : (product?.name ?? (id === "welcome-desk" ? `${HOST_NAME} · greeter` : id));
  return (
    <div className="absolute bottom-36 left-1/2 z-10 -translate-x-1/2 rounded-md bg-navy/85 px-3 py-2 text-xs font-medium tracking-wide backdrop-blur-sm md:bottom-8">
      {label}
      <span className="text-mist">{coupon ? " · tap to claim" : " · tap to view"}</span>
    </div>
  );
}

function ToastHud() {
  const toast = useExperience((s) => s.toast);
  const toastKey = useExperience((s) => s.toastKey);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => useExperience.getState().clearToast(), 2500);
    return () => window.clearTimeout(t);
  }, [toast, toastKey]);
  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-navy shadow-xl">
      {toast}
    </div>
  );
}

function ProductSheet({ id }: { id: string }) {
  const close = () => useExperience.getState().select(null);
  if (id === "welcome-desk") return <HostMenu onClose={() => useExperience.getState().closeHostMenu()} />;
  const product = PRODUCT_MAP[id];
  if (!product) return null;
  const qty = useExperience((s) => s.bag[id] ?? 0);

  return (
    <aside
      data-ui
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 max-h-[78vh] overflow-auto rounded-xl bg-cream text-ink shadow-2xl md:inset-auto md:bottom-6 md:right-6 md:w-[24rem]"
    >
      <img
        src={productImage(product.id)}
        alt={product.name}
        className="h-36 w-full rounded-t-xl object-cover md:h-44"
      />
      <div className="p-5">
        <HeaderRow title={product.collection} onClose={close} kicker="Collection" />
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
          {product.name}
        </h2>
        <p className="mt-1 text-sm text-stone">
          {product.style} · {product.finish}
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-2xl font-semibold tabular-nums">{money(product.price)}</p>
          {product.was ? (
            <p className="text-sm text-mist line-through tabular-nums">
              {money(product.was)}
            </p>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone">{product.blurb}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              useExperience.getState().addToBag(product.id);
            }}
            className="flex-1 rounded-md bg-orange py-3 text-sm font-semibold text-navy"
          >
            {qty ? `Add another · ${qty} in bag` : "Add to bag"}
          </button>
        </div>
        <p className="mt-3 text-xs text-stone">Saved on this device until you clear the browser.</p>
      </div>
    </aside>
  );
}

function HeaderRow({
  title,
  kicker,
  onClose,
}: {
  title: string;
  kicker?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-dark">
            {kicker}
          </p>
        ) : null}
        <p className="font-medium">{title}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="grid size-11 place-items-center rounded-md text-stone hover:bg-line hover:text-ink"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

function BagPanel() {
  const bag = useExperience((s) => s.bag);
  const coupons = useExperience((s) => s.coupons);
  const items = Object.entries(bag)
    .map(([id, qty]) => ({ product: PRODUCT_MAP[id], qty }))
    .filter((x) => x.product);
  const total = items.reduce((n, x) => n + x.product.price * x.qty, 0);
  const off = couponOff(coupons);
  const discount = Math.round(total * off);
  const due = total - discount;

  const setQty = (id: string, qty: number) => {
    useExperience.getState().setQty(id, qty);
  };

  return (
    <aside
      data-ui
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 max-h-[78vh] overflow-auto rounded-xl bg-cream p-5 text-ink shadow-2xl md:inset-auto md:right-6 md:top-20 md:w-[24rem]"
    >
      <HeaderRow
        title="Your bag"
        kicker="Take-home list"
        onClose={() => useExperience.getState().toggleBag(false)}
      />
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-stone">
          Empty floor bag. Tap a sofa, bed, or table to add it.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {items.map(({ product, qty }) => (
            <li key={product.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-stone">{money(product.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-md border border-line"
                  onClick={() => setQty(product.id, qty - 1)}
                >
                  −
                </button>
                <span className="w-4 text-center text-sm tabular-nums">{qty}</span>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-md border border-line"
                  onClick={() => setQty(product.id, qty + 1)}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 space-y-1 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone">Estimated</p>
          <p className="text-sm tabular-nums text-stone">{money(total)}</p>
        </div>
        {off > 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-orange-dark">
              Showroom coupon −{Math.round(off * 100)}%
              {coupons.length > 1 ? ` · ${coupons.length} found` : ""}
              {total === 0 ? " ready" : ""}
            </p>
            {total > 0 ? (
              <p className="text-sm tabular-nums text-orange-dark">−{money(discount)}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-stone">Total</p>
          <p className="text-lg font-semibold tabular-nums">{money(due)}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-stone">
        Showroom preview only — prices follow typical Ashley collection ranges.
      </p>
    </aside>
  );
}

function HostHud() {
  const nearby = useExperience((s) => s.hostNearby);
  const ready = useExperience((s) => s.hostReady);
  const menu = useExperience((s) => s.hostMenuOpen);
  const lead = useExperience((s) => s.hostLead);
  const arrived = useExperience((s) => s.hostArrived);
  const selectedId = useExperience((s) => s.selectedId);
  const catalogOpen = useExperience((s) => s.catalogOpen);
  const bagOpen = useExperience((s) => s.bagOpen);
  if (catalogOpen || bagOpen) return null;

  if (lead) {
    return (
      <div
        data-ui
        className="pointer-events-auto absolute bottom-36 left-1/2 z-20 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl bg-navy/90 p-3 text-paper shadow-xl backdrop-blur-sm md:bottom-8"
      >
        <p className="text-sm font-medium">
          {HOST_NAME} is walking you to {lead.label}. Follow along.
        </p>
        <button
          type="button"
          className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange"
          onClick={() => {
            const last = lead.waypoints[lead.waypoints.length - 1];
            useExperience.getState().requestTeleport(last[0], last[1]);
            if (lead.productId) useExperience.getState().select(lead.productId);
            useExperience.getState().setHostArrived(lead.label);
          }}
        >
          Skip ahead
        </button>
      </div>
    );
  }

  if (arrived && !selectedId) {
    return (
      <div
        data-ui
        className="pointer-events-auto absolute bottom-36 left-1/2 z-20 -translate-x-1/2 rounded-md bg-navy/90 px-4 py-2 text-sm md:bottom-8"
      >
        Here we are — {arrived}.
        <button
          type="button"
          className="ml-3 text-xs font-semibold uppercase tracking-[0.12em] text-orange"
          onClick={() => useExperience.getState().setHostArrived(null)}
        >
          Thanks
        </button>
      </div>
    );
  }

  if ((nearby || ready) && !menu && !selectedId) {
    return (
      <button
        data-ui
        type="button"
        onClick={() => useExperience.getState().openHostMenu()}
        className="pointer-events-auto absolute bottom-36 left-1/2 z-20 -translate-x-1/2 rounded-full bg-orange px-4 py-2 text-sm font-semibold text-navy shadow-lg md:bottom-8"
      >
        {ready ? `${HOST_NAME}: Welcome in — need a hand?` : `${HOST_NAME} is heading over…`}
      </button>
    );
  }

  return null;
}

function HostMenu({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"floor" | "shop">("floor");
  return (
    <aside
      data-ui
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 max-h-[78vh] overflow-auto rounded-xl bg-cream p-5 text-ink shadow-2xl md:inset-auto md:bottom-6 md:right-6 md:w-[24rem]"
    >
      <HeaderRow title={HOST_NAME} kicker="Your greeter" onClose={onClose} />
      <p className="mt-3 text-sm leading-relaxed text-stone">
        Welcome to Ashley — I'm {HOST_NAME}. I can walk you to a gallery or a
        piece on the floor. Just pick one.
      </p>
      <div className="mt-4 flex gap-1 rounded-md bg-line p-1">
        <button
          type="button"
          onClick={() => setTab("floor")}
          className={cn(
            "flex-1 rounded px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
            tab === "floor" ? "bg-paper text-navy shadow-sm" : "text-stone",
          )}
        >
          Galleries
        </button>
        <button
          type="button"
          onClick={() => setTab("shop")}
          className={cn(
            "flex-1 rounded px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
            tab === "shop" ? "bg-paper text-navy shadow-sm" : "text-stone",
          )}
        >
          Products
        </button>
      </div>
      {tab === "floor" ? (
        <ul className="mt-3 space-y-1">
          {ROOMS.filter((r) => r.id !== "lobby" && r.id !== "lot").map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  const lead = leadToRoom(r.id);
                  if (lead) useExperience.getState().startHostLead(lead);
                }}
                className="flex w-full items-center justify-between rounded-md px-2 py-2.5 text-left hover:bg-paper"
              >
                <span>
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="text-xs text-stone">{r.hint}</span>
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-dark">
                  Walk me
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 max-h-72 space-y-1 overflow-auto">
          {PRODUCTS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  const lead = leadToProduct(p.id, p.name);
                  if (lead) useExperience.getState().startHostLead(lead);
                }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-paper"
              >
                <img src={productImage(p.id)} alt="" className="h-10 w-14 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-dark">
                  Walk me
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-md border border-line py-2.5 text-sm font-medium text-stone"
      >
        I'll browse on my own
      </button>
    </aside>
  );
}

function jumpToProduct(id: string) {
  const place = firstPlacement(id);
  if (place) {
    const [x, z] = standNear(place);
    useExperience.getState().requestTeleport(x, z);
  } else {
    const product = PRODUCT_MAP[id];
    const spawn = ROOMS.find((r) => r.id === product?.room)?.spawn ?? [0, 12];
    useExperience.getState().requestTeleport(spawn[0], spawn[1]);
  }
  useExperience.getState().select(id);
}

function CatalogPanel() {
  const view = useExperience((s) => s.catalogView);
  const room = useExperience((s) => s.room);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoomId | "all">("all");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (filter !== "all" && p.room !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.collection.toLowerCase().includes(q) ||
        p.style.toLowerCase().includes(q) ||
        p.finish.toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  return (
    <aside
      data-ui
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 max-h-[78vh] overflow-auto rounded-xl bg-cream p-5 text-ink shadow-2xl md:inset-auto md:left-24 md:top-20 md:w-[30rem]"
    >
      <HeaderRow
        title={view === "map" ? "Floor plan" : "Catalog"}
        kicker={view === "map" ? "Jump a gallery" : "Shop the floor"}
        onClose={() => useExperience.getState().toggleCatalog(false)}
      />
      <div className="mt-3 flex gap-1 rounded-md bg-line p-1">
        <button
          type="button"
          onClick={() => useExperience.getState().setCatalogView("map")}
          className={cn(
            "flex-1 rounded px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
            view === "map" ? "bg-paper text-navy shadow-sm" : "text-stone",
          )}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => useExperience.getState().setCatalogView("shop")}
          className={cn(
            "flex-1 rounded px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
            view === "shop" ? "bg-paper text-navy shadow-sm" : "text-stone",
          )}
        >
          Shop
        </button>
      </div>

      {view === "map" ? (
        <>
          <FloorPlanSvg current={room} interactive />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {ROOMS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => useExperience.getState().requestTeleport(r.spawn[0], r.spawn[1])}
                className={cn(
                  "rounded-md border px-3 py-3 text-left",
                  r.id === room ? "border-orange bg-paper" : "border-line bg-paper",
                )}
              >
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-stone">{r.hint}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <label className="mt-4 flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2">
            <Search className="size-4 text-stone" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sofas, beds, desks…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-mist"
            />
          </label>
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterChip>
            {ROOMS.filter((r) => r.id !== "lobby" && r.id !== "lot").map((r) => (
              <FilterChip
                key={r.id}
                active={filter === r.id}
                onClick={() => setFilter(r.id)}
              >
                {r.label}
              </FilterChip>
            ))}
          </div>
          <ul className="mt-3 space-y-1">
            {items.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => jumpToProduct(p.id)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-paper"
                >
                  <img
                    src={productImage(p.id)}
                    alt=""
                    className="h-12 w-16 shrink-0 rounded object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-stone">
                      {ROOMS.find((r) => r.id === p.room)?.label} · {p.collection}
                    </span>
                  </span>
                  <span className="text-xs tabular-nums text-stone">{money(p.price)}</span>
                </button>
              </li>
            ))}
            {items.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-stone">No pieces match.</li>
            ) : null}
          </ul>
        </>
      )}
    </aside>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
        active ? "bg-navy text-paper" : "bg-paper text-stone",
      )}
    >
      {children}
    </button>
  );
}

const PLAN_ROOMS: { id: RoomId; x: number; y: number; w: number; h: number }[] = [
  { id: "patio", x: 22, y: 2, w: 56, h: 14 },
  { id: "kitchen", x: 2, y: 18, w: 16, h: 38 },
  { id: "dining", x: 18, y: 18, w: 24, h: 19 },
  { id: "sleep", x: 58, y: 18, w: 24, h: 19 },
  { id: "office", x: 82, y: 18, w: 16, h: 19 },
  { id: "living", x: 18, y: 37, w: 24, h: 19 },
  { id: "bedroom", x: 58, y: 37, w: 24, h: 19 },
  { id: "kids", x: 82, y: 37, w: 16, h: 19 },
  { id: "lobby", x: 18, y: 56, w: 64, h: 18 },
  { id: "lot", x: 26, y: 76, w: 48, h: 20 },
];

function FloorPlanSvg({ current, interactive = false }: { current: RoomId; interactive?: boolean }) {
  const px = useExperience((s) => s.px);
  const pz = useExperience((s) => s.pz);
  const youX = ((px + 26.15) / 52.3) * 100;
  const youY = ((pz + 30.15) / 60.65) * 100;

  return (
    <svg viewBox="0 0 100 100" className="mt-4 w-full rounded-md bg-navy text-[4px]">
      {PLAN_ROOMS.map((r) => (
        <g
          key={r.id}
          className={interactive ? "cursor-pointer" : undefined}
          onClick={
            interactive
              ? () => {
                  const spawn = ROOMS.find((x) => x.id === r.id)?.spawn;
                  if (spawn) useExperience.getState().requestTeleport(spawn[0], spawn[1]);
                }
              : undefined
          }
        >
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx={1.2}
            fill={r.id === current ? "#f48120" : "#2e3d52"}
            stroke="#f4efe6"
            strokeWidth={0.4}
          />
          <text
            x={r.x + r.w / 2}
            y={r.y + r.h / 2 + 1.2}
            textAnchor="middle"
            fill={r.id === current ? "#1b2634" : "#f4efe6"}
            fontSize="3.2"
            fontWeight={600}
          >
            {ROOMS.find((x) => x.id === r.id)?.label}
          </text>
        </g>
      ))}
      <circle cx={youX} cy={youY} r={1.6} fill="#f4efe6" stroke="#1b2634" strokeWidth={0.4} />
    </svg>
  );
}

function VrLaunch({
  icon = false,
  className,
}: {
  icon?: boolean;
  className?: string;
}) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const xr = navigator.xr;
    if (!xr?.isSessionSupported) return;
    let alive = true;
    xr.isSessionSupported("immersive-vr")
      .then((v) => {
        if (alive) setOk(v);
      })
      .catch(() => {
        if (alive) setOk(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  if (!ok) return null;
  const launch = () => {
    if (useExperience.getState().phase !== "play") useExperience.getState().enter();
    void xrStore.enterVR();
  };
  if (icon) {
    return (
      <button
        type="button"
        title="Enter VR"
        aria-label="Enter VR"
        onClick={launch}
        className="grid size-10 place-items-center rounded-md text-paper hover:bg-navy-3"
      >
        <Headset className="size-4" />
      </button>
    );
  }
  return (
    <button type="button" onClick={launch} className={className}>
      Enter VR
    </button>
  );
}

function MuteToggle() {
  const muted = useExperience((s) => s.muted);
  return (
    <button
      type="button"
      title={muted ? "Unmute" : "Mute"}
      aria-label={muted ? "Unmute" : "Mute"}
      onClick={() => {
        useExperience.getState().toggleMute();
        const next = useExperience.getState().muted;
        setMuted(next);
        if (!next) resumeAudio();
      }}
      className={cn(
        "grid size-10 place-items-center rounded-md",
        muted ? "text-paper hover:bg-navy-3" : "bg-orange text-navy",
      )}
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </button>
  );
}

function GyroToggle() {
  const gyro = useExperience((s) => s.gyro);
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(isCoarsePointer());
  }, []);
  if (!touch && !gyro) return null;
  return (
    <button
      type="button"
      title="Tilt to look"
      aria-label="Tilt to look"
      onClick={() => {
        void (async () => {
          if (!useExperience.getState().gyro) {
            const ok = await requestOrientationPermission();
            if (!ok) return;
            useExperience.getState().setGyro(true);
          } else {
            useExperience.getState().setGyro(false);
          }
        })();
      }}
      className={cn(
        "grid size-10 place-items-center rounded-md",
        gyro ? "bg-orange text-navy" : "text-paper hover:bg-navy-3",
      )}
    >
      <Compass className="size-4" />
    </button>
  );
}

function HelpHint() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(isCoarsePointer());
  }, []);
  if (touch) return null;
  return (
    <p className="pointer-events-none absolute bottom-3 left-3 hidden max-w-[22rem] text-[11px] uppercase tracking-[0.16em] text-paper/80 md:block">
      WASD walk · scroll zoom · E talk · B bag · M map · G catalog · C camera · L dusk
    </p>
  );
}

function ViewControls() {
  const dusk = useExperience((s) => s.dusk);
  const firstPerson = useExperience((s) => s.firstPerson);
  const camDist = useExperience((s) => s.camDist);
  return (
    <div
      data-ui
      className="pointer-events-auto absolute bottom-6 right-3 flex flex-col items-end gap-2 md:bottom-8 md:right-5"
    >
      <div className="flex gap-1 rounded-lg bg-navy/80 p-1 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Zoom out"
          className="grid size-10 place-items-center rounded-md text-paper hover:bg-navy-3"
          onClick={() => useExperience.getState().nudgeZoom(1.1)}
        >
          <ZoomOut className="size-4" />
        </button>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={0.1}
          value={firstPerson ? ZOOM_MIN : camDist}
          onChange={(e) => useExperience.getState().setZoom(Number(e.target.value))}
          className="w-16 accent-orange"
          aria-label="Zoom"
        />
        <button
          type="button"
          aria-label="Zoom in"
          className="grid size-10 place-items-center rounded-md text-paper hover:bg-navy-3"
          onClick={() => useExperience.getState().nudgeZoom(-1.1)}
        >
          <ZoomIn className="size-4" />
        </button>
      </div>
      <div className="flex gap-1 rounded-lg bg-navy/80 p-1 backdrop-blur-sm">
        <button
          type="button"
          title="First person (C)"
          aria-label="Toggle first person"
          onClick={() => useExperience.getState().toggleFirstPerson()}
          className={cn(
            "grid size-10 place-items-center rounded-md",
            firstPerson ? "bg-orange text-navy" : "text-paper hover:bg-navy-3",
          )}
        >
          <Eye className="size-4" />
        </button>
        <MuteToggle />
        <GyroToggle />
        <VrLaunch icon />
        <button
          type="button"
          title="Evening light (L)"
          aria-label="Toggle evening light"
          onClick={() => useExperience.getState().toggleDusk()}
          className={cn(
            "grid size-10 place-items-center rounded-md",
            dusk ? "bg-orange text-navy" : "text-paper hover:bg-navy-3",
          )}
        >
          {dusk ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function MiniMap() {
  const room = useExperience((s) => s.room);
  const catalogOpen = useExperience((s) => s.catalogOpen);
  if (catalogOpen) return null;
  return (
    <button
      data-ui
      type="button"
      aria-label="Open floor plan"
      onClick={() => useExperience.getState().openCatalog("map")}
      className="pointer-events-auto absolute bottom-36 right-4 hidden w-36 overflow-hidden rounded-lg border border-paper/20 bg-navy/80 p-1 backdrop-blur-sm md:block md:bottom-44"
    >
      <FloorPlanSvg current={room} />
    </button>
  );
}

function Joystick() {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const [show, setShow] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const upd = () => setShow(mq.matches || navigator.maxTouchPoints > 0);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  useEffect(() => {
    const max = 52;
    const apply = (cx: number, cy: number) => {
      const o = origin.current;
      if (!o) return;
      let dx = cx - o.x;
      let dy = cy - o.y;
      const len = Math.hypot(dx, dy);
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      setKnob({ x: dx, y: dy });
      useExperience.getState().setJoy(dx / max, dy / max);
    };
    const onMove = (e: PointerEvent) => {
      if (!origin.current || e.pointerId !== origin.current.id) return;
      e.preventDefault();
      e.stopPropagation();
      apply(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (!origin.current || e.pointerId !== origin.current.id) return;
      origin.current = null;
      setStickPointer(null);
      setKnob({ x: 0, y: 0 });
      useExperience.getState().setJoy(0, 0);
    };
    window.addEventListener("pointermove", onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onUp, { capture: true });
    window.addEventListener("pointercancel", onUp, { capture: true });
    return () => {
      window.removeEventListener("pointermove", onMove, { capture: true });
      window.removeEventListener("pointerup", onUp, { capture: true });
      window.removeEventListener("pointercancel", onUp, { capture: true });
    };
  }, []);

  if (!show) return null;

  return (
    <div
      data-ui
      className="pointer-events-auto absolute bottom-6 left-4 z-40 touch-none select-none md:bottom-8"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        setStickPointer(e.pointerId);
        setKnob({ x: 0, y: 0 });
        useExperience.getState().setJoy(0, 0);
      }}
    >
      <div className="relative size-36 rounded-full border-2 border-paper/40 bg-navy/70 shadow-xl">
        <div
          className="absolute left-1/2 top-1/2 size-16 rounded-full bg-paper shadow-md"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
      <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-paper/70">
        Walk
      </p>
    </div>
  );
}
