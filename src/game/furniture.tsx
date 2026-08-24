import type { Material } from "three";
import { geo } from "./geo";
import { fabricMat, type StoreMats } from "./materials";
import type { FurnitureKind } from "@/lib/catalog";

function Box({
  p,
  s,
  m,
  cast = true,
  receive = true,
}: {
  p: [number, number, number];
  s: [number, number, number];
  m: Material;
  cast?: boolean;
  receive?: boolean;
}) {
  return (
    <mesh
      geometry={geo.box}
      position={p}
      scale={s}
      material={m}
      castShadow={cast}
      receiveShadow={receive}
    />
  );
}

function Cyl({
  p,
  s,
  m,
  r = [0, 0, 0] as [number, number, number],
}: {
  p: [number, number, number];
  s: [number, number, number];
  m: Material;
  r?: [number, number, number];
}) {
  return (
    <mesh
      geometry={geo.cyl}
      position={p}
      rotation={r}
      scale={s}
      material={m}
      castShadow
    />
  );
}

function Sph({
  p,
  r,
  m,
}: {
  p: [number, number, number];
  r: number;
  m: Material;
}) {
  return <mesh geometry={geo.sph} position={p} scale={[r, r, r]} material={m} castShadow />;
}

function Legs(wood: Material, xs: number[], zs: number[], y = 0.08, h = 0.16, r = 0.035) {
  return (
    <>
      {xs.flatMap((x) =>
        zs.map((z) => <Cyl key={`${x}:${z}`} p={[x, y, z]} s={[r, h, r]} m={wood} />),
      )}
    </>
  );
}

function Knob({ p, m }: { p: [number, number, number]; m: Material }) {
  return <Cyl p={p} s={[0.012, 0.03, 0.012]} r={[Math.PI / 2, 0, 0]} m={m} />;
}

export function SofaMesh({
  mat,
  pillow,
  wood,
  width = 2.35,
  armLeft = true,
  armRight = true,
}: {
  mat: Material;
  pillow: Material;
  wood: Material;
  width?: number;
  armLeft?: boolean;
  armRight?: boolean;
}) {
  const w = width;
  const seatW = (w - 0.42) / 2;
  return (
    <group>
      <Box p={[0, 0.14, 0]} s={[w - 0.06, 0.1, 0.86]} m={wood} />
      <Box p={[0, 0.24, 0.02]} s={[w - 0.24, 0.08, 0.76]} m={mat} />
      <Box p={[-seatW / 2 - 0.03, 0.4, 0.06]} s={[seatW, 0.15, 0.68]} m={mat} />
      <Box p={[seatW / 2 + 0.03, 0.4, 0.06]} s={[seatW, 0.15, 0.68]} m={mat} />
      <Box p={[0, 0.62, -0.4]} s={[w - 0.08, 0.68, 0.1]} m={mat} />
      <Box p={[-seatW / 2 - 0.03, 0.7, -0.3]} s={[seatW - 0.02, 0.4, 0.14]} m={mat} />
      <Box p={[seatW / 2 + 0.03, 0.7, -0.3]} s={[seatW - 0.02, 0.4, 0.14]} m={mat} />
      {armLeft ? (
        <Cyl p={[-(w / 2 - 0.1), 0.42, 0.02]} s={[0.15, 0.42, 0.15]} r={[Math.PI / 2, 0, 0]} m={mat} />
      ) : null}
      {armRight ? (
        <Cyl p={[w / 2 - 0.1, 0.42, 0.02]} s={[0.15, 0.42, 0.15]} r={[Math.PI / 2, 0, 0]} m={mat} />
      ) : null}
      <group position={[-0.48, 0.58, 0.1]} rotation={[0.08, 0.42, 0.12]}>
        <Box p={[0, 0, 0]} s={[0.28, 0.26, 0.11]} m={pillow} />
      </group>
      <group position={[0.5, 0.58, 0.08]} rotation={[0.1, -0.38, -0.1]}>
        <Box p={[0, 0, 0]} s={[0.26, 0.24, 0.1]} m={pillow} />
      </group>
      {Legs(wood, [-w / 2 + 0.18, w / 2 - 0.18], [-0.3, 0.3])}
    </group>
  );
}

