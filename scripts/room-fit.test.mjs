import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  assessRoom,
  doorPath,
  formatInches,
  pieceAabb,
  snapBackToWall,
} from "../src/lib/room-fit.ts";

const bedroom = {
  widthIn: 144,
  lengthIn: 168,
  heightIn: 96,
  doorWall: "s",
  doorOffsetIn: 0,
  doorWidthIn: 32,
};

test("queen bed centered in a 12 by 14 room fits", () => {
  const report = assessRoom(bedroom, [
    { uid: "bed", x: 0, z: 0, rot: 0, size: { w: 65, d: 87, h: 49 } },
  ]);
  assert.equal(report.fits, true);
  assert.ok(Math.abs(report.pieceSqFt.bed - (65 * 87) / 144) < 0.01);
  assert.ok(report.occupiedSqFt > 30 && report.occupiedSqFt < 45);
  assert.equal(report.roomSqFt, 168);
});

test("a piece past the wall is outside, and a tall piece hits the ceiling", () => {
  const report = assessRoom(bedroom, [
    { uid: "out", x: 3, z: 0, rot: 0, size: { w: 90, d: 40, h: 30 } },
    { uid: "tall", x: -1, z: 0.4, rot: 0, size: { w: 30, d: 20, h: 120 } },
  ]);
  assert.ok(report.issues.some((i) => i.uid === "out" && i.kind === "outside"));
  assert.ok(report.issues.some((i) => i.uid === "tall" && i.kind === "ceiling"));
  assert.equal(report.fits, false);
});

test("overlapping pieces and the door path are reported", () => {
  const door = doorPath(bedroom);
  const report = assessRoom(bedroom, [
    { uid: "a", x: 0, z: 0, rot: 0, size: { w: 40, d: 40, h: 30 } },
    { uid: "b", x: 0.2, z: 0.1, rot: 0, size: { w: 40, d: 40, h: 30 } },
    { uid: "block", x: 0, z: door.minZ + 0.2, rot: 0, size: { w: 40, d: 30, h: 30 } },
  ]);
  assert.ok(report.issues.some((i) => i.kind === "overlap"));
  assert.ok(report.issues.some((i) => i.uid === "block" && i.kind === "door"));
});

test("stacked footprints count once", () => {
  const one = assessRoom(bedroom, [
    { uid: "a", x: 0, z: 0, rot: 0, size: { w: 36, d: 36, h: 20 } },
  ]);
  const two = assessRoom(bedroom, [
    { uid: "a", x: 0, z: 0, rot: 0, size: { w: 36, d: 36, h: 20 } },
    { uid: "b", x: 0, z: 0, rot: 0, size: { w: 36, d: 36, h: 20 } },
  ]);
  assert.ok(Math.abs(one.occupiedSqFt - 9) < 0.4);
  assert.ok(Math.abs(two.occupiedSqFt - one.occupiedSqFt) < 0.4);
});

test("a quarter turn swaps the floor footprint", () => {
  const flat = pieceAabb({ uid: "t", x: 0, z: 0, rot: 0, size: { w: 72, d: 40, h: 30 } });
  const turned = pieceAabb({ uid: "t", x: 0, z: 0, rot: Math.PI / 2, size: { w: 72, d: 40, h: 30 } });
  const wide = flat.maxX - flat.minX;
  const deep = flat.maxZ - flat.minZ;
  assert.ok(Math.abs(wide - 72 * 0.0254) < 1e-6);
  assert.ok(Math.abs(deep - 40 * 0.0254) < 1e-6);
  assert.ok(Math.abs(turned.maxX - turned.minX - deep) < 1e-6);
  assert.ok(Math.abs(turned.maxZ - turned.minZ - wide) < 1e-6);
});

test("back face snaps to the south wall with rot 0", () => {
  const depth = 38 * 0.0254;
  const halfL = (168 * 0.0254) / 2;
  const posed = snapBackToWall(bedroom, {
    uid: "sofa",
    x: 0.2,
    z: -halfL + depth / 2 + 0.2,
    rot: 0.2,
    size: { w: 85, d: 38, h: 37 },
  });
  assert.ok(posed);
  assert.equal(posed.rot, 0);
  assert.ok(Math.abs(posed.z - (-halfL + depth / 2 + 0.015)) < 1e-6);
  const box = pieceAabb({ uid: "sofa", ...posed, size: { w: 85, d: 38, h: 37 } });
  assert.ok(box.minZ >= -halfL - 1e-3);
});

test("local −Z matches three.js Y rotation", () => {
  const object = new THREE.Object3D();
  object.rotation.y = Math.PI / 2;
  object.updateMatrixWorld(true);
  const back = new THREE.Vector3(0, 0, -1).applyQuaternion(object.quaternion);
  assert.ok(Math.abs(back.x - -1) < 1e-6);
  assert.ok(Math.abs(back.z) < 1e-6);
  object.rotation.y = 0;
  object.updateMatrixWorld(true);
  const south = new THREE.Vector3(0, 0, -1).applyQuaternion(object.quaternion);
  assert.ok(Math.abs(south.z - -1) < 1e-6);
});

test("formatInches reads in feet and inches", () => {
  assert.equal(formatInches(38), "3 ft 2 in");
  assert.equal(formatInches(96), "8 ft");
  assert.equal(formatInches(8), "8 in");
});
