import { INCH, doorPath, formatInches, pieceAabb, type FitRoom, type SizeIn } from "./room-fit";

export type SheetPiece = {
  name: string;
  x: number;
  z: number;
  rot: number;
  size: SizeIn;
  bad: boolean;
};

export type PlanFrame = { x: number; y: number; w: number; h: number };

/** North (+Z) is up. */
export function planPoint(room: FitRoom, x: number, z: number, frame: PlanFrame) {
  const width = room.widthIn * INCH;
  const length = room.lengthIn * INCH;
  const u = (x + width / 2) / width;
  const v = (length / 2 - z) / length;
  return { x: frame.x + u * frame.w, y: frame.y + v * frame.h };
}

function slug(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return clean || "my-room";
}

export function renderRoomSheet(
  snapshot: CanvasImageSource,
  room: FitRoom,
  roomName: string,
  pieces: SheetPiece[],
  summary: { occupiedSqFt: number; roomSqFt: number; fits: boolean },
) {
  const width = 1400;
  const pad = 48;
  const header = 128;
  const snapH = 620;
  const planH = 760;
  const legendH = 56 + Math.max(pieces.length, 1) * 34;
  const height = header + snapH + planH + legendH + pad;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#f6f1e8";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#1b2634";
  ctx.fillRect(0, 0, width, 8);

  ctx.fillStyle = "#f48120";
  ctx.font = "600 22px Trebuchet MS, sans-serif";
  ctx.fillText("MY ROOM", pad, 52);
  ctx.fillStyle = "#1b2634";
  ctx.font = "700 42px Trebuchet MS, sans-serif";
  ctx.fillText(roomName || "Room", pad, 98);
  ctx.fillStyle = "#5c564e";
  ctx.font = "400 22px Trebuchet MS, sans-serif";
  const meta = `${formatInches(room.widthIn)} wide  ·  ${formatInches(room.lengthIn)} long  ·  ${formatInches(room.heightIn)} ceiling  ·  ${summary.occupiedSqFt.toFixed(1)} of ${summary.roomSqFt.toFixed(0)} sq ft`;
  ctx.fillText(meta, 420, 92);

  const snapX = pad;
  const snapY = header;
  const snapW = width - pad * 2;
  drawSnapshot(ctx, snapshot, snapX, snapY, snapW, snapH - 24);

  const frame: PlanFrame = { x: pad + 90, y: header + snapH + 36, w: width - pad * 2 - 180, h: planH - 120 };
  drawPlan(ctx, room, pieces, frame);

  let y = frame.y + frame.h + 78;
  ctx.fillStyle = "#1b2634";
  ctx.font = "600 20px Trebuchet MS, sans-serif";
  ctx.fillText(summary.fits ? "Everything fits" : "Some pieces need a change", pad, y);
  y += 36;
  ctx.font = "400 22px Trebuchet MS, sans-serif";
  if (pieces.length === 0) {
    ctx.fillStyle = "#5c564e";
    ctx.fillText("No furniture in this room yet.", pad, y);
  }
  pieces.forEach((piece, index) => {
    ctx.fillStyle = piece.bad ? "#9b2c2c" : "#1b2634";
    const size = `${formatInches(piece.size.w)} × ${formatInches(piece.size.d)}`;
    ctx.fillText(`${index + 1}   ${piece.name}    ${size}`, pad, y);
    y += 34;
  });

  return canvas;
}

function drawSnapshot(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const sw = "width" in source ? Number(source.width) : w;
  const sh = "height" in source ? Number(source.height) : h;
  const scale = Math.min(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.fillStyle = "#d5dde6";
  ctx.fillRect(x, y, w, h);
  ctx.drawImage(source, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawPlan(ctx: CanvasRenderingContext2D, room: FitRoom, pieces: SheetPiece[], frame: PlanFrame) {
  const corners = [
    planPoint(room, (-room.widthIn * INCH) / 2, (room.lengthIn * INCH) / 2, frame),
    planPoint(room, (room.widthIn * INCH) / 2, (room.lengthIn * INCH) / 2, frame),
    planPoint(room, (room.widthIn * INCH) / 2, (-room.lengthIn * INCH) / 2, frame),
    planPoint(room, (-room.widthIn * INCH) / 2, (-room.lengthIn * INCH) / 2, frame),
  ];
  ctx.fillStyle = "#fffdf8";
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  corners.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fill();

  pieces.forEach((piece, index) => {
    const box = pieceAabb({ ...piece, uid: String(index) });
    const a = planPoint(room, box.minX, box.maxZ, frame);
    const b = planPoint(room, box.maxX, box.minZ, frame);
    ctx.fillStyle = piece.bad ? "#f3d0cb" : "#e4d3b4";
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.strokeStyle = piece.bad ? "#9b2c2c" : "#1b2634";
    ctx.lineWidth = 2;
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.fillStyle = "#1b2634";
    ctx.font = "700 22px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index + 1), (a.x + b.x) / 2, (a.y + b.y) / 2);
  });

  ctx.strokeStyle = "#1b2634";
  ctx.lineWidth = 4;
  ctx.strokeRect(corners[0].x, corners[0].y, corners[1].x - corners[0].x, corners[2].y - corners[0].y);
  drawDoor(ctx, room, frame);

  dimHorizontal(ctx, corners[3].x, corners[2].x, corners[2].y + 28, formatInches(room.widthIn));
  dimVertical(ctx, corners[1].x + 28, corners[1].y, corners[2].y, formatInches(room.lengthIn));

  ctx.fillStyle = "#1b2634";
  ctx.font = "600 18px Trebuchet MS, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("N", frame.x - 64, frame.y + 8);
  ctx.beginPath();
  ctx.moveTo(frame.x - 48, frame.y + 18);
  ctx.lineTo(frame.x - 48, frame.y - 10);
  ctx.strokeStyle = "#1b2634";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawDoor(ctx: CanvasRenderingContext2D, room: FitRoom, frame: PlanFrame) {
  const opening = doorPath(room);
  const a = planPoint(room, opening.minX, opening.maxZ, frame);
  const b = planPoint(room, opening.maxX, opening.minZ, frame);
  ctx.strokeStyle = "#f48120";
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (room.doorWall === "n" || room.doorWall === "s") {
    const y = room.doorWall === "n" ? Math.min(a.y, b.y) : Math.max(a.y, b.y);
    ctx.moveTo(Math.min(a.x, b.x), y);
    ctx.lineTo(Math.max(a.x, b.x), y);
  } else {
    const x = room.doorWall === "w" ? Math.min(a.x, b.x) : Math.max(a.x, b.x);
    ctx.moveTo(x, Math.min(a.y, b.y));
    ctx.lineTo(x, Math.max(a.y, b.y));
  }
  ctx.stroke();
}

function dimHorizontal(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, label: string) {
  ctx.strokeStyle = "#243044";
  ctx.fillStyle = "#243044";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.font = "600 20px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, (x0 + x1) / 2, y + 8);
}

function dimVertical(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, label: string) {
  ctx.strokeStyle = "#243044";
  ctx.fillStyle = "#243044";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.stroke();
  ctx.save();
  ctx.translate(x + 10, (y0 + y1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = "600 20px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

export function downloadRoomSheet(canvas: HTMLCanvasElement, roomName: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${slug(roomName)}-room.png`;
  link.click();
}