/** Open chaise: long seat, back only on -Z so it can join a 2-seat. */
function ChaiseMesh({
  mat,
  pillow,
  wood,
}: {
  mat: Material;
  pillow: Material;
  wood: Material;
}) {
  const w = 0.94;
  return (
    <group>
      <Box p={[0, 0.14, 0.28]} s={[w, 0.1, 1.52]} m={wood} />
      <Box p={[0, 0.28, 0.32]} s={[w - 0.08, 0.18, 1.42]} m={mat} />
      <Box p={[0, 0.38, 0.05]} s={[w - 0.14, 0.08, 0.72]} m={mat} />
      <Box p={[0, 0.38, 0.72]} s={[w - 0.14, 0.08, 0.62]} m={mat} />
      <Box p={[0, 0.62, -0.4]} s={[w - 0.04, 0.64, 0.16]} m={mat} />
      <Box p={[0, 0.72, -0.28]} s={[w - 0.12, 0.38, 0.12]} m={mat} />
      <group position={[-0.18, 0.52, -0.12]} rotation={[0.12, 0.35, 0.08]}>
        <Box p={[0, 0, 0]} s={[0.3, 0.22, 0.1]} m={pillow} />
      </group>
      <group position={[0.16, 0.5, 0.08]} rotation={[0.2, -0.4, -0.06]}>
        <Box p={[0, 0, 0]} s={[0.26, 0.2, 0.09]} m={pillow} />
      </group>
      {Legs(wood, [-w / 2 + 0.14, w / 2 - 0.14], [-0.38, 0.9])}
    </group>
  );
}

export function ChairMesh({
  mat,
  wood,
  pillow,
}: {
  mat: Material;
  wood: Material;
  pillow?: Material;
}) {
  return (
    <group>
      <Box p={[0, 0.32, 0]} s={[0.68, 0.08, 0.68]} m={wood} />
      <Box p={[0, 0.42, 0.02]} s={[0.62, 0.12, 0.6]} m={mat} />
      <Box p={[0, 0.74, -0.28]} s={[0.64, 0.56, 0.1]} m={mat} />
      <Cyl p={[-0.3, 0.5, 0.02]} s={[0.09, 0.32, 0.09]} r={[Math.PI / 2, 0, 0]} m={mat} />
      <Cyl p={[0.3, 0.5, 0.02]} s={[0.09, 0.32, 0.09]} r={[Math.PI / 2, 0, 0]} m={mat} />
      {pillow ? (
        <group position={[0.08, 0.62, 0.04]} rotation={[0.15, -0.3, 0.08]}>
          <Box p={[0, 0, 0]} s={[0.2, 0.18, 0.08]} m={pillow} />
        </group>
      ) : null}
      {Legs(wood, [-0.24, 0.24], [-0.24, 0.24], 0.1, 0.2, 0.03)}
    </group>
  );
}

export function SectionalMesh({
  mat,
  pillow,
  wood,
}: {
  mat: Material;
  pillow: Material;
  wood: Material;
}) {
  // 2-seat + left lounger, shared back line (local -Z), matching the Navi photo.
  return (
    <group>
      <group position={[0.52, 0, 0]}>
        <SofaMesh mat={mat} pillow={pillow} wood={wood} width={1.88} armLeft={false} />
      </group>
      <group position={[-0.7, 0, 0]}>
        <ChaiseMesh mat={mat} pillow={pillow} wood={wood} />
      </group>
    </group>
  );
}

export function CoffeeMesh({ wood, top }: { wood: Material; top?: Material }) {
  const t = top ?? wood;
  return (
    <group>
      <Box p={[0, 0.4, 0]} s={[1.28, 0.05, 0.72]} m={t} />
      <Box p={[0, 0.37, 0]} s={[1.22, 0.03, 0.66]} m={wood} />
      <Box p={[0, 0.18, 0]} s={[1.08, 0.035, 0.56]} m={wood} />
      {Legs(wood, [-0.52, 0.52], [-0.26, 0.26], 0.18, 0.36, 0.032)}
    </group>
  );
}

