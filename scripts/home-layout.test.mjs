import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  chaseHeight,
  chasePull,
  homeColliders,
  layoutHome,
  nextJoin,
  oppositeWall,
  roomInteriors,
  walkSpawn,
  wallOnScreenAxis,
} from "../src/lib/home-layout.ts";

const bedroom = {
  id: "bed",
  widthIn: 144,
  lengthIn: 168,
  doorWall: "s",
  doorOffsetIn: 0,
  doorWidthIn: 32,
  items: [],
};

const living = {
  id: "live",
  widthIn: 144,
  lengthIn: 216,
  doorWall: "w",
  doorOffsetIn: 0,
  doorWidthIn: 36,
  join: { to: "bed", side: "e" },
  items: [],
};

function blocked(x, z, boxes, radius) {
  return boxes.some(
    (box) => x > box.minX - radius && x < box.maxX + radius && z > box.minZ - radius && z < box.maxZ + radius,
  );
}

test("a new room sits on the east side of the one you are editing", () => {
  const layout = layoutHome([bedroom, living]);
  const bed = layout[0];
  const live = layout[1];
  assert.ok(live.x > bed.x + bed.width / 2);
  const gap = live.x - live.width / 2 - (bed.x + bed.width / 2);
  assert.ok(Math.abs(gap - 0.08) < 1e-6);
  assert.equal(live.z, bed.z);
});

test("two rooms on the same wall do not cover each other", () => {
  const third = { ...living, id: "den", join: { to: "bed", side: "e" } };
  const layout = layoutHome([bedroom, living, third]);
  const a = layout[1];
  const b = layout[2];
  const overlapX = Math.abs(a.x - b.x) < (a.width + b.width) / 2;
  const overlapZ = Math.abs(a.z - b.z) < (a.length + b.length) / 2;
  assert.equal(overlapX && overlapZ, false);
});

test("the shared doorway is open and the wall beside it is solid", () => {
  const plans = [bedroom, living];
  const layout = layoutHome(plans);
  const boxes = homeColliders(plans, layout);
  const bed = layout[0];
  const seamX = bed.x + bed.width / 2 + 0.04;
  assert.equal(blocked(seamX, bed.z, boxes, 0.22), false);
  assert.equal(blocked(seamX, bed.z + bed.length / 2 - 0.2, boxes, 0.05), true);
});

test("spawn inside the south door looks north, and the spot is clear", () => {
  const layout = layoutHome([bedroom, living]);
  const spawn = walkSpawn(bedroom, layout[0]);
  const fx = -Math.sin(spawn.yaw);
  const fz = -Math.cos(spawn.yaw);
  assert.ok(Math.abs(fx) < 1e-9);
  assert.ok(fz > 0.99);
  assert.equal(blocked(spawn.x, spawn.z, homeColliders([bedroom, living], layout), 0.22), false);
});

test("a longer room keeps the wall past the room it joins", () => {
  const plans = [bedroom, living];
  const layout = layoutHome(plans);
  const boxes = homeColliders(plans, layout);
  const live = layout[1];
  const wingZ = live.z + live.length / 2 - 0.2;
  const wingX = live.x - live.width / 2 - 0.04;
  assert.equal(blocked(wingX, wingZ, boxes, 0.05), true);
  assert.equal(blocked(wingX, live.z, boxes, 0.22), false);
});

test("left, right, above, and below match the room view", () => {
  const orbit = new THREE.PerspectiveCamera(42, 1.4, 0.1, 100);
  orbit.up.set(0, 1, 0);
  orbit.position.set(0, 8, 2);
  orbit.lookAt(0, 0, 0);
  orbit.updateMatrixWorld();
  const right = new THREE.Vector3().setFromMatrixColumn(orbit.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(orbit.matrixWorld, 1);
  assert.equal(wallOnScreenAxis(right.x, right.z), "e");
  assert.equal(wallOnScreenAxis(-right.x, -right.z), "w");
  assert.equal(wallOnScreenAxis(up.x, up.z), "s");
  assert.equal(wallOnScreenAxis(-up.x, -up.z), "n");

  const top = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  top.up.set(0, 0, -1);
  top.position.set(0, 10, 0.01);
  top.lookAt(0, 0, 0);
  top.updateMatrixWorld();
  const topRight = new THREE.Vector3().setFromMatrixColumn(top.matrixWorld, 0);
  const topUp = new THREE.Vector3().setFromMatrixColumn(top.matrixWorld, 1);
  assert.equal(wallOnScreenAxis(topRight.x, topRight.z), "e");
  assert.equal(wallOnScreenAxis(topUp.x, topUp.z), "s");
});

test("the next room takes the first open side", () => {
  assert.deepEqual(nextJoin([bedroom], "bed"), { to: "bed", side: "e" });
  assert.deepEqual(nextJoin([bedroom, living], "bed"), { to: "bed", side: "w" });
  assert.equal(oppositeWall("e"), "w");
});

test("saved rooms with no join still line up to the east", () => {
  const second = { ...living, join: undefined, doorWall: "s" };
  const layout = layoutHome([bedroom, second]);
  assert.ok(layout[1].x > layout[0].x);
});

test("walk zoom climbs over a nearby wall and stays low in open floor", () => {
  const layout = layoutHome([bedroom]);
  const rooms = roomInteriors(layout);
  const spawn = walkSpawn(bedroom, layout[0]);
  // yaw π looks toward +Z. The camera sits on the opposite side of that vector.
  const fx = 0;
  const fz = 1;
  const pulled = chasePull(spawn.x, spawn.z, fx, fz, 10, rooms);
  assert.ok(pulled < 0.6, `pull ${pulled} should stop at the south wall`);
  assert.ok(chaseHeight(10, pulled) > 6, "a blocked zoom-out has to clear the room");
  const spot = { x: spawn.x - fx * pulled, z: spawn.z - fz * pulled };
  assert.ok(rooms.some((room) => spot.x >= room.minX && spot.x <= room.maxX && spot.z >= room.minZ && spot.z <= room.maxZ));

  const open = chasePull(layout[0].x, layout[0].z, fx, fz, 1.2, rooms);
  assert.equal(open, 1.2);
  assert.ok(chaseHeight(1.2, open) < 2.2);
});
