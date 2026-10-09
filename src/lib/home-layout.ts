import { PRODUCT_MAP } from "./catalog";
import { INCH, pieceAabb, type DoorWall } from "./room-fit";

/** Meters of air between two floor edges. The shared wall sits in this gap. */
export const WALL_GAP = 0.08;

const SIDES: DoorWall[] = ["e", "w", "n", "s"];

export type RoomJoin = { to: string; side: DoorWall };

/** The fields the floor plan needs. Items stay in room-local meters. */
export type LayoutRoom = {
  id: string;
  widthIn: number;
  lengthIn: number;
  doorWall: DoorWall;
  doorOffsetIn: number;
  doorWidthIn: number;
  join?: RoomJoin;
  items: { uid: string; productId: string; x: number; z: number; rot: number }[];
};

export type RoomOrigin = {
  id: string;
  x: number;
  z: number;
  width: number;
  length: number;
};

export type HomeOpening = {
  roomId: string;
  wall: DoorWall;
  /** Meters from the room center along the wall. +X on north/south, +Z on east/west. */
  center: number;
  width: number;
};

export type HomeBox = { minX: number; maxX: number; minZ: number; maxZ: number };

export function oppositeWall(side: DoorWall): DoorWall {
  if (side === "e") return "w";
  if (side === "w") return "e";
  if (side === "n") return "s";
  return "n";
}

/**
 * Ground-plane screen axis to a wall. +X is east, +Z is north.
 * Pass the camera's screen-right or screen-up column with Y removed.
 */
export function wallOnScreenAxis(x: number, z: number): DoorWall {
  if (Math.abs(x) >= Math.abs(z)) return x >= 0 ? "e" : "w";
  return z >= 0 ? "n" : "s";
}

/** First open side of the active room, clockwise from the east. */
export function nextJoin(plans: { id: string; join?: RoomJoin }[], activeId: string): RoomJoin {
  for (const side of SIDES) {
    const taken = plans.some((plan) => plan.join?.to === activeId && plan.join.side === side);
    if (!taken) return { to: activeId, side };
  }
  return { to: activeId, side: "e" };
}

function meters(plan: Pick<LayoutRoom, "widthIn" | "lengthIn">) {
  return { w: plan.widthIn * INCH, l: plan.lengthIn * INCH };
}

function floorsOverlap(a: RoomOrigin, b: RoomOrigin) {
  return (
    Math.abs(a.x - b.x) < (a.width + b.width) / 2 + WALL_GAP - 0.02 &&
    Math.abs(a.z - b.z) < (a.length + b.length) / 2 + WALL_GAP - 0.02
  );
}

function beside(parent: RoomOrigin, w: number, l: number, side: DoorWall, along: number) {
  if (side === "e") return { x: parent.x + parent.width / 2 + WALL_GAP + w / 2, z: parent.z + along };
  if (side === "w") return { x: parent.x - parent.width / 2 - WALL_GAP - w / 2, z: parent.z + along };
  if (side === "n") return { x: parent.x + along, z: parent.z + parent.length / 2 + WALL_GAP + l / 2 };
  return { x: parent.x + along, z: parent.z - parent.length / 2 - WALL_GAP - l / 2 };
}

function slotBeside(parent: RoomOrigin, w: number, l: number, side: DoorWall, placed: RoomOrigin[]) {
  const alongSpan = side === "e" || side === "w" ? l : w;
  const parentSpan = side === "e" || side === "w" ? parent.length : parent.width;
  const limit = parentSpan / 2 + alongSpan / 2 + 6;
  for (let shift = 0; shift <= limit; shift += 0.25) {
    const signs = shift === 0 ? [0] : [1, -1];
    for (const sign of signs) {
      const spot = beside(parent, w, l, side, sign * shift);
      const candidate: RoomOrigin = { id: "_", x: spot.x, z: spot.z, width: w, length: l };
      if (!placed.some((room) => floorsOverlap(candidate, room))) return spot;
    }
  }
  return beside(parent, w, l, side, limit);
}

/**
 * Place every room on one floor. A room with a join sits against that side of
 * its parent. Older saved rooms with no join line up to the east, in order.
 */
export function layoutHome(plans: LayoutRoom[]): RoomOrigin[] {
  const placed: RoomOrigin[] = [];
  const byId = new Map<string, RoomOrigin>();
  plans.forEach((plan, index) => {
    const { w, l } = meters(plan);
    let join = plan.join && byId.has(plan.join.to) ? plan.join : undefined;
    if (!join && index > 0) join = { to: plans[index - 1].id, side: "e" };
    const parent = join ? byId.get(join.to) : undefined;
    const spot = parent ? slotBeside(parent, w, l, join!.side, placed) : { x: 0, z: 0 };
    const origin: RoomOrigin = { id: plan.id, x: spot.x, z: spot.z, width: w, length: l };
    placed.push(origin);
    byId.set(plan.id, origin);
  });
  return placed;
}