export function TvStandMesh({ wood, screen, metal }: { wood: Material; screen: Material; metal: Material }) {
  return (
    <group>
      <Box p={[0, 0.28, 0]} s={[1.88, 0.08, 0.44]} m={wood} />
      <Box p={[0, 0.08, 0]} s={[1.82, 0.04, 0.4]} m={wood} />
      <Box p={[-0.58, 0.22, 0]} s={[0.58, 0.28, 0.38]} m={wood} />
      <Box p={[0.58, 0.22, 0]} s={[0.58, 0.28, 0.38]} m={wood} />
      <Box p={[-0.58, 0.22, 0.2]} s={[0.42, 0.18, 0.02]} m={wood} />
      <Box p={[0.58, 0.22, 0.2]} s={[0.42, 0.18, 0.02]} m={wood} />
      <Knob p={[-0.58, 0.22, 0.22]} m={metal} />
      <Knob p={[0.58, 0.22, 0.22]} m={metal} />
      <Box p={[0, 1.08, -0.04]} s={[1.58, 0.88, 0.05]} m={metal} />
      <Box p={[0, 1.08, -0.018]} s={[1.48, 0.8, 0.03]} m={screen} />
      <Box p={[0, 0.58, -0.04]} s={[0.18, 0.1, 0.08]} m={metal} />
    </group>
  );
}

export function BedMesh({
  wood,
  fabric,
  linen,
  tall = true,
  twin = false,
}: {
  wood: Material;
  fabric: Material;
  linen: Material;
  tall?: boolean;
  twin?: boolean;
}) {
  const w = twin ? 1.12 : 1.72;
  const hb = tall ? 1.32 : 1.08;
  return (
    <group>
      <Box p={[0, hb / 2, -0.95]} s={[w + 0.04, hb, 0.1]} m={wood} />
      <Box p={[0, 0.26, 0.05]} s={[w, 0.14, 2.02]} m={wood} />
      <Box p={[0, 0.22, 0.98]} s={[w, 0.26, 0.08]} m={wood} />
      <Box p={[0, 0.46, 0.08]} s={[w - 0.08, 0.2, 1.92]} m={linen} />
      <Box p={[0, 0.58, 0.18]} s={[w - 0.16, 0.08, 1.42]} m={fabric} />
      <Box p={[0, 0.56, 0.72]} s={[w - 0.2, 0.05, 0.36]} m={linen} />
      <Box p={[-w * 0.22, 0.72, -0.58]} s={[w * 0.32, 0.14, 0.3]} m={linen} />
      <Box p={[w * 0.22, 0.72, -0.58]} s={[w * 0.32, 0.14, 0.3]} m={linen} />
      <Box p={[-w * 0.22, 0.8, -0.62]} s={[w * 0.26, 0.08, 0.18]} m={linen} />
      <Box p={[w * 0.22, 0.8, -0.62]} s={[w * 0.26, 0.08, 0.18]} m={linen} />
    </group>
  );
}

export function NightstandMesh({ wood, metal }: { wood: Material; metal: Material }) {
  return (
    <group>
      <Box p={[0, 0.3, 0]} s={[0.5, 0.46, 0.4]} m={wood} />
      <Box p={[0, 0.55, 0]} s={[0.54, 0.04, 0.44]} m={wood} />
      <Box p={[0, 0.36, 0.21]} s={[0.38, 0.12, 0.02]} m={wood} />
      <Box p={[0, 0.18, 0.12]} s={[0.36, 0.14, 0.16]} m={wood} />
      <Knob p={[0, 0.36, 0.23]} m={metal} />
    </group>
  );
}

export function DresserMesh({ wood, metal }: { wood: Material; metal: Material }) {
  return (
    <group>
      <Box p={[0, 0.48, 0]} s={[1.72, 0.9, 0.48]} m={wood} />
      <Box p={[0, 0.95, 0]} s={[1.78, 0.05, 0.52]} m={wood} />
      {[-0.44, 0, 0.44].map((x) =>
        [0.26, 0.5, 0.74].map((y) => (
          <group key={`${x}${y}`}>
            <Box p={[x, y, 0.25]} s={[0.46, 0.18, 0.02]} m={wood} />
            <Knob p={[x, y, 0.27]} m={metal} />
          </group>
        )),
      )}
    </group>
  );
}

