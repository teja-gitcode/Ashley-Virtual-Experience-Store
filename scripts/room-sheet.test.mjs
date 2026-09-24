import assert from "node:assert/strict";
import test from "node:test";
import { planPoint } from "../src/lib/room-sheet.ts";

const room = {
  widthIn: 144,
  lengthIn: 168,
  heightIn: 96,
  doorWall: "s",
  doorOffsetIn: 0,
  doorWidthIn: 32,
};
const frame = { x: 0, y: 0, w: 144, h: 168 };

test("north is up on the plan", () => {
  const north = planPoint(room, 0, 1, frame);
  const south = planPoint(room, 0, -1, frame);
  assert.ok(north.y < south.y);
});

test("the room center maps to the middle of the frame", () => {
  const center = planPoint(room, 0, 0, frame);
  assert.ok(Math.abs(center.x - 72) < 0.01);
  assert.ok(Math.abs(center.y - 84) < 0.01);
});