export function homeBounds(layout: RoomOrigin[]) {
  let minX = 0;
  let maxX = 0;
  let minZ = 0;
  let maxZ = 0;
  for (const room of layout) {
    minX = Math.min(minX, room.x - room.width / 2);
    maxX = Math.max(maxX, room.x + room.width / 2);
    minZ = Math.min(minZ, room.z - room.length / 2);
    maxZ = Math.max(maxZ, room.z + room.length / 2);
  }
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
    span: Math.max(maxX - minX, maxZ - minZ, 1),
  };
}

/** Solid runs of a wall after door gaps are cut out. `center` matches HomeOpening. */
export function spanSegments(span: number, gaps: { center: number; width: number }[]) {
  if (gaps.length === 0) return [{ center: 0, length: span }];
  const cuts = gaps
    .map((gap) => ({ a: gap.center - gap.width / 2, b: gap.center + gap.width / 2 }))
    .filter((gap) => gap.b - gap.a > 0.02)
    .sort((p, q) => p.a - q.a);
  const parts: { center: number; length: number }[] = [];
  let cursor = -span / 2;
  for (const cut of cuts) {
    const a = Math.max(cut.a, -span / 2);
    const b = Math.min(cut.b, span / 2);
    if (a - cursor > 0.04) parts.push({ center: (cursor + a) / 2, length: a - cursor });
    cursor = Math.max(cursor, b);
  }
  if (span / 2 - cursor > 0.04) parts.push({ center: (cursor + span / 2) / 2, length: span / 2 - cursor });
  return parts;
}

function passage(parent: RoomOrigin, child: RoomOrigin, side: DoorWall): { center: number; width: number } | null {
  const vertical = side === "e" || side === "w";
  const parent0 = (vertical ? parent.z : parent.x) - (vertical ? parent.length : parent.width) / 2;
  const parent1 = (vertical ? parent.z : parent.x) + (vertical ? parent.length : parent.width) / 2;
  const child0 = (vertical ? child.z : child.x) - (vertical ? child.length : child.width) / 2;
  const child1 = (vertical ? child.z : child.x) + (vertical ? child.length : child.width) / 2;
  const lo = Math.max(parent0, child0);
  const hi = Math.min(parent1, child1);
  const overlap = hi - lo;
  if (overlap < 0.85) return null;
  const width = Math.min(36 * INCH, overlap - 0.24);
  const mid = (lo + hi) / 2;
  const origin = vertical ? parent.z : parent.x;
  return { center: mid - origin, width };
}

/**
 * Stretch of this room's shared wall that the parent already draws.
 * A longer room still draws the parts of that wall the parent does not cover.
 */
export function sharedCover(
  plan: LayoutRoom,
  origin: RoomOrigin,
  layout: RoomOrigin[],
): { wall: DoorWall; center: number; width: number } | null {
  if (!plan.join) return null;
  const parent = layout.find((room) => room.id === plan.join?.to);
  if (!parent) return null;
  const side = plan.join.side;
  const vertical = side === "e" || side === "w";
  const parent0 = (vertical ? parent.z : parent.x) - (vertical ? parent.length : parent.width) / 2;
  const parent1 = (vertical ? parent.z : parent.x) + (vertical ? parent.length : parent.width) / 2;
  const child0 = (vertical ? origin.z : origin.x) - (vertical ? origin.length : origin.width) / 2;
  const child1 = (vertical ? origin.z : origin.x) + (vertical ? origin.length : origin.width) / 2;
  const lo = Math.max(parent0, child0);
  const hi = Math.min(parent1, child1);
  if (hi - lo <= 0.02) return null;
  const along = vertical ? origin.z : origin.x;
  return { wall: oppositeWall(side), center: (lo + hi) / 2 - along, width: hi - lo };
}

export function roomOpenings(plan: LayoutRoom, origin: RoomOrigin, plans: LayoutRoom[], layout: RoomOrigin[]): HomeOpening[] {
  const openings: HomeOpening[] = [
    {
      roomId: plan.id,
      wall: plan.doorWall,
      center: plan.doorOffsetIn * INCH,
      width: Math.max(28, plan.doorWidthIn) * INCH,
    },
  ];
  for (const child of plans) {
    if (child.join?.to !== plan.id) continue;
    const childOrigin = layout.find((room) => room.id === child.id);
    if (!childOrigin) continue;
    const gap = passage(origin, childOrigin, child.join.side);
    if (!gap) continue;
    openings.push({ roomId: plan.id, wall: child.join.side, center: gap.center, width: gap.width });
  }
  return openings;
}

/**
 * Door the fit check should keep clear. A joined room uses the shared passage,
 * expressed in that room's own coordinates.
 */
export function fitDoor(plan: LayoutRoom, origin: RoomOrigin, plans: LayoutRoom[], layout: RoomOrigin[]) {
  if (plan.join) {
    const parent = layout.find((room) => room.id === plan.join?.to);
    if (parent) {
      const gap = passage(parent, origin, plan.join.side);
      if (gap) {
        const vertical = plan.join.side === "e" || plan.join.side === "w";
        const world = (vertical ? parent.z : parent.x) + gap.center;
        const center = world - (vertical ? origin.z : origin.x);
        return {
          wall: oppositeWall(plan.join.side),
          offsetIn: center / INCH,
          widthIn: gap.width / INCH,
        };
      }
    }
  }
  return { wall: plan.doorWall, offsetIn: plan.doorOffsetIn, widthIn: plan.doorWidthIn };
}