export function TableMesh({ wood, top }: { wood: Material; top: Material }) {
  return (
    <group>
      <Box p={[0, 0.77, 0]} s={[2.08, 0.06, 1.02]} m={top} />
      <Box p={[0, 0.72, 0]} s={[1.98, 0.04, 0.94]} m={wood} />
      <Box p={[0, 0.4, 0]} s={[1.46, 0.07, 0.14]} m={wood} />
      <Box p={[-0.86, 0.38, 0]} s={[0.1, 0.76, 0.72]} m={wood} />
      <Box p={[0.86, 0.38, 0]} s={[0.1, 0.76, 0.72]} m={wood} />
    </group>
  );
}

export function DiningChairMesh({ wood, seat }: { wood: Material; seat: Material }) {
  return (
    <group>
      <Box p={[0, 0.48, 0]} s={[0.46, 0.06, 0.46]} m={seat} />
      <Box p={[0, 0.52, 0]} s={[0.42, 0.04, 0.42]} m={seat} />
      <Box p={[0, 0.88, -0.2]} s={[0.44, 0.72, 0.05]} m={wood} />
      <Box p={[-0.12, 0.92, -0.2]} s={[0.03, 0.48, 0.02]} m={wood} />
      <Box p={[0.12, 0.92, -0.2]} s={[0.03, 0.48, 0.02]} m={wood} />
      <Box p={[0, 0.28, 0]} s={[0.4, 0.03, 0.04]} m={wood} />
      {Legs(wood, [-0.16, 0.16], [-0.16, 0.16], 0.24, 0.48, 0.022)}
    </group>
  );
}

export function BuffetMesh({ wood, metal }: { wood: Material; metal: Material }) {
  return (
    <group>
      <Box p={[0, 0.5, 0]} s={[1.92, 0.86, 0.48]} m={wood} />
      <Box p={[0, 0.96, 0]} s={[2.0, 0.06, 0.54]} m={wood} />
      {[-0.5, 0.5].map((x) => (
        <group key={x}>
          <Box p={[x, 0.48, 0.25]} s={[0.72, 0.62, 0.02]} m={wood} />
          <Knob p={[x - 0.16, 0.48, 0.27]} m={metal} />
          <Knob p={[x + 0.16, 0.48, 0.27]} m={metal} />
        </group>
      ))}
    </group>
  );
}

export function MattressMesh({
  cover,
  foam,
  label,
}: {
  cover: Material;
  foam: Material;
  label: Material;
}) {
  return (
    <group>
      <Box p={[0, 0.12, 0]} s={[2.08, 0.08, 1.08]} m={foam} />
      <Box p={[0, 0.22, 0]} s={[2.05, 0.12, 1.05]} m={foam} />
      <Box p={[0, 0.42, 0]} s={[2.02, 0.28, 1.02]} m={cover} />
      <Box p={[0, 0.58, 0]} s={[1.96, 0.06, 0.96]} m={cover} />
      {[-0.6, -0.2, 0.2, 0.6].map((x) => (
        <Box key={x} p={[x, 0.6, 0]} s={[0.02, 0.01, 0.86]} m={foam} />
      ))}
      <Box p={[0.72, 0.62, 0]} s={[0.28, 0.02, 0.16]} m={label} />
    </group>
  );
}

export function OutdoorSofaMesh({ mat, wood }: { mat: Material; wood: Material }) {
  return (
    <group>
      <Box p={[0, 0.26, 0]} s={[2.22, 0.16, 0.86]} m={wood} />
      <Box p={[0, 0.42, 0.02]} s={[2.02, 0.14, 0.7]} m={mat} />
      <Box p={[0, 0.66, -0.32]} s={[2.02, 0.42, 0.14]} m={mat} />
      <Box p={[-1.02, 0.5, 0]} s={[0.14, 0.42, 0.86]} m={wood} />
      <Box p={[1.02, 0.5, 0]} s={[0.14, 0.42, 0.86]} m={wood} />
      {[-0.5, 0.5].map((x) => (
        <Box key={x} p={[x, 0.56, 0.08]} s={[0.28, 0.12, 0.18]} m={mat} />
      ))}
    </group>
  );
}

