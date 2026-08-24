import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { geo } from "./geo";
import { type StoreMats } from "./materials";
import { FENCES, INTERIOR_WALLS } from "./collision";
import {
  FloorLamp,
  Plant,
  ProductPiece,
  Rug,
  TableLamp,
} from "./furniture";
import { PLACEMENTS, PRODUCT_MAP } from "@/lib/catalog";
import { assetUrl } from "@/lib/asset-url";
import { useExperience } from "@/lib/experience-state";
import { applyPick, hitFrom } from "./picker";
import { xrStore } from "./xr-store";
import type { ThreeEvent } from "@react-three/fiber";

function onXrPick(e: ThreeEvent<MouseEvent>) {
  if (!xrStore.getState().session) return;
  e.stopPropagation();
  applyPick(hitFrom(e.object));
}

function onXrHover(e: ThreeEvent<PointerEvent>) {
  if (!xrStore.getState().session) return;
  const found = hitFrom(e.object);
  useExperience.getState().hover(found?.id ?? null);
}

const WALL_H = 4.6;

function Wall({
  p,
  s,
  m,
}: {
  p: [number, number, number];
  s: [number, number, number];
  m: THREE.Material;
}) {
  return (
    <mesh
      geometry={geo.box}
      position={p}
      scale={s}
      material={m}
      castShadow
      receiveShadow={false}
    />
  );
}

function Floor({
  p,
  s,
  m,
}: {
  p: [number, number, number];
  s: [number, number, number];
  m: THREE.Material;
}) {
  return (
    <mesh geometry={geo.box} position={p} scale={s} material={m} receiveShadow />
  );
}

function Sign({
  text,
  sub,
  position,
  rotationY = 0,
}: {
  text: string;
  sub: string;
  position: [number, number, number];
  rotationY?: number;
}) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#1b2634";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#f48120";
    ctx.fillRect(0, 0, 18, 256);
    ctx.fillStyle = "#f4efe6";
    ctx.font = "600 92px Outfit, sans-serif";
    ctx.fillText(text, 56, 120);
    ctx.fillStyle = "#b7b0a6";
    ctx.font = "400 36px Outfit, sans-serif";
    ctx.fillText(sub, 56, 180);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [text, sub]);
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[2.6, 0.65]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  );
}

function ParkedCar({
  p,
  rotY,
  body,
  cabin,
  wheel,
  glass,
}: {
  p: [number, number, number];
  rotY: number;
  body: THREE.Material;
  cabin: THREE.Material;
  wheel: THREE.Material;
  glass: THREE.Material;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh geometry={geo.box} position={[0, 0.42, 0]} scale={[1.85, 0.5, 4.15]} material={body} castShadow />
      <mesh geometry={geo.box} position={[0, 0.9, -0.28]} scale={[1.68, 0.46, 2.15]} material={cabin} castShadow />
      <mesh geometry={geo.box} position={[0, 0.92, 0.72]} scale={[1.55, 0.32, 0.04]} material={glass} />
      {(
        [
          [-0.78, 0.22, 1.35],
          [0.78, 0.22, 1.35],
          [-0.78, 0.22, -1.35],
          [0.78, 0.22, -1.35],
        ] as [number, number, number][]
      ).map((wp, i) => (
        <mesh key={i} geometry={geo.cyl} position={wp} rotation={[0, 0, Math.PI / 2]} scale={[0.22, 0.14, 0.22]} material={wheel} />
      ))}
    </group>
  );
}

function CouponTicket() {
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[0.08, 0.18, 0.12]} castShadow={false}>
        <boxGeometry args={[0.4, 0.2, 0.06]} />
        <meshStandardMaterial
          color="#f48120"
          emissive="#f48120"
          emissiveIntensity={0.55}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0.01, 0.022]} rotation={[0.08, 0.18, 0.12]}>
        <boxGeometry args={[0.18, 0.04, 0.01]} />
        <meshBasicMaterial color="#f4efe6" />
      </mesh>
    </group>
  );
}

