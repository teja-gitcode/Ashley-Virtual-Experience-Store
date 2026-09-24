import { useEffect, useMemo } from "react";
import * as THREE from "three";

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, a: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * a;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function canvasTex(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 512,
  repeatX = 4,
  repeatY = 4,
) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function wood(base: string, grain: string, plank = 42) {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    const n = Math.ceil(size / plank);
    for (let i = 0; i < n; i++) {
      const x = i * plank;
      ctx.fillStyle = i % 2 === 0 ? grain : base;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x, 0, plank - 2, size);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(40,24,12,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + plank - 1, 0);
      ctx.lineTo(x + plank - 1, size);
      ctx.stroke();
      ctx.strokeStyle = "rgba(70,40,18,0.18)";
      ctx.lineWidth = 1;
      for (let k = 0; k < 9; k++) {
        const gx = x + 6 + Math.random() * (plank - 12);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(gx + 4, size * 0.3, gx - 3, size * 0.6, gx + 2, size);
        ctx.stroke();
      }
    }
    noise(ctx, size, size, 12);
  }, 512, 8, 6);
}

function plaster() {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = "#c4b093";
    ctx.fillRect(0, 0, size, size);
    noise(ctx, size, size, 10);
    ctx.fillStyle = "rgba(90,70,45,0.08)";
    for (let i = 0; i < 80; i++) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 18, 10);
    }
  }, 256, 6, 4);
}

function carpet(color: string) {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    noise(ctx, size, size, 18);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let y = 0; y < size; y += 4) {
      ctx.fillRect(0, y, size, 1);
    }
  }, 256, 6, 6);
}

function tile() {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = "#d8d2c8";
    ctx.fillRect(0, 0, size, size);
    const cell = 64;
    ctx.strokeStyle = "#c2bbb0";
    ctx.lineWidth = 3;
    for (let x = 0; x <= size; x += cell) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += cell) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    noise(ctx, size, size, 8);
  }, 512, 10, 8);
}

function deck() {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = "#9a7048";
    ctx.fillRect(0, 0, size, size);
    const plank = 36;
    for (let y = 0; y < size; y += plank) {
      ctx.fillStyle = y % (plank * 2) === 0 ? "#a87b52" : "#8c6340";
      ctx.fillRect(0, y, size, plank - 2);
      ctx.fillStyle = "rgba(40,22,10,0.35)";
      ctx.fillRect(0, y + plank - 2, size, 2);
    }
    noise(ctx, size, size, 14);
  }, 512, 6, 8);
}

function grass() {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = "#4a6b3a";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#5b7d46" : "#3d5c30";
      ctx.fillRect(Math.random() * size, Math.random() * size, 3, 6);
    }
  }, 256, 8, 8);
}

function medallionRug() {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = "#efe4d2";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#243044";
    ctx.lineWidth = 26;
    ctx.strokeRect(30, 30, size - 60, size - 60);
    ctx.strokeStyle = "#c4a574";
    ctx.lineWidth = 8;
    ctx.strokeRect(58, 58, size - 116, size - 116);
    ctx.beginPath();
    ctx.moveTo(size / 2, size * 0.3);
    ctx.lineTo(size * 0.7, size / 2);
    ctx.lineTo(size / 2, size * 0.7);
    ctx.lineTo(size * 0.3, size / 2);
    ctx.closePath();
    ctx.fillStyle = "#31445a";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#c4a574";
    ctx.stroke();
    ctx.fillStyle = "#efe4d2";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 28, 0, Math.PI * 2);
    ctx.fill();
    noise(ctx, size, size, 8);
  }, 512, 1, 1);
}

function rug(a: string, b: string) {
  return canvasTex(
    (ctx, size) => {
      ctx.fillStyle = a;
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = b;
      ctx.lineWidth = 18;
      ctx.strokeRect(24, 24, size - 48, size - 48);
      ctx.lineWidth = 6;
      ctx.strokeRect(48, 48, size - 96, size - 96);
      ctx.fillStyle = b;
      const step = 28;
      for (let x = 70; x < size - 70; x += step) {
        for (let y = 70; y < size - 70; y += step) {
          if ((x + y) % (step * 2) === 0) ctx.fillRect(x, y, 10, 10);
        }
      }
    },
    512,
    1,
    1,
  );
}

export type StoreMats = ReturnType<typeof makeMaterials>;

function std(color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.04,
    ...extra,
  });
}

