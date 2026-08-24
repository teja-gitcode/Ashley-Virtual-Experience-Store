export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };

export function rect(cx: number, cz: number, w: number, d: number): Rect {
  return { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 };
}

function expand(r: Rect, rad: number): Rect {
  return {
    minX: r.minX - rad,
    maxX: r.maxX + rad,
    minZ: r.minZ - rad,
    maxZ: r.maxZ + rad,
  };
}

function overlaps(x: number, z: number, r: Rect) {
  return x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;
}

export function resolveMove(
  x: number,
  z: number,
  dx: number,
  dz: number,
  boxes: Rect[],
  radius: number,
) {
  let nx = x + dx;
  let nz = z + dz;
  for (const b of boxes) {
    const e = expand(b, radius);
    if (overlaps(nx, z, e)) nx = x;
  }
  for (const b of boxes) {
    const e = expand(b, radius);
    if (overlaps(nx, nz, e)) nz = z;
  }
  return { x: nx, z: nz };
}

function blocked(x: number, z: number, boxes: Rect[], radius: number) {
  return boxes.some((b) => overlaps(x, z, expand(b, radius)));
}

/** Push a point out of colliders. Used after teleport so you never spawn inside a table. */
export function unstick(
  x: number,
  z: number,
  boxes: Rect[],
  radius: number,
) {
  if (!blocked(x, z, boxes, radius)) return { x, z };
  const steps = [0.7, 1.2, 1.8, 2.5, 3.4, 4.5];
  const dirs: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  for (const s of steps) {
    for (const [dx, dz] of dirs) {
      const nx = x + dx * s;
      const nz = z + dz * s;
      if (!blocked(nx, nz, boxes, radius)) return { x: nx, z: nz };
    }
  }
  return { x, z };
}

export type WallDef = { x: number; z: number; w: number; d: number };

const t = 0.28;

/** Plaster walls — world.tsx and collision share this list. */
export const INTERIOR_WALLS: WallDef[] = [
  // South entrance (gap at x≈0)
  { x: -10, z: 16.15, w: 16.2, d: t },
  { x: 10, z: 16.15, w: 16.2, d: t },

  // North glass wall of original building (opening to patio at x≈0)
  { x: -10.4, z: -20.15, w: 15.5, d: t },
  { x: 10.4, z: -20.15, w: 15.5, d: t },

  // Old west outer wall, now interior with doors into kitchen
  { x: -18.15, z: 10.075, w: t, d: 12.15 },
  { x: -18.15, z: 2.75, w: t, d: 2.5 },
  { x: -18.15, z: -2.4, w: t, d: 3.2 },
  { x: -18.15, z: -7.45, w: t, d: 6.9 },
  { x: -18.15, z: -16.625, w: t, d: 7.05 },

  // Old east outer wall, now interior with doors into kids / office
  { x: 18.15, z: 10.075, w: t, d: 12.15 },
  { x: 18.15, z: 2.75, w: t, d: 2.5 },
  { x: 18.15, z: -2.4, w: t, d: 3.2 },
  { x: 18.15, z: -7.45, w: t, d: 6.9 },
  { x: 18.15, z: -16.625, w: t, d: 7.05 },

  // Kitchen wing
  { x: -26.15, z: -8.075, w: t, d: 24.15 },
  { x: -22.15, z: 4.0, w: 8.0, d: t },
  { x: -22.15, z: -20.15, w: 8.0, d: t },

  // Kids / office wing
  { x: 26.15, z: -8.075, w: t, d: 24.15 },
  { x: 22.15, z: 4.0, w: 8.0, d: t },
  { x: 22.15, z: -20.15, w: 8.0, d: t },

  // Lobby divider z=4 (3 portals)
  { x: -14.8, z: 4.0, w: 6.4, d: t },
  { x: -5.1, z: 4.0, w: 6.6, d: t },
  { x: 5.1, z: 4.0, w: 6.6, d: t },
  { x: 14.8, z: 4.0, w: 6.4, d: t },

  // Living/dining and bedroom/sleep at z=-4
  { x: -15.0, z: -4.0, w: 6.0, d: t },
  { x: -5.0, z: -4.0, w: 6.6, d: t },
  { x: 5.0, z: -4.0, w: 6.6, d: t },
  { x: 15.0, z: -4.0, w: 6.0, d: t },
  { x: 20.5, z: -4.0, w: 4.7, d: t },
  { x: 24.9, z: -4.0, w: 2.5, d: t },

  // Aisle walls x=±1.7 with doorways
  { x: -1.7, z: 2.65, w: t, d: 2.7 },
  { x: -1.7, z: -6.0, w: t, d: 9.4 },
  { x: -1.7, z: -16.65, w: t, d: 6.7 },
  { x: 1.7, z: 2.65, w: t, d: 2.7 },
  { x: 1.7, z: -6.0, w: t, d: 9.4 },
  { x: 1.7, z: -16.65, w: t, d: 6.7 },
];

export const FENCES: WallDef[] = [
  { x: -14.2, z: -25.0, w: 0.12, d: 10.0 },
  { x: 14.2, z: -25.0, w: 0.12, d: 10.0 },
  { x: 0, z: -30.15, w: 28.6, d: 0.12 },
];

/** Soft lot edge so you stay on the grass / asphalt. Door gap is open. */
export const LOT_CURBS: WallDef[] = [
  { x: 0, z: 30.55, w: 29.2, d: 0.35 },
  { x: -14.4, z: 23.35, w: 0.35, d: 14.4 },
  { x: 14.4, z: 23.35, w: 0.35, d: 14.4 },
];

export const LOT_OBSTACLES: Rect[] = [
  rect(-8.4, 25.2, 2.0, 4.5),
  rect(8.4, 25.2, 2.0, 4.5),
  rect(-11.2, 21.35, 0.7, 0.45),
];

/** Store walls — keep in sync with world.tsx via INTERIOR_WALLS / FENCES. */
export function buildWalls(): Rect[] {
  return [...INTERIOR_WALLS, ...FENCES, ...LOT_CURBS].map((w) => rect(w.x, w.z, w.w, w.d));
}