function HiddenCoupons() {
  const claimed = useExperience((s) => s.coupons);
  return (
    <group>
      {!claimed.includes("shelf-living") ? (
        <group
          position={[-6.4, 1.05, 3.15]}
          rotation={[0, Math.PI, 0]}
          userData={{ couponId: "shelf-living" }}
          onClick={onXrPick}
          onPointerOver={onXrHover}
        >
          <group position={[0.22, 0, 0.26]}>
            <CouponTicket />
          </group>
        </group>
      ) : null}
      {!claimed.includes("shelf-office") ? (
        <group
          position={[25.4, 1.05, -12.4]}
          rotation={[0, -Math.PI / 2, 0]}
          userData={{ couponId: "shelf-office" }}
          onClick={onXrPick}
          onPointerOver={onXrHover}
        >
          <group position={[0.18, 0, 0.26]}>
            <CouponTicket />
          </group>
        </group>
      ) : null}
      {!claimed.includes("shelf-dining") ? (
        <group
          position={[-10.2, 1.34, -18.55]}
          rotation={[0, 0, 0]}
          userData={{ couponId: "shelf-dining" }}
          onClick={onXrPick}
          onPointerOver={onXrHover}
        >
          <group position={[0.38, 0, 0.28]}>
            <CouponTicket />
          </group>
        </group>
      ) : null}
    </group>
  );
}

function Storefront({ mats }: { mats: StoreMats }) {
  return (
    <group>
      <Sign text="ASHLEY" sub="Experience store" position={[0, 3.45, 16.32]} />

      <mesh geometry={geo.box} position={[0, 3.22, 16.85]} scale={[5.4, 0.08, 1.7]} material={mats.orange} castShadow />
      <mesh geometry={geo.box} position={[-2.45, 1.55, 17.55]} scale={[0.1, 3.1, 0.1]} material={mats.navy} castShadow />
      <mesh geometry={geo.box} position={[2.45, 1.55, 17.55]} scale={[0.1, 3.1, 0.1]} material={mats.navy} castShadow />
      <CanLight p={[-1.4, 3.12, 16.85]} />
      <CanLight p={[1.4, 3.12, 16.85]} />

      <mesh position={[-1.05, 2.15, 16.22]} rotation={[0, 0.42, 0]} userData={{ camSkip: true }}>
        <planeGeometry args={[1.85, 3.85]} />
        <meshStandardMaterial
          color="#cfe4f4"
          transparent
          opacity={0.28}
          roughness={0.12}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[1.05, 2.15, 16.22]} rotation={[0, -0.42, 0]} userData={{ camSkip: true }}>
        <planeGeometry args={[1.85, 3.85]} />
        <meshStandardMaterial
          color="#cfe4f4"
          transparent
          opacity={0.28}
          roughness={0.12}
          metalness={0.15}
        />
      </mesh>
      <mesh geometry={geo.box} position={[-1.92, 2.15, 16.18]} scale={[0.12, 4.2, 0.16]} material={mats.navy} />
      <mesh geometry={geo.box} position={[1.92, 2.15, 16.18]} scale={[0.12, 4.2, 0.16]} material={mats.navy} />
      <mesh geometry={geo.box} position={[0, 4.22, 16.18]} scale={[4.0, 0.12, 0.16]} material={mats.navy} />

      <mesh geometry={geo.cyl} position={[-2.45, 0.45, 16.95]} scale={[0.12, 0.9, 0.12]} material={mats.blackMetal} />
      <mesh geometry={geo.cyl} position={[2.45, 0.45, 16.95]} scale={[0.12, 0.9, 0.12]} material={mats.blackMetal} />

      <group position={[-11.2, 0, 21.35]} rotation={[0, 1.2, 0]}>
        <mesh geometry={geo.box} position={[0, 1.05, 0]} scale={[0.18, 2.1, 0.18]} material={mats.navy} castShadow />
        <mesh geometry={geo.box} position={[0, 2.18, 0.04]} scale={[2.72, 0.78, 0.1]} material={mats.navy} castShadow />
        <Sign text="ASHLEY" sub="Experience store" position={[0, 2.18, 0.12]} />
      </group>

      <ParkedCar p={[-8.4, 0, 25.2]} rotY={0} body={mats.navy} cabin={mats.charcoal} wheel={mats.blackMetal} glass={mats.glass} />
      <ParkedCar p={[8.4, 0, 25.2]} rotY={Math.PI} body={mats.rust} cabin={mats.charcoal} wheel={mats.blackMetal} glass={mats.glass} />

      {[-10.6, -8.4, -6.2, 6.2, 8.4, 10.6].map((x) => (
        <mesh key={`stall-${x}`} geometry={geo.box} position={[x, 0.012, 25.2]} scale={[0.06, 0.02, 4.6]} material={mats.stallPaint} />
      ))}
      {[-10.6, -6.2, 6.2, 10.6].map((x) => (
        <mesh key={`end-${x}`} geometry={geo.box} position={[x < 0 ? x + 1.1 : x - 1.1, 0.012, 27.45]} scale={[2.2, 0.02, 0.06]} material={mats.stallPaint} />
      ))}

      <mesh geometry={geo.box} position={[0, 0.18, 30.55]} scale={[29.2, 0.36, 0.35]} material={mats.concrete} />
      <mesh geometry={geo.box} position={[-14.4, 0.18, 23.35]} scale={[0.35, 0.36, 14.4]} material={mats.concrete} />
      <mesh geometry={geo.box} position={[14.4, 0.18, 23.35]} scale={[0.35, 0.36, 14.4]} material={mats.concrete} />
    </group>
  );
}