function makeMaterials() {
  const oakMap = wood("#b5835a", "#9a6b45");
  const darkWoodMap = wood("#6b4328", "#553318", 36);
  const wallMap = plaster();
  const carpetMap = carpet("#6d6258");
  const kidsCarpetMap = carpet("#8a6a62");
  const tileMap = tile();
  const deckMap = deck();
  const grassMap = grass();
  const rugLiving = rug("#5c3d32", "#c9b496");
  const rugBed = rug("#4a5560", "#d5cfc4");
  const rugDolante = medallionRug();

  const mats = {
    oak: new THREE.MeshStandardMaterial({
      map: oakMap,
      roughness: 0.52,
      metalness: 0.05,
    }),
    darkWood: new THREE.MeshStandardMaterial({
      map: darkWoodMap,
      roughness: 0.55,
      metalness: 0.04,
    }),
    wall: new THREE.MeshStandardMaterial({
      map: wallMap,
      roughness: 0.9,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
    wallAccent: std("#7d6a55", { roughness: 0.88 }),
    trim: std("#efe6d6", { roughness: 0.5 }),
    ceiling: std("#d8cfc2", { roughness: 0.92 }),
    grout: std("#cfc6ba", { roughness: 0.92 }),
    oakFloor: new THREE.MeshStandardMaterial({
      map: oakMap,
      roughness: 0.48,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    carpet: new THREE.MeshStandardMaterial({
      map: carpetMap,
      roughness: 0.95,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -1,
    }),
    tile: new THREE.MeshStandardMaterial({
      map: tileMap,
      roughness: 0.35,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
    deck: new THREE.MeshStandardMaterial({
      map: deckMap,
      roughness: 0.6,
      metalness: 0.04,
    }),
    grass: new THREE.MeshStandardMaterial({
      map: grassMap,
      roughness: 1,
      metalness: 0,
    }),
    rugLiving: new THREE.MeshStandardMaterial({
      map: rugLiving,
      roughness: 0.92,
      metalness: 0,
    }),
    rugBed: new THREE.MeshStandardMaterial({
      map: rugBed,
      roughness: 0.92,
      metalness: 0,
    }),
    rugDolante: new THREE.MeshStandardMaterial({
      map: rugDolante,
      roughness: 0.9,
      metalness: 0,
    }),
    charcoal: std("#2c2d32", { roughness: 0.86 }),
    slate: std("#667484", { roughness: 0.84 }),
    pebble: std("#cfc6ba", { roughness: 0.88 }),
    smoke: std("#6f6b67", { roughness: 0.86 }),
    linen: std("#e6ddd0", { roughness: 0.9 }),
    navy: std("#2a3848", { roughness: 0.8 }),
    whitewash: std("#e8e2d6", { roughness: 0.72 }),
    rust: std("#8d4e36", { roughness: 0.7 }),
    sand: std("#d7c4a3", { roughness: 0.88 }),
    forest: std("#3f4f3a", { roughness: 0.86 }),
    cream: std("#f2ebe0", { roughness: 0.88 }),
    pillowTerracotta: std("#c46a4a", { roughness: 0.84 }),
    pillowNavy: std("#31445a", { roughness: 0.84 }),
    blush: std("#c9898a", { roughness: 0.86 }),
    sage: std("#7a8b6c", { roughness: 0.86 }),
    mustard: std("#c4a35a", { roughness: 0.84 }),
    kidsCarpet: new THREE.MeshStandardMaterial({
      map: kidsCarpetMap,
      roughness: 0.95,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -1,
    }),
    kitchenTile: new THREE.MeshStandardMaterial({
      map: tileMap,
      roughness: 0.32,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 1,
    }),
    bookRed: std("#7a2e2a", { roughness: 0.7 }),
    bookBlue: std("#2c4560", { roughness: 0.7 }),
    bookGreen: std("#35563a", { roughness: 0.7 }),
    bookCream: std("#e6dcc8", { roughness: 0.75 }),
    brass: std("#c4a15a", { roughness: 0.28, metalness: 0.72 }),
    blackMetal: std("#1a1c1f", { roughness: 0.35, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({
      color: "#cfe4f4",
      transparent: true,
      opacity: 0.28,
      roughness: 0.12,
      metalness: 0.15,
    }),
    emissive: new THREE.MeshStandardMaterial({
      color: "#fff4d8",
      emissive: "#ffdca0",
      emissiveIntensity: 1.4,
      roughness: 0.4,
    }),
    shade: std("#f3e6cc", { roughness: 0.78, emissive: "#e8d2a8", emissiveIntensity: 0.18 }),
    terracotta: std("#b56848", { roughness: 0.82 }),
    leaf: std("#3d6a3a", { roughness: 0.9 }),
    leaf2: std("#2f552e", { roughness: 0.9 }),
    mattressWhite: std("#f4f1ea", { roughness: 0.92 }),
    mattressQuilt: std("#ece6db", { roughness: 0.9 }),
    screen: std("#111318", { roughness: 0.2, metalness: 0.4, emissive: "#1a2230", emissiveIntensity: 0.25 }),
    asphalt: std("#3e4650", { roughness: 0.9 }),
    concrete: std("#b9b3a8", { roughness: 0.88 }),
    stallPaint: std("#ece7dc", { roughness: 0.72 }),
    orange: std("#f48120", { roughness: 0.45 }),
    skin: std("#e2b392", { roughness: 0.7 }),
    khaki: std("#8d7a58", { roughness: 0.8 }),
    shirt: std("#243044", { roughness: 0.78 }),
    staff: std("#e07a28", { roughness: 0.7 }),
    _tex: [oakMap, darkWoodMap, wallMap, carpetMap, kidsCarpetMap, tileMap, deckMap, grassMap, rugLiving, rugBed, rugDolante],
  };
  return mats;
}

export function useStoreMaterials() {
  const mats = useMemo(() => makeMaterials(), []);
  useEffect(() => {
    return () => {
      for (const t of mats._tex) t.dispose();
      for (const v of Object.values(mats)) {
        if (v instanceof THREE.Material) v.dispose();
      }
    };
  }, [mats]);
  return mats;
}

export function fabricMat(mats: StoreMats, key: string) {
  const map: Record<string, THREE.MeshStandardMaterial> = {
    charcoal: mats.charcoal,
    slate: mats.slate,
    pebble: mats.pebble,
    smoke: mats.smoke,
    linen: mats.linen,
    navy: mats.navy,
    whitewash: mats.whitewash,
    rust: mats.rust,
    sand: mats.sand,
    forest: mats.forest,
    blush: mats.blush,
    sage: mats.sage,
    mustard: mats.mustard,
  };
  return map[key] ?? mats.charcoal;
}
