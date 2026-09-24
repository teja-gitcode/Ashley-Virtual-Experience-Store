import assert from "node:assert/strict";
import test from "node:test";
import { PLACEMENTS, PRODUCT_MAP, roomAt } from "../src/lib/catalog.ts";
import { FENCES, INTERIOR_WALLS } from "../src/game/collision.ts";

function aabb(place) {
  const c = Math.abs(Math.cos(place.rot));
  const s = Math.abs(Math.sin(place.rot));
  const w = c * place.collideW + s * place.collideD;
  const d = s * place.collideW + c * place.collideD;
  return {
    minX: place.x - w / 2,
    maxX: place.x + w / 2,
    minZ: place.z - d / 2,
    maxZ: place.z + d / 2,
  };
}

function hits(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

function wallBox(wall) {
  return {
    minX: wall.x - wall.w / 2,
    maxX: wall.x + wall.w / 2,
    minZ: wall.z - wall.d / 2,
    maxZ: wall.z + wall.d / 2,
  };
}

/** Walk openings cut out of INTERIOR_WALLS. Kept clear of new pieces. */
const PORTALS = [
  { name: "living-lobby", minX: -11.2, maxX: -8.8, minZ: 3.3, maxZ: 4.7 },
  { name: "bedroom-lobby", minX: 8.8, maxX: 11.2, minZ: 3.3, maxZ: 4.7 },
  { name: "living-dining", minX: -11.6, maxX: -8.6, minZ: -4.7, maxZ: -3.3 },
  { name: "bedroom-sleep", minX: 8.6, maxX: 11.4, minZ: -4.7, maxZ: -3.3 },
  { name: "kitchen-living", minX: -18.8, maxX: -17.5, minZ: -0.5, maxZ: 1.2 },
  { name: "kitchen-dining", minX: -18.8, maxX: -17.5, minZ: -12.8, maxZ: -11.2 },
  { name: "kids-bedroom", minX: 17.5, maxX: 18.8, minZ: -0.5, maxZ: 1.2 },
  { name: "office-sleep", minX: 17.5, maxX: 18.8, minZ: -12.8, maxZ: -11.2 },
  { name: "kids-office", minX: 21.7, maxX: 23.7, minZ: -4.7, maxZ: -3.3 },
  { name: "aisle-living", minX: -2.2, maxX: 2.2, minZ: -1.1, maxZ: 1.1 },
  { name: "aisle-dining", minX: -2.2, maxX: 2.2, minZ: -13.1, maxZ: -10.9 },
  { name: "patio-door", minX: -2.2, maxX: 2.2, minZ: -20.8, maxZ: -19.5 },
];

const DECOR = [
  [-8.5, 3.2],
  [-15.6, -1.8],
  [16.4, 2.8],
  [-6.4, -10.4],
  [-12.5, -25.8],
  [12.6, -27.2],
  [-10.6, -23.6],
  [-24.8, 2.4],
  [24.6, 2.6],
  [24.8, -19.2],
  [-6.8, 12.2],
  [-14.4, 2.7],
  [12.2, 2.55],
  [12.2, -1.15],
  [-24.6, -5.2],
  [24.4, -13.6],
  [0, 8.6],
];

test("new showroom pieces sit in their rooms without blocking doors", () => {
  const walls = [...INTERIOR_WALLS, ...FENCES].map(wallBox);
  const fresh = PLACEMENTS.filter((place) => place.fresh);
  const problems = [];

  for (const place of fresh) {
    const product = PRODUCT_MAP[place.productId];
    const box = aabb(place);
    if (!product) {
      problems.push(`${place.productId} missing from catalog`);
      continue;
    }
    if (roomAt(place.x, place.z) !== product.room) {
      problems.push(`${place.productId} at ${place.x},${place.z} is ${roomAt(place.x, place.z)}, not ${product.room}`);
    }
    for (const wall of walls) {
      if (hits(box, wall)) problems.push(`${place.productId} intersects a wall`);
    }
    for (const portal of PORTALS) {
      if (hits(box, portal)) problems.push(`${place.productId} blocks ${portal.name}`);
    }
    for (const [x, z] of DECOR) {
      if (x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ) {
        problems.push(`${place.productId} covers decor at ${x},${z}`);
      }
    }
    for (const other of PLACEMENTS) {
      if (other === place) continue;
      if (hits(box, aabb(other))) {
        problems.push(`${place.productId} overlaps ${other.productId} at ${other.x},${other.z}`);
      }
    }
  }

  assert.deepEqual(problems, []);
  assert.ok(fresh.length >= 12);
});
