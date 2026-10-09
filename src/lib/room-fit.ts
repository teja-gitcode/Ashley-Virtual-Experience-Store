/** Inch sizes and room-fit checks. 1 three.js unit = 1 meter. Local −Z is the back. */

export const INCH = 0.0254;

export type SizeIn = { w: number; d: number; h: number };

export type DoorWall = "n" | "s" | "e" | "w";

export type FitItem = {
  uid: string;
  x: number;
  z: number;
  rot: number;
  size: SizeIn;
};

export type FitRoom = {
  widthIn: number;
  lengthIn: number;
  heightIn: number;
  doorWall: DoorWall;
  doorOffsetIn: number;
  doorWidthIn: number;
  /** Passages into neighboring rooms, in addition to the front door. */
  extraDoors?: { wall: DoorWall; offsetIn: number; widthIn: number }[];
};

export type Aabb = { minX: number; maxX: number; minZ: number; maxZ: number };

export type FitIssue = {
  uid: string;
  kind: "outside" | "overlap" | "ceiling" | "door";
  with?: string;
};

export type FitReport = {
  issues: FitIssue[];
  fits: boolean;
  occupiedSqFt: number;
  roomSqFt: number;
  pieceSqFt: Record<string, number>;
};

export function formatInches(n: number) {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(Math.round(n));
  const ft = Math.floor(a / 12);
  const inch = a % 12;
  if (ft === 0) return `${sign}${inch} in`;
  if (inch === 0) return `${sign}${ft} ft`;
  return `${sign}${ft} ft ${inch} in`;
}

export function floorSqFt(size: SizeIn) {
  return (size.w * size.d) / 144;
}

/** World AABB of a piece. Matches the showroom collider: |cos|·W + |sin|·D. */
export function pieceAabb(item: FitItem): Aabb {
  const c = Math.abs(Math.cos(item.rot));
  const s = Math.abs(Math.sin(item.rot));
  const w = item.size.w * INCH;
  const d = item.size.d * INCH;
  const hw = (c * w + s * d) / 2;
  const hd = (s * w + c * d) / 2;
  return {
    minX: item.x - hw,
    maxX: item.x + hw,
    minZ: item.z - hd,
    maxZ: item.z + hd,
  };
}

export function roomAabb(room: FitRoom): Aabb {
  const hw = (room.widthIn * INCH) / 2;
  const hd = (room.lengthIn * INCH) / 2;
  return { minX: -hw, maxX: hw, minZ: -hd, maxZ: hd };
}

function overlaps(a: Aabb, b: Aabb) {
  return a.minX < b.maxX - 1e-4 && a.maxX > b.minX + 1e-4 && a.minZ < b.maxZ - 1e-4 && a.maxZ > b.minZ + 1e-4;
}

function contains(room: Aabb, piece: Aabb) {
  return (
    piece.minX >= room.minX - 1e-3 &&
    piece.maxX <= room.maxX + 1e-3 &&
    piece.minZ >= room.minZ - 1e-3 &&
    piece.maxZ <= room.maxZ + 1e-3
  );
}

/** 36 in of clear floor in front of one opening. */
export function openingPath(room: FitRoom, wall: DoorWall, offsetIn: number, widthIn: number): Aabb {
  const W = room.widthIn * INCH;
  const L = room.lengthIn * INCH;
  const dw = Math.max(24, widthIn) * INCH;
  const path = 36 * INCH;
  const along = wall === "n" || wall === "s" ? W : L;
  const maxOff = Math.max(0, along / 2 - dw / 2);
  const o = Math.max(-maxOff, Math.min(maxOff, offsetIn * INCH));
  switch (wall) {
    case "s":
      return { minX: o - dw / 2, maxX: o + dw / 2, minZ: -L / 2, maxZ: -L / 2 + path };
    case "n":
      return { minX: o - dw / 2, maxX: o + dw / 2, minZ: L / 2 - path, maxZ: L / 2 };
    case "w":
      return { minX: -W / 2, maxX: -W / 2 + path, minZ: o - dw / 2, maxZ: o + dw / 2 };
    case "e":
      return { minX: W / 2 - path, maxX: W / 2, minZ: o - dw / 2, maxZ: o + dw / 2 };
  }
}

/** 36 in of clear floor in front of the door opening. */
export function doorPath(room: FitRoom): Aabb {
  return openingPath(room, room.doorWall, room.doorOffsetIn, room.doorWidthIn);
}