function wallBoxes(origin: RoomOrigin, wall: DoorWall, gaps: { center: number; width: number }[]): HomeBox[] {
  const along = wall === "n" || wall === "s" ? origin.width : origin.length;
  const parts = spanSegments(along, gaps);
  const half = 0.04;
  return parts.map((seg) => {
    if (wall === "n" || wall === "s") {
      const z = origin.z + (wall === "n" ? origin.length / 2 + 0.04 : -origin.length / 2 - 0.04);
      const cx = origin.x + seg.center;
      return { minX: cx - seg.length / 2, maxX: cx + seg.length / 2, minZ: z - half, maxZ: z + half };
    }
    const x = origin.x + (wall === "e" ? origin.width / 2 + 0.04 : -origin.width / 2 - 0.04);
    const cz = origin.z + seg.center;
    return { minX: x - half, maxX: x + half, minZ: cz - seg.length / 2, maxZ: cz + seg.length / 2 };
  });
}

/** Walls and furniture, in world meters. The walker expands these by its radius. */
export function homeColliders(plans: LayoutRoom[], layout: RoomOrigin[]): HomeBox[] {
  const boxes: HomeBox[] = [];
  for (const plan of plans) {
    const origin = layout.find((room) => room.id === plan.id);
    if (!origin) continue;
    const openings = roomOpenings(plan, origin, plans, layout);
    const cover = sharedCover(plan, origin, layout);
    for (const wall of SIDES) {
      const gaps = openings
        .filter((opening) => opening.wall === wall)
        .map((opening) => ({ center: opening.center, width: opening.width }));
      if (cover?.wall === wall) gaps.push({ center: cover.center, width: cover.width });
      boxes.push(...wallBoxes(origin, wall, gaps));
    }
    for (const item of plan.items) {
      const product = PRODUCT_MAP[item.productId];
      if (!product) continue;
      const box = pieceAabb({ uid: item.uid, x: item.x, z: item.z, rot: item.rot, size: product.size });
      boxes.push({
        minX: box.minX + origin.x,
        maxX: box.maxX + origin.x,
        minZ: box.minZ + origin.z,
        maxZ: box.maxZ + origin.z,
      });
    }
  }
  return boxes;
}

/**
 * Stand just inside the front door, looking into the room.
 * yaw 0 looks toward world −Z, matching the showroom walker.
 */
export function walkSpawn(plan: LayoutRoom, origin: RoomOrigin) {
  const door = plan.doorOffsetIn * INCH;
  const inset = 0.75;
  if (plan.doorWall === "s") return { x: origin.x + door, z: origin.z - origin.length / 2 + inset, yaw: Math.PI };
  if (plan.doorWall === "n") return { x: origin.x + door, z: origin.z + origin.length / 2 - inset, yaw: 0 };
  if (plan.doorWall === "w") return { x: origin.x - origin.width / 2 + inset, z: origin.z + door, yaw: -Math.PI / 2 };
  return { x: origin.x + origin.width / 2 - inset, z: origin.z + door, yaw: Math.PI / 2 };
}

export type RoomRect = { minX: number; maxX: number; minZ: number; maxZ: number };

/** Floor area the walk camera may occupy. Inset so the lens stays off the walls. */
export function roomInteriors(layout: RoomOrigin[], margin = 0.42): RoomRect[] {
  return layout.map((room) => {
    const inset = Math.min(margin, room.width * 0.22, room.length * 0.22);
    return {
      minX: room.x - room.width / 2 + inset,
      maxX: room.x + room.width / 2 - inset,
      minZ: room.z - room.length / 2 + inset,
      maxZ: room.z + room.length / 2 - inset,
    };
  });
}

function insideRooms(x: number, z: number, rooms: RoomRect[]) {
  return rooms.some((room) => x >= room.minX && x <= room.maxX && z >= room.minZ && z <= room.maxZ);
}

/**
 * How far behind the walker the camera can sit before it leaves the home.
 * `fx, fz` is the walker's forward. The camera is placed at walker − forward × pull.
 */
export function chasePull(x: number, z: number, fx: number, fz: number, dist: number, rooms: RoomRect[]) {
  const max = Math.max(0.15, dist);
  const at = (t: number) => ({ x: x - fx * t, z: z - fz * t });
  if (insideRooms(at(max).x, at(max).z, rooms)) return max;
  let lo = 0.15;
  let hi = max;
  if (!insideRooms(at(lo).x, at(lo).z, rooms)) return lo;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (insideRooms(at(mid).x, at(mid).z, rooms)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** Eye height. Distance the walls block is spent climbing, so zoom-out shows the rooms. */
export function chaseHeight(dist: number, pull: number) {
  const blocked = Math.max(0, dist - pull);
  return 1.35 + pull * 0.38 + blocked * 0.9;
}