export function OutdoorTableMesh({ wood }: { wood: Material }) {
  return (
    <group>
      <Box p={[0, 0.38, 0]} s={[1.15, 0.05, 0.65]} m={wood} />
      {[-0.4, -0.15, 0.15, 0.4].map((z) => (
        <Box key={z} p={[0, 0.4, z]} s={[1.1, 0.02, 0.04]} m={wood} />
      ))}
      {Legs(wood, [-0.46, 0.46], [-0.24, 0.24], 0.18, 0.36, 0.03)}
    </group>
  );
}

export function OutdoorDiningMesh({ wood, mat }: { wood: Material; mat: Material }) {
  return (
    <group>
      <Box p={[0, 0.74, 0]} s={[2.2, 0.06, 1.05]} m={wood} />
      {Legs(wood, [-0.9, 0.9], [-0.4, 0.4], 0.37, 0.74, 0.04)}
      {[
        [-0.7, 0.7],
        [0, 0.7],
        [0.7, 0.7],
        [-0.7, -0.7],
        [0, -0.7],
        [0.7, -0.7],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, z > 0 ? Math.PI : 0, 0]}>
          <DiningChairMesh wood={wood} seat={mat} />
        </group>
      ))}
      <Cyl p={[0, 1.7, 0]} s={[0.025, 2.2, 0.025]} m={wood} />
      <mesh geometry={geo.cone} position={[0, 2.55, 0]} scale={[1.4, 0.55, 1.4]} material={mat} />
    </group>
  );
}

export function DeskMesh({ wood, top }: { wood: Material; top: Material }) {
  return (
    <group>
      <Box p={[0, 0.76, 0]} s={[1.7, 0.05, 0.68]} m={top} />
      <Box p={[-0.68, 0.38, 0]} s={[0.28, 0.72, 0.62]} m={wood} />
      <Box p={[0.68, 0.38, 0]} s={[0.28, 0.72, 0.62]} m={wood} />
      <Box p={[-0.68, 0.5, 0.32]} s={[0.2, 0.1, 0.02]} m={wood} />
      <Box p={[0.68, 0.5, 0.32]} s={[0.2, 0.1, 0.02]} m={wood} />
      <Box p={[0, 0.52, -0.28]} s={[1.5, 0.28, 0.06]} m={wood} />
    </group>
  );
}

export function ReclinerMesh({ mat, wood, pillow }: { mat: Material; wood: Material; pillow: Material }) {
  return (
    <group>
      <Box p={[0, 0.28, 0.05]} s={[0.86, 0.14, 0.86]} m={mat} />
      <Box p={[0, 0.42, 0.08]} s={[0.78, 0.14, 0.72]} m={mat} />
      <Box p={[0, 0.68, -0.28]} s={[0.82, 0.72, 0.16]} m={mat} />
      <Box p={[0, 0.32, 0.55]} s={[0.78, 0.1, 0.42]} m={mat} />
      <Cyl p={[-0.4, 0.48, 0.02]} s={[0.1, 0.36, 0.1]} r={[Math.PI / 2, 0, 0]} m={mat} />
      <Cyl p={[0.4, 0.48, 0.02]} s={[0.1, 0.36, 0.1]} r={[Math.PI / 2, 0, 0]} m={mat} />
      <group position={[0.12, 0.62, 0.02]} rotation={[0.2, -0.25, 0]}>
        <Box p={[0, 0, 0]} s={[0.22, 0.2, 0.08]} m={pillow} />
      </group>
      {Legs(wood, [-0.32, 0.32], [-0.28, 0.28], 0.1, 0.16, 0.03)}
    </group>
  );
}