function Mural({
  url,
  position,
  rotationY,
  size,
}: {
  url: string;
  position: [number, number, number];
  rotationY: number;
  size: [number, number];
}) {
  const map = useTexture(url);
  map.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} roughness={0.7} metalness={0} />
    </mesh>
  );
}

function CanLight({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <mesh geometry={geo.cyl} position={[0, 0.08, 0]} scale={[0.12, 0.08, 0.12]}>
        <meshStandardMaterial
          color="#fff4d8"
          emissive="#ffdca0"
          emissiveIntensity={1.6}
        />
      </mesh>
    </group>
  );
}

function Chandelier() {
  return (
    <group position={[0, 3.9, 10]}>
      <pointLight intensity={10} distance={14} decay={2} color="#ffe2b0" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            geometry={geo.sph}
            position={[Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55]}
            scale={[0.08, 0.08, 0.08]}
          >
            <meshStandardMaterial
              color="#fff4d8"
              emissive="#ffdca0"
              emissiveIntensity={1.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Baseboard({
  x,
  z,
  w,
  d,
  mats,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  mats: StoreMats;
}) {
  return (
    <mesh
      geometry={geo.box}
      position={[x, 0.05, z]}
      scale={[w, 0.1, d]}
      material={mats.trim}
      castShadow={false}
      receiveShadow={false}
    />
  );
}

export function StoreWorld({ mats }: { mats: StoreMats }) {
  const h = 4.5;

  return (
    <group>
      {/* Underlay in the 4cm seams so neighboring floors never share a face. */}
      <Floor p={[0, -0.085, -2]} s={[52.2, 0.05, 36.3]} m={mats.grout} />

      {/* Aisle runner — oak only in the corridor, not over room floors. */}
      <Floor p={[0, -0.045, -2]} s={[3.12, 0.09, 35.9]} m={mats.oakFloor} />

      {/* Lobby tile on either side of the runner (z 4.2 → 16). */}
      <Floor p={[-9.9, -0.045, 10.1]} s={[16.2, 0.09, 11.8]} m={mats.tile} />
      <Floor p={[9.9, -0.045, 10.1]} s={[16.2, 0.09, 11.8]} m={mats.tile} />

      {/* Living / bedroom (z -3.8 → 3.8), stop before the lobby and the aisle. */}
      <Floor p={[-9.9, -0.045, 0]} s={[16.2, 0.09, 7.6]} m={mats.oakFloor} />
      <Floor p={[9.9, -0.045, 0]} s={[16.2, 0.09, 7.6]} m={mats.carpet} />

      {/* Dining / sleep (z -19.95 → -4.2). */}
      <Floor p={[-9.9, -0.045, -12.075]} s={[16.2, 0.09, 15.75]} m={mats.oakFloor} />
      <Floor p={[9.9, -0.045, -12.075]} s={[16.2, 0.09, 15.75]} m={mats.tile} />

      {/* Wings */}
      <Floor p={[-22.15, -0.045, -8.075]} s={[7.7, 0.09, 23.75]} m={mats.kitchenTile} />
      <Floor p={[22.15, -0.045, 0]} s={[7.7, 0.09, 7.6]} m={mats.kidsCarpet} />
      <Floor p={[22.15, -0.045, -12.075]} s={[7.7, 0.09, 15.75]} m={mats.oakFloor} />

      {/* Doorway saddles sit above both floors so the seam never flickers. */}
      <Floor p={[-10, 0.012, 4]} s={[2.5, 0.02, 0.42]} m={mats.oak} />
      <Floor p={[10, 0.012, 4]} s={[2.5, 0.02, 0.42]} m={mats.oak} />
      <Floor p={[-10, 0.012, -4]} s={[2.5, 0.02, 0.42]} m={mats.oak} />
      <Floor p={[10, 0.012, -4]} s={[2.5, 0.02, 0.42]} m={mats.oak} />
      <Floor p={[-18.15, 0.012, 0.4]} s={[0.42, 0.02, 2.2]} m={mats.oak} />
      <Floor p={[-18.15, 0.012, -12]} s={[0.42, 0.02, 2.2]} m={mats.oak} />
      <Floor p={[18.15, 0.012, 0.5]} s={[0.42, 0.02, 2.2]} m={mats.oak} />
      <Floor p={[18.15, 0.012, -12]} s={[0.42, 0.02, 2.2]} m={mats.oak} />
      <Floor p={[22.2, 0.012, -4]} s={[2.4, 0.02, 0.42]} m={mats.oak} />

      <Floor p={[0, -0.05, -25]} s={[28.5, 0.1, 9.8]} m={mats.deck} />
      <Floor p={[0, -0.14, -25]} s={[40, 0.06, 14]} m={mats.grass} />

      {/* Driveway — south of the store, no overlap with lobby tile. */}
      <Floor p={[0, -0.085, 23.2]} s={[30, 0.05, 14.4]} m={mats.grout} />
      <Floor p={[0, -0.14, 23.5]} s={[42, 0.06, 15.2]} m={mats.grass} />
      <Floor p={[0, -0.045, 17.2]} s={[9.2, 0.09, 2.3]} m={mats.concrete} />
      <Floor p={[0, -0.05, 24.45]} s={[24.2, 0.1, 12.2]} m={mats.asphalt} />
      <Floor p={[0, 0.012, 16.15]} s={[3.7, 0.02, 0.42]} m={mats.concrete} />

      <mesh
        geometry={geo.box}
        position={[0, h, -2]}
        scale={[52.6, 0.12, 36.6]}
        material={mats.ceiling}
      />

      {INTERIOR_WALLS.map((w, i) => (
        <Wall
          key={`w-${i}`}
          p={[w.x, h / 2, w.z]}
          s={[w.w, WALL_H, w.d]}
          m={mats.wall}
        />
      ))}

      <mesh
        geometry={geo.box}
        position={[0, h / 2, -20.12]}
        scale={[5.1, h - 0.4, 0.06]}
        material={mats.glass}
      />

      {FENCES.map((w, i) => (
        <Wall key={`f-${i}`} p={[w.x, 0.7, w.z]} s={[w.w, 1.4, w.d]} m={mats.oak} />
      ))}

      {/* Cream baseboards sit on the floor, clearly in front of the wall. */}
      <Baseboard x={-17.9} z={-2} w={0.08} d={35} mats={mats} />
      <Baseboard x={17.9} z={-2} w={0.08} d={35} mats={mats} />
      <Baseboard x={-25.9} z={-8} w={0.08} d={23.5} mats={mats} />
      <Baseboard x={25.9} z={-8} w={0.08} d={23.5} mats={mats} />

      <Mural
        url={assetUrl("showroom/living.jpg")}
        position={[-17.82, 2.15, 10.2]}
        rotationY={Math.PI / 2}
        size={[4.4, 2.4]}
      />
      <Mural
        url={assetUrl("showroom/bedroom.jpg")}
        position={[17.82, 2.15, 10.2]}
        rotationY={-Math.PI / 2}
        size={[4.4, 2.4]}
      />
      <Mural
        url={assetUrl("showroom/dining.jpg")}
        position={[-25.98, 2.15, -8]}
        rotationY={Math.PI / 2}
        size={[4.8, 2.4]}
      />
      <Mural
        url={assetUrl("showroom/patio.jpg")}
        position={[25.98, 2.15, -8]}
        rotationY={-Math.PI / 2}
        size={[4.8, 2.4]}
      />

      <Sign text="LIVING" sub="Sofas · tables · media" position={[-10.2, 3.35, 3.84]} />
      <Sign text="BEDROOM" sub="Beds · storage" position={[10.2, 3.35, 3.84]} />
      <Sign text="DINING" sub="Tables · seating" position={[-10.2, 3.35, -3.84]} rotationY={Math.PI} />
      <Sign text="SLEEP" sub="Mattress gallery" position={[10.2, 3.35, -3.84]} rotationY={Math.PI} />
      <Sign text="KITCHEN" sub="Islands · stools" position={[-22.2, 3.35, 3.84]} />
      <Sign text="KIDS" sub="Beds · storage" position={[22.2, 3.35, 3.84]} />
      <Sign text="OFFICE" sub="Desks · bookcases" position={[22.2, 3.35, -3.84]} rotationY={Math.PI} />
      <Sign text="PATIO" sub="Outdoor living" position={[0, 3.2, -19.98]} rotationY={Math.PI} />
      <Sign text="ASHLEY" sub="Experience store" position={[0, 3.5, 15.98]} rotationY={Math.PI} />
      <Storefront mats={mats} />

      <group position={[0, 0, 8.6]}>
        <Rug mat={mats.rugLiving} w={3.4} d={2.2} />
        <group
          userData={{ productId: "welcome-desk" }}
          position={[0, 0, 0]}
          onClick={onXrPick}
          onPointerOver={onXrHover}
        >
          <ProductPiece kind="desk" fabric="rust" mats={mats} />
        </group>
      </group>

      <group position={[-10.6, 0, 0.4]}>
        <Rug mat={mats.rugLiving} w={6.4} d={4.4} />
      </group>
      <group position={[11.2, 0, 0.5]}>
        <Rug mat={mats.rugBed} w={6.2} d={4.6} />
      </group>
      <group position={[-10.2, 0, -12]}>
        <Rug mat={mats.rugLiving} w={5.2} d={3.6} />
      </group>
      <group position={[-22.1, 0, -8]}>
        <Rug mat={mats.rugLiving} w={3.6} d={2.4} />
      </group>
      <group position={[22.2, 0, 0.4]}>
        <Rug mat={mats.rugBed} w={4.2} d={3.4} />
      </group>
      <group position={[22.2, 0, -13]}>
        <Rug mat={mats.rugLiving} w={4.0} d={3.2} />
      </group>

      <group position={[-6.8, 0, 12.2]}>
        <FloorLamp brass={mats.brass} shade={mats.shade} />
      </group>
      <group position={[-14.4, 0, 2.7]}>
        <FloorLamp brass={mats.brass} shade={mats.shade} />
      </group>
      <group position={[12.2, 0, 2.55]}>
        <TableLamp brass={mats.brass} shade={mats.shade} />
      </group>
      <group position={[12.2, 0, -1.15]}>
        <TableLamp brass={mats.brass} shade={mats.shade} />
      </group>
      <group position={[-24.6, 0, -5.2]}>
        <FloorLamp brass={mats.brass} shade={mats.shade} />
      </group>
      <group position={[24.4, 0, -13.6]}>
        <TableLamp brass={mats.brass} shade={mats.shade} />
      </group>
      <group position={[-15.6, 0, 2.5]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[-15.6, 0, -1.8]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[16.4, 0, 2.8]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[-6.4, 0, -10.4]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[-12.5, 0, -25.8]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[12.6, 0, -27.2]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[5.2, 0, 13.4]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[-5.2, 0, 13.4]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[-3.4, 0, 17.15]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[3.4, 0, 17.15]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[-12.6, 0, 20.4]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[12.4, 0, 21.2]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[-24.8, 0, 2.4]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[24.6, 0, 2.6]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>
      <group position={[24.8, 0, -19.2]}>
        <Plant pot={mats.terracotta} leaf={mats.leaf} leaf2={mats.leaf2} />
      </group>

      {PLACEMENTS.map((p, i) => {
        const product = PRODUCT_MAP[p.productId];
        if (!product) return null;
        return (
          <group
            key={`${p.productId}-${i}`}
            position={[p.x, 0, p.z]}
            rotation={[0, p.rot, 0]}
            userData={{ productId: p.productId }}
            onClick={onXrPick}
            onPointerOver={onXrHover}
          >
            <ProductPiece kind={product.kind} fabric={product.fabric} mats={mats} />
          </group>
        );
      })}

      <HiddenCoupons />

      <Chandelier />
      <CanLight p={[-10, 4.25, 0.4]} />
      <CanLight p={[-12, 4.25, -12]} />
      <CanLight p={[10, 4.25, 0.4]} />
      <CanLight p={[10, 4.25, -12]} />
      <CanLight p={[0, 4.25, 12]} />
      <CanLight p={[0, 4.25, -8]} />
      <CanLight p={[-7, 4.25, -25]} />
      <CanLight p={[7, 4.25, -25]} />
      <CanLight p={[-22, 4.25, -8]} />
      <CanLight p={[-22, 4.25, -16]} />
      <CanLight p={[22, 4.25, 0.4]} />
      <CanLight p={[22, 4.25, -12]} />

    </group>
  );
}