function occupiedSqFt(room: FitRoom, items: FitItem[]) {
  const cols = Math.max(1, Math.round(room.widthIn));
  const rows = Math.max(1, Math.round(room.lengthIn));
  const grid = new Uint8Array(cols * rows);
  for (const item of items) {
    const box = pieceAabb(item);
    let x0 = Math.floor(box.minX / INCH + room.widthIn / 2);
    let x1 = Math.ceil(box.maxX / INCH + room.widthIn / 2);
    let z0 = Math.floor(box.minZ / INCH + room.lengthIn / 2);
    let z1 = Math.ceil(box.maxZ / INCH + room.lengthIn / 2);
    x0 = Math.max(0, x0);
    x1 = Math.min(cols, x1);
    z0 = Math.max(0, z0);
    z1 = Math.min(rows, z1);
    for (let z = z0; z < z1; z++) {
      for (let x = x0; x < x1; x++) grid[z * cols + x] = 1;
    }
  }
  let n = 0;
  for (const v of grid) n += v;
  return n / 144;
}

export function assessRoom(room: FitRoom, items: FitItem[]): FitReport {
  const bounds = roomAabb(room);
  const doors = [
    doorPath(room),
    ...(room.extraDoors ?? []).map((door) => openingPath(room, door.wall, door.offsetIn, door.widthIn)),
  ];
  const issues: FitIssue[] = [];
  const pieceSqFt: Record<string, number> = {};
  items.forEach((item, i) => {
    pieceSqFt[item.uid] = floorSqFt(item.size);
    const box = pieceAabb(item);
    if (!contains(bounds, box)) issues.push({ uid: item.uid, kind: "outside" });
    if (item.size.h > room.heightIn + 0.5) issues.push({ uid: item.uid, kind: "ceiling" });
    if (doors.some((door) => overlaps(box, door))) issues.push({ uid: item.uid, kind: "door" });
    for (let j = i + 1; j < items.length; j++) {
      const other = items[j];
      if (overlaps(box, pieceAabb(other))) {
        issues.push({ uid: item.uid, kind: "overlap", with: other.uid });
        issues.push({ uid: other.uid, kind: "overlap", with: item.uid });
      }
    }
  });
  return {
    issues,
    fits: issues.length === 0,
    occupiedSqFt: occupiedSqFt(room, items),
    roomSqFt: (room.widthIn * room.lengthIn) / 144,
    pieceSqFt,
  };
}

/**
 * If the back face (−Z) is within maxGapM of a wall, plant the back on that wall.
 * rot 0 backs onto −Z (south). Returns null when the piece cannot sit fully inside.
 */
export function snapBackToWall(
  room: FitRoom,
  item: FitItem,
  maxGapM = 0.45,
): { x: number; z: number; rot: number } | null {
  const W = room.widthIn * INCH;
  const L = room.lengthIn * INCH;
  const depth = item.size.d * INCH;
  const width = item.size.w * INCH;
  const faceX = item.x + -Math.sin(item.rot) * (depth / 2);
  const faceZ = item.z + -Math.cos(item.rot) * (depth / 2);
  const planes: { wall: DoorWall; gap: number }[] = [
    { wall: "s", gap: faceZ - -L / 2 },
    { wall: "n", gap: L / 2 - faceZ },
    { wall: "w", gap: faceX - -W / 2 },
    { wall: "e", gap: W / 2 - faceX },
  ];
  let best: { wall: DoorWall; gap: number } | null = null;
  for (const plane of planes) {
    if (plane.gap < -0.05 || plane.gap > maxGapM) continue;
    if (!best || plane.gap < best.gap) best = plane;
  }
  if (!best) return null;
  const inset = depth / 2 + 0.015;
  let x = item.x;
  let z = item.z;
  let rot = 0;
  if (best.wall === "s") {
    z = -L / 2 + inset;
    rot = 0;
  } else if (best.wall === "n") {
    z = L / 2 - inset;
    rot = Math.PI;
  } else if (best.wall === "w") {
    x = -W / 2 + inset;
    rot = Math.PI / 2;
  } else {
    x = W / 2 - inset;
    rot = -Math.PI / 2;
  }
  const half = width / 2 + 0.01;
  if (best.wall === "n" || best.wall === "s") {
    const limit = W / 2 - half;
    if (limit < 0) return null;
    x = Math.max(-limit, Math.min(limit, x));
  } else {
    const limit = L / 2 - half;
    if (limit < 0) return null;
    z = Math.max(-limit, Math.min(limit, z));
  }
  const next = { ...item, x, z, rot };
  if (!contains(roomAabb(room), pieceAabb(next))) return null;
  return { x, z, rot };
}