export function OttomanMesh({ mat, wood }: { mat: Material; wood: Material }) {
  return (
    <group>
      <Box p={[0, 0.22, 0]} s={[0.72, 0.28, 0.72]} m={mat} />
      <Box p={[0, 0.38, 0]} s={[0.68, 0.06, 0.68]} m={mat} />
      {Legs(wood, [-0.26, 0.26], [-0.26, 0.26], 0.06, 0.1, 0.03)}
    </group>
  );
}

const BOOK_COLORS = ["bookRed", "bookBlue", "bookGreen", "bookCream", "navy", "rust"] as const;

export function BookshelfMesh({
  wood,
  mats,
}: {
  wood: Material;
  mats: StoreMats;
}) {
  const books = [];
  for (let shelf = 0; shelf < 4; shelf++) {
    let x = -0.46;
    let i = 0;
    while (x < 0.46) {
      const w = 0.05 + ((shelf * 7 + i * 3) % 5) * 0.012;
      const h = 0.18 + ((shelf + i * 5) % 4) * 0.03;
      const key = BOOK_COLORS[(shelf * 5 + i) % BOOK_COLORS.length];
      books.push(
        <Box
          key={`${shelf}-${i}`}
          p={[x + w / 2, 0.28 + shelf * 0.42 + h / 2, 0.02]}
          s={[w, h, 0.16]}
          m={mats[key]}
        />,
      );
      x += w + 0.012;
      i += 1;
    }
  }
  return (
    <group>
      <Box p={[0, 0.96, 0]} s={[1.12, 1.92, 0.32]} m={wood} />
      <Box p={[0, 0.96, 0.14]} s={[1.04, 1.82, 0.02]} m={wood} />
      {[0.18, 0.6, 1.02, 1.44, 1.86].map((y) => (
        <Box key={y} p={[0, y, 0.02]} s={[1.04, 0.03, 0.28]} m={wood} />
      ))}
      {books}
    </group>
  );
}

export function ConsoleMesh({ wood, top }: { wood: Material; top: Material }) {
  return (
    <group>
      <Box p={[0, 0.78, 0]} s={[1.7, 0.05, 0.38]} m={top} />
      <Box p={[0, 0.42, 0]} s={[1.58, 0.04, 0.3]} m={wood} />
      {Legs(wood, [-0.76, 0.76], [-0.12, 0.12], 0.38, 0.76, 0.028)}
    </group>
  );
}

export function IslandMesh({ wood, top, metal }: { wood: Material; top: Material; metal: Material }) {
  return (
    <group>
      <Box p={[0, 0.46, 0]} s={[1.72, 0.78, 0.82]} m={wood} />
      <Box p={[0, 0.88, 0]} s={[1.86, 0.07, 0.94]} m={top} />
      <Box p={[0, 0.22, 0]} s={[1.58, 0.04, 0.7]} m={wood} />
      <Box p={[-0.4, 0.5, 0.42]} s={[0.55, 0.36, 0.02]} m={wood} />
      <Box p={[0.4, 0.5, 0.42]} s={[0.55, 0.36, 0.02]} m={wood} />
      <Knob p={[-0.4, 0.5, 0.44]} m={metal} />
      <Knob p={[0.4, 0.5, 0.44]} m={metal} />
    </group>
  );
}

export function StoolMesh({ wood, seat }: { wood: Material; seat: Material }) {
  return (
    <group>
      <Cyl p={[0, 0.68, 0]} s={[0.18, 0.06, 0.18]} m={seat} />
      <Cyl p={[0, 0.36, 0]} s={[0.03, 0.64, 0.03]} m={wood} />
      <Cyl p={[0, 0.32, 0]} s={[0.16, 0.02, 0.16]} m={wood} />
      {Legs(wood, [-0.12, 0.12], [-0.12, 0.12], 0.18, 0.36, 0.018)}
    </group>
  );
}

export function OfficeChairMesh({ mat, metal }: { mat: Material; metal: Material }) {
  return (
    <group>
      <Cyl p={[0, 0.08, 0]} s={[0.06, 0.06, 0.06]} m={metal} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i}>
            <Cyl
              p={[Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16]}
              s={[0.018, 0.22, 0.018]}
              r={[0, a, Math.PI / 2]}
              m={metal}
            />
            <Cyl p={[Math.cos(a) * 0.32, 0.04, Math.sin(a) * 0.32]} s={[0.035, 0.04, 0.035]} m={metal} />
          </group>
        );
      })}
      <Cyl p={[0, 0.28, 0]} s={[0.028, 0.36, 0.028]} m={metal} />
      <Box p={[0, 0.5, 0.02]} s={[0.5, 0.08, 0.5]} m={mat} />
      <Box p={[0, 0.82, -0.2]} s={[0.48, 0.52, 0.08]} m={mat} />
    </group>
  );
}

export function WardrobeMesh({ wood, metal }: { wood: Material; metal: Material }) {
  return (
    <group>
      <Box p={[0, 1.05, 0]} s={[1.15, 2.1, 0.52]} m={wood} />
      <Box p={[0, 2.12, 0]} s={[1.2, 0.06, 0.56]} m={wood} />
      <Box p={[-0.28, 1.05, 0.27]} s={[0.5, 1.9, 0.02]} m={wood} />
      <Box p={[0.28, 1.05, 0.27]} s={[0.5, 1.9, 0.02]} m={wood} />
      <Knob p={[-0.06, 1.05, 0.29]} m={metal} />
      <Knob p={[0.06, 1.05, 0.29]} m={metal} />
    </group>
  );
}

export function HutchMesh({ wood, metal, glass }: { wood: Material; metal: Material; glass: Material }) {
  return (
    <group>
      <BuffetMesh wood={wood} metal={metal} />
      <Box p={[0, 1.55, 0]} s={[1.88, 1.05, 0.42]} m={wood} />
      <Box p={[-0.46, 1.55, 0.2]} s={[0.78, 0.88, 0.02]} m={glass} />
      <Box p={[0.46, 1.55, 0.2]} s={[0.78, 0.88, 0.02]} m={glass} />
      <Box p={[0, 1.28, 0.02]} s={[1.76, 0.03, 0.34]} m={wood} />
      <Box p={[0, 1.62, 0.02]} s={[1.76, 0.03, 0.34]} m={wood} />
      <Knob p={[-0.12, 1.5, 0.22]} m={metal} />
      <Knob p={[0.12, 1.5, 0.22]} m={metal} />
    </group>
  );
}

export function BenchMesh({ wood, mat }: { wood: Material; mat: Material }) {
  return (
    <group>
      <Box p={[0, 0.28, 0]} s={[1.2, 0.22, 0.4]} m={wood} />
      <Box p={[0, 0.42, 0]} s={[1.16, 0.08, 0.36]} m={mat} />
      {Legs(wood, [-0.5, 0.5], [-0.12, 0.12], 0.12, 0.24, 0.028)}
    </group>
  );
}

export function FloorLamp({ brass, shade }: { brass: Material; shade: Material }) {
  return (
    <group>
      <Cyl p={[0, 0.04, 0]} s={[0.16, 0.04, 0.16]} m={brass} />
      <Cyl p={[0, 0.85, 0]} s={[0.025, 1.7, 0.025]} m={brass} />
      <mesh geometry={geo.cone} position={[0, 1.72, 0]} scale={[0.22, 0.28, 0.22]} material={shade} />
    </group>
  );
}

export function TableLamp({ brass, shade }: { brass: Material; shade: Material }) {
  return (
    <group>
      <Cyl p={[0, 0.04, 0]} s={[0.08, 0.04, 0.08]} m={brass} />
      <Cyl p={[0, 0.18, 0]} s={[0.018, 0.28, 0.018]} m={brass} />
      <mesh geometry={geo.cone} position={[0, 0.38, 0]} scale={[0.12, 0.16, 0.12]} material={shade} />
    </group>
  );
}

export function Plant({ pot, leaf, leaf2 }: { pot: Material; leaf: Material; leaf2: Material }) {
  return (
    <group>
      <Cyl p={[0, 0.16, 0]} s={[0.16, 0.32, 0.16]} m={pot} />
      <Cyl p={[0, 0.5, 0]} s={[0.03, 0.5, 0.03]} m={leaf2} />
      <Sph p={[0.08, 0.85, 0.02]} r={0.22} m={leaf} />
      <Sph p={[-0.1, 0.95, -0.04]} r={0.18} m={leaf2} />
      <Sph p={[0.02, 1.08, 0.08]} r={0.16} m={leaf} />
    </group>
  );
}

export function Rug({
  mat,
  w,
  d,
}: {
  mat: Material;
  w: number;
  d: number;
}) {
  return (
    <mesh
      geometry={geo.box}
      position={[0, 0.012, 0]}
      scale={[w, 0.018, d]}
      material={mat}
      receiveShadow
    />
  );
}

export function ProductPiece({
  kind,
  fabric,
  mats,
}: {
  kind: FurnitureKind;
  fabric: string;
  mats: StoreMats;
}) {
  const body = fabricMat(mats, fabric);
  const pillow =
    fabric === "pebble" || fabric === "linen" || fabric === "sand" || fabric === "blush"
      ? mats.pillowNavy
      : mats.pillowTerracotta;
  const lightWood = fabric === "whitewash" ? mats.whitewash : mats.oak;
  const dark = fabric === "whitewash" ? mats.whitewash : mats.darkWood;
  switch (kind) {
    case "sofa":
      return <SofaMesh mat={body} pillow={pillow} wood={mats.oak} />;
    case "sectional":
      return <SectionalMesh mat={body} pillow={pillow} wood={mats.oak} />;
    case "chair":
      return <ChairMesh mat={body} wood={mats.oak} pillow={pillow} />;
    case "coffee":
      return <CoffeeMesh wood={lightWood} top={mats.oak} />;
    case "tvstand":
      return <TvStandMesh wood={lightWood} screen={mats.screen} metal={mats.blackMetal} />;
    case "bed":
      return (
        <BedMesh
          wood={fabric === "whitewash" ? mats.whitewash : mats.darkWood}
          fabric={body}
          linen={mats.linen}
          tall={fabric !== "whitewash"}
        />
      );
    case "twin-bed":
      return <BedMesh wood={mats.oak} fabric={body} linen={mats.linen} tall={false} twin />;
    case "nightstand":
      return <NightstandMesh wood={lightWood} metal={mats.brass} />;
    case "dresser":
      return <DresserMesh wood={dark} metal={mats.brass} />;
    case "table":
      return <TableMesh wood={mats.whitewash} top={mats.oak} />;
    case "dining-chair":
      return <DiningChairMesh wood={mats.whitewash} seat={mats.linen} />;
    case "buffet":
      return <BuffetMesh wood={mats.darkWood} metal={mats.brass} />;
    case "mattress":
      return <MattressMesh cover={body} foam={mats.mattressQuilt} label={mats.orange} />;
    case "outdoor-sofa":
      return <OutdoorSofaMesh mat={body} wood={mats.oak} />;
    case "outdoor-table":
      return <OutdoorTableMesh wood={mats.oak} />;
    case "outdoor-dining":
      return <OutdoorDiningMesh wood={mats.oak} mat={body} />;
    case "desk":
      return <DeskMesh wood={dark} top={mats.oak} />;
    case "recliner":
      return <ReclinerMesh mat={body} wood={mats.oak} pillow={pillow} />;
    case "ottoman":
      return <OttomanMesh mat={body} wood={mats.oak} />;
    case "bookshelf":
      return <BookshelfMesh wood={dark} mats={mats} />;
    case "console":
      return <ConsoleMesh wood={lightWood} top={mats.oak} />;
    case "island":
      return <IslandMesh wood={mats.whitewash} top={mats.oak} metal={mats.brass} />;
    case "stool":
      return <StoolMesh wood={mats.oak} seat={body} />;
    case "office-chair":
      return <OfficeChairMesh mat={body} metal={mats.blackMetal} />;
    case "wardrobe":
      return <WardrobeMesh wood={mats.darkWood} metal={mats.brass} />;
    case "hutch":
      return <HutchMesh wood={dark} metal={mats.brass} glass={mats.glass} />;
    case "bench":
      return <BenchMesh wood={dark} mat={mats.linen} />;
    default:
      return <Box p={[0, 0.4, 0]} s={[1, 0.8, 1]} m={body} />;
  }
}
