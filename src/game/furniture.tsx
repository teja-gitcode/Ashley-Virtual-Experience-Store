import type { Material } from "three";
import { geo } from "./geo";
import { fabricMat, type StoreMats } from "./materials";
import type { FurnitureKind, FurnitureProfile, SizeIn } from "@/lib/catalog";

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
      <Box p={[0.72, 0.64, 0.05]} s={[0.42, 0.1, 0.62]} m={cover} />
      <Box p={[0.78, 0.7, -0.02]} s={[0.36, 0.06, 0.48]} m={label} />
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

const M = 0.0254;

/** Unscaled mesh size in meters: width, height, depth. Used only when My Room scales an original piece. */
const NOMINAL_M: Record<FurnitureKind, [number, number, number]> = {
  sofa: [2.35, 0.96, 0.92],
  sectional: [2.65, 0.95, 1.75],
  chair: [0.72, 0.95, 0.72],
  coffee: [1.28, 0.46, 0.72],
  tvstand: [1.88, 1.55, 0.48],
  bed: [1.76, 1.32, 2.15],
  "twin-bed": [1.16, 1.08, 2.15],
  dresser: [1.78, 0.98, 0.52],
  nightstand: [0.54, 0.58, 0.44],
  mattress: [2.08, 0.64, 1.08],
  table: [2.08, 0.82, 1.02],
  "dining-chair": [0.48, 1.16, 0.5],
  buffet: [2.0, 1.0, 0.54],
  "outdoor-sofa": [2.22, 0.85, 0.95],
  "outdoor-table": [1.15, 0.45, 0.65],
  "outdoor-dining": [2.4, 2.8, 2.4],
  desk: [1.7, 0.8, 0.7],
  recliner: [0.9, 1.05, 1.05],
  ottoman: [0.72, 0.42, 0.72],
  bookshelf: [1.12, 1.96, 0.36],
  console: [1.7, 0.82, 0.4],
  island: [1.86, 0.92, 0.94],
  stool: [0.4, 0.74, 0.4],
  "office-chair": [0.7, 1.08, 0.7],
  wardrobe: [1.2, 2.15, 0.56],
  hutch: [2.0, 2.15, 0.54],
  bench: [1.2, 0.48, 0.42],
};

function ProfilePiece({
  profile,
  size,
  fabric,
  mats,
}: {
  profile: FurnitureProfile;
  size: SizeIn;
  fabric: string;
  mats: StoreMats;
}) {
  const w = size.w * M;
  const d = size.d * M;
  const h = size.h * M;
  const mat = fabricMat(mats, fabric);
  const pillow = mats.pillowNavy;
  const wood = fabric === "whitewash" || fabric === "sand" ? mats.whitewash : mats.darkWood;
  switch (profile) {
    case "sofa-track":
      return <TrackSofa w={w} d={d} h={h} mat={mat} pillow={pillow} wood={mats.oak} trim={mats.charcoal} />;
    case "accent-chair":
      return <TrackChair w={w} d={d} h={h} mat={mat} pillow={pillow} wood={mats.oak} trim={mats.charcoal} />;
    case "bed-upholstered":
      return <UpholsteredBed w={w} d={d} h={h} mat={mat} linen={mats.linen} trim={mats.charcoal} />;
    case "chest":
      return <ChestMesh w={w} d={d} h={h} wood={mats.darkWood} metal={mats.brass} drawers={5} />;
    case "table-leg":
      return <LegTable w={w} d={d} h={h} wood={mats.darkWood} top={mats.darkWood} />;
    case "side-chair":
      return <SideChair w={w} d={d} h={h} wood={mats.darkWood} seat={mat} />;
    case "counter-table":
      return <LegTable w={w} d={d} h={h} wood={mats.oak} top={mats.oak} />;
    case "pantry":
      return <PantryMesh w={w} d={d} h={h} wood={wood} metal={mats.brass} />;
    case "file-cabinet":
      return <ChestMesh w={w} d={d} h={h} wood={mats.darkWood} metal={mats.brass} drawers={2} wide />;
    case "bookcase":
      return <OpenBookcase w={w} d={d} h={h} wood={mats.oak} mats={mats} />;
    case "swivel-lounge":
      return <SwivelLounge w={w} d={d} h={h} mat={mat} base={mats.oak} trim={mats.charcoal} />;
    case "outdoor-ottoman":
      return <OutdoorOttoman w={w} d={d} h={h} mat={mat} base={mats.oak} trim={mats.charcoal} />;
    default:
      return <Box p={[0, h / 2, 0]} s={[w, h, d]} m={mat} />;
  }
}

function Welt({
  p,
  s,
  m,
}: {
  p: [number, number, number];
  s: [number, number, number];
  m: Material;
}) {
  return <Box p={p} s={s} m={m} />;
}

function TrackSofa({
  w,
  d,
  h,
  mat,
  pillow,
  wood,
  trim,
}: {
  w: number;
  d: number;
  h: number;
  mat: Material;
  pillow: Material;
  wood: Material;
  trim: Material;
}) {
  const arm = Math.min(0.15, w * 0.08);
  const inner = w - arm * 2 - 0.02;
  const cushion = inner / 3;
  const backZ = -d / 2 + 0.055;
  const seatZ = 0.04;
  return (
    <group>
      {Legs(wood, [-w / 2 + 0.14, w / 2 - 0.14], [-d / 2 + 0.16, d / 2 - 0.14], 0.04, 0.08, 0.032)}
      <Box p={[0, 0.1, 0.01]} s={[w * 0.9, 0.045, d * 0.78]} m={wood} />
      <Box p={[0, 0.18, seatZ]} s={[inner, 0.1, d * 0.68]} m={mat} />
      {[-1, 0, 1].map((i) => (
        <group key={i}>
          <Box p={[i * cushion, 0.29, seatZ + 0.01]} s={[cushion * 0.9, 0.13, d * 0.6]} m={mat} />
          <Welt p={[i * cushion, 0.29, seatZ + d * 0.3]} s={[cushion * 0.9, 0.02, 0.012]} m={trim} />
        </group>
      ))}
      <Box p={[0, h * 0.5, backZ]} s={[w - 0.02, h * 0.82, 0.09]} m={mat} />
      <Box p={[0, h * 0.5, backZ - 0.04]} s={[w, h * 0.86, 0.02]} m={trim} />
      {[-1, 0, 1].map((i) => (
        <group key={`back-${i}`} position={[i * cushion, h * 0.55, backZ + 0.1]} rotation={[0.14, i * 0.03, 0]}>
          <Box p={[0, 0, 0]} s={[cushion * 0.74, h * 0.4, 0.11]} m={pillow} />
          <Welt p={[0, 0, 0.05]} s={[cushion * 0.74, 0.012, 0.012]} m={trim} />
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box p={[side * (w / 2 - arm / 2), h * 0.36, 0.02]} s={[arm, h * 0.46, d * 0.9]} m={mat} />
          <Box p={[side * (w / 2 - arm / 2), h * 0.36 + h * 0.24, 0.02]} s={[arm + 0.012, 0.04, d * 0.92]} m={mat} />
          <Box p={[side * (w / 2 - arm / 2), 0.2, d / 2 - 0.04]} s={[arm * 0.7, 0.16, 0.04]} m={mat} />
        </group>
      ))}
    </group>
  );
}

function TrackChair({
  w,
  d,
  h,
  mat,
  pillow,
  wood,
  trim,
}: {
  w: number;
  d: number;
  h: number;
  mat: Material;
  pillow: Material;
  wood: Material;
  trim: Material;
}) {
  const arm = Math.min(0.11, w * 0.18);
  const backZ = -d / 2 + 0.05;
  return (
    <group>
      {Legs(wood, [-w / 2 + 0.1, w / 2 - 0.1], [-d / 2 + 0.12, d / 2 - 0.1], 0.04, 0.08, 0.028)}
      <Box p={[0, 0.11, 0.02]} s={[w * 0.86, 0.05, d * 0.74]} m={wood} />
      <Box p={[0, 0.2, 0.04]} s={[w - arm * 2, 0.1, d * 0.62]} m={mat} />
      <Box p={[0, 0.3, 0.05]} s={[w - arm * 2 - 0.02, 0.12, d * 0.56]} m={mat} />
      <Welt p={[0, 0.3, d * 0.3]} s={[w - arm * 2, 0.018, 0.012]} m={trim} />
      <Box p={[0, h * 0.5, backZ]} s={[w - 0.02, h * 0.78, 0.08]} m={mat} />
      <group position={[0, h * 0.55, backZ + 0.09]} rotation={[0.12, 0, 0]}>
        <Box p={[0, 0, 0]} s={[w * 0.48, h * 0.36, 0.1]} m={pillow} />
      </group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box p={[side * (w / 2 - arm / 2), h * 0.36, 0.02]} s={[arm, h * 0.42, d * 0.88]} m={mat} />
          <Box
            p={[side * (w / 2 - arm / 2), h * 0.36 + h * 0.22, 0.02]}
            s={[arm + 0.01, 0.035, d * 0.9]}
            m={mat}
          />
        </group>
      ))}
    </group>
  );
}

function UpholsteredBed({
  w,
  d,
  h,
  mat,
  linen,
  trim,
}: {
  w: number;
  d: number;
  h: number;
  mat: Material;
  linen: Material;
  trim: Material;
}) {
  const tufts = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      tufts.push(
        <Sph
          key={`${row}-${col}`}
          p={[(col - 2) * w * 0.16, 0.28 + row * (h * 0.16), -d / 2 + 0.1]}
          r={0.018}
          m={trim}
        />,
      );
    }
  }
  return (
    <group>
      <Box p={[0, h * 0.48, -d / 2 + 0.05]} s={[w, h * 0.9, 0.1]} m={mat} />
      <Box p={[0, h * 0.93, -d / 2 + 0.05]} s={[w + 0.04, 0.06, 0.14]} m={mat} />
      <Box p={[-w / 2 + 0.06, h * 0.38, -d / 2 + 0.2]} s={[0.1, h * 0.62, 0.34]} m={mat} />
      <Box p={[w / 2 - 0.06, h * 0.38, -d / 2 + 0.2]} s={[0.1, h * 0.62, 0.34]} m={mat} />
      {tufts}
      <Box p={[0, 0.1, 0.02]} s={[w * 0.94, 0.12, d * 0.9]} m={mat} />
      <Box p={[-w / 2 + 0.04, 0.22, 0.02]} s={[0.06, 0.16, d * 0.86]} m={mat} />
      <Box p={[w / 2 - 0.04, 0.22, 0.02]} s={[0.06, 0.16, d * 0.86]} m={mat} />
      <Box p={[0, 0.28, 0.04]} s={[w * 0.88, 0.16, d * 0.78]} m={linen} />
      <Box p={[0, 0.38, 0.08]} s={[w * 0.84, 0.08, d * 0.66]} m={linen} />
      {[-0.25, -0.08, 0.08, 0.25].map((x) => (
        <Box key={x} p={[x * w, 0.425, 0.1]} s={[0.012, 0.012, d * 0.55]} m={trim} />
      ))}
      <Box p={[0, 0.16, d / 2 - 0.05]} s={[w * 0.9, 0.22, 0.08]} m={mat} />
      <Box p={[-w * 0.18, 0.5, -d * 0.28]} s={[w * 0.32, 0.1, 0.36]} m={linen} />
      <Box p={[w * 0.18, 0.5, -d * 0.28]} s={[w * 0.32, 0.1, 0.36]} m={linen} />
      <Box p={[0, 0.56, -d * 0.18]} s={[w * 0.55, 0.06, 0.28]} m={mat} />
    </group>
  );
}

function ChestMesh({
  w,
  d,
  h,
  wood,
  metal,
  drawers,
  wide = false,
}: {
  w: number;
  d: number;
  h: number;
  wood: Material;
  metal: Material;
  drawers: number;
  wide?: boolean;
}) {
  const plinth = 0.06;
  const cap = 0.035;
  const bodyBottom = plinth;
  const bodyTop = h - cap;
  const bodyH = bodyTop - bodyBottom;
  const gap = 0.012;
  const drawerH = (bodyH - gap * (drawers + 1)) / drawers;
  const frontZ = d / 2 - 0.008;
  return (
    <group>
      <Box p={[0, plinth / 2, 0]} s={[w * 0.98, plinth, d * 0.98]} m={wood} />
      <Box p={[0, bodyBottom + bodyH / 2, 0]} s={[w * 0.94, bodyH, d * 0.96]} m={wood} />
      <Box p={[0, h - cap / 2, 0]} s={[w, cap, d]} m={wood} />
      {Array.from({ length: drawers }, (_, i) => {
        const y = bodyBottom + gap + drawerH / 2 + i * (drawerH + gap);
        const pulls = wide ? [-w * 0.18, w * 0.18] : [0];
        return (
          <group key={y}>
            <Box p={[0, y, frontZ]} s={[w * 0.84, drawerH - 0.008, 0.02]} m={wood} />
            {pulls.map((x) => (
              <Cyl
                key={x}
                p={[x, y, frontZ + 0.02]}
                s={[0.01, wide ? 0.1 : Math.min(0.16, w * 0.28), 0.01]}
                r={[0, 0, Math.PI / 2]}
                m={metal}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function LegTable({
  w,
  d,
  h,
  wood,
  top,
}: {
  w: number;
  d: number;
  h: number;
  wood: Material;
  top: Material;
}) {
  const leg = 0.055;
  const topT = 0.046;
  const apronH = 0.08;
  const apronT = 0.028;
  const xLeg = w / 2 - leg * 0.8;
  const zLeg = d / 2 - leg * 0.8;
  const legH = h - topT;
  return (
    <group>
      <Box p={[0, h - topT / 2, 0]} s={[w, topT, d]} m={top} />
      <Box p={[0, h - topT - apronH / 2, d / 2 - leg]} s={[w - leg * 2.2, apronH, apronT]} m={wood} />
      <Box p={[0, h - topT - apronH / 2, -(d / 2 - leg)]} s={[w - leg * 2.2, apronH, apronT]} m={wood} />
      <Box p={[w / 2 - leg, h - topT - apronH / 2, 0]} s={[apronT, apronH, d - leg * 2.2]} m={wood} />
      <Box p={[-(w / 2 - leg), h - topT - apronH / 2, 0]} s={[apronT, apronH, d - leg * 2.2]} m={wood} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Box
          key={`${sx}${sz}`}
          p={[sx * xLeg, legH / 2, sz * zLeg]}
          s={[leg, legH, leg]}
          m={wood}
        />
      ))}
    </group>
  );
}

function SideChair({
  w,
  d,
  h,
  wood,
  seat,
}: {
  w: number;
  d: number;
  h: number;
  wood: Material;
  seat: Material;
}) {
  const seatY = Math.min(0.48, h * 0.46);
  const postTop = h * 0.97;
  const xPost = w * 0.36;
  const zBack = -d * 0.32;
  const zFront = d * 0.3;
  const post = 0.038;
  const railY = 0.18;
  return (
    <group>
      {[-1, 1].map((side) => (
        <Box key={`back-${side}`} p={[side * xPost, postTop / 2, zBack]} s={[post, postTop, post]} m={wood} />
      ))}
      {[-1, 1].map((side) => (
        <Box key={`front-${side}`} p={[side * xPost, seatY / 2, zFront]} s={[0.036, seatY, 0.036]} m={wood} />
      ))}
      <Box p={[0, seatY, 0]} s={[xPost * 2 + post, 0.04, zFront - zBack + post]} m={wood} />
      <Box p={[0, seatY + 0.04, 0.01]} s={[w * 0.7, 0.05, d * 0.58]} m={seat} />
      <Box p={[0, postTop - 0.03, zBack]} s={[xPost * 2, 0.04, post]} m={wood} />
      <Box p={[0, seatY + 0.09, zBack]} s={[xPost * 2 - post, 0.03, 0.022]} m={wood} />
      {[-0.42, 0, 0.42].map((t) => {
        const bottom = seatY + 0.075;
        const top = postTop - 0.05;
        return (
          <Box
            key={t}
            p={[t * xPost, (bottom + top) / 2, zBack]}
            s={[0.02, top - bottom, 0.016]}
            m={wood}
          />
        );
      })}
      <Box p={[0, railY, zBack]} s={[xPost * 2, 0.026, 0.026]} m={wood} />
      <Box p={[0, railY, zFront]} s={[xPost * 2, 0.026, 0.026]} m={wood} />
      <Box p={[-xPost, railY, (zBack + zFront) / 2]} s={[0.026, 0.026, zFront - zBack]} m={wood} />
      <Box p={[xPost, railY, (zBack + zFront) / 2]} s={[0.026, 0.026, zFront - zBack]} m={wood} />
      <Box p={[0, railY, (zBack + zFront) / 2]} s={[0.026, 0.026, zFront - zBack]} m={wood} />
    </group>
  );
}

function PantryMesh({
  w,
  d,
  h,
  wood,
  metal,
}: {
  w: number;
  d: number;
  h: number;
  wood: Material;
  metal: Material;
}) {
  const baseH = 0.09;
  const crownH = 0.07;
  const bodyTop = h - crownH;
  const bodyH = bodyTop - baseH;
  const doorTop = baseH + bodyH * 0.7;
  const doorBottom = baseH + 0.03;
  const doorH = doorTop - doorBottom;
  const doorY = (doorTop + doorBottom) / 2;
  const frontZ = d / 2 + 0.01;
  return (
    <group>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <Box
            key={`${sx}${sz}`}
            p={[sx * (w * 0.42), 0.025, sz * (d * 0.38)]}
            s={[w * 0.16, 0.05, d * 0.18]}
            m={wood}
          />
        )),
      )}
      <Box p={[0, baseH / 2 + 0.02, 0]} s={[w * 1.02, baseH, d * 1.02]} m={wood} />
      <Box p={[0, baseH + bodyH / 2, 0]} s={[w, bodyH, d]} m={wood} />
      <Box p={[0, h - crownH / 2, 0]} s={[w * 1.08, crownH, d * 1.08]} m={wood} />
      <Box p={[0, doorTop, 0.01]} s={[w * 0.9, 0.028, d * 0.86]} m={wood} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box p={[side * w * 0.23, doorY, frontZ]} s={[w * 0.42, doorH, 0.022]} m={wood} />
          <Box p={[side * w * 0.23, doorY + doorH * 0.08, frontZ + 0.012]} s={[w * 0.28, doorH * 0.38, 0.012]} m={wood} />
          <Box p={[side * w * 0.23, doorY - doorH * 0.22, frontZ + 0.012]} s={[w * 0.28, doorH * 0.32, 0.012]} m={wood} />
          <Cyl p={[side * 0.045, doorY, frontZ + 0.03]} s={[0.018, 0.012, 0.018]} m={metal} />
        </group>
      ))}
    </group>
  );
}

function OpenBookcase({
  w,
  d,
  h,
  wood,
  mats,
}: {
  w: number;
  d: number;
  h: number;
  wood: Material;
  mats: StoreMats;
}) {
  const shelves = 4;
  const books = [];
  for (let shelf = 0; shelf < shelves; shelf++) {
    let x = -w * 0.38;
    let i = 0;
    while (x < w * 0.36) {
      const bw = w * 0.06;
      const bh = h * 0.12;
      const key = BOOK_COLORS[(shelf * 3 + i) % BOOK_COLORS.length];
      books.push(
        <Box
          key={`${shelf}-${i}`}
          p={[x, (h * (shelf + 0.55)) / shelves, 0]}
          s={[bw, bh, d * 0.55]}
          m={mats[key]}
        />,
      );
      x += bw + 0.01;
      i += 1;
    }
  }
  return (
    <group>
      <Box p={[-w / 2 + 0.025, h / 2, 0]} s={[0.04, h, d]} m={wood} />
      <Box p={[w / 2 - 0.025, h / 2, 0]} s={[0.04, h, d]} m={wood} />
      <Box p={[0, h - 0.025, 0]} s={[w, 0.05, d]} m={wood} />
      <Box p={[0, 0.03, 0]} s={[w, 0.06, d]} m={wood} />
      <Box p={[0, h / 2, -d / 2 + 0.015]} s={[w * 0.92, h * 0.92, 0.02]} m={wood} />
      {Array.from({ length: shelves - 1 }, (_, i) => (
        <Box key={i} p={[0, (h * (i + 1)) / shelves, 0.01]} s={[w * 0.9, 0.028, d * 0.9]} m={wood} />
      ))}
      {books}
    </group>
  );
}

function WovenBox({
  w,
  d,
  y,
  height,
  base,
}: {
  w: number;
  d: number;
  y: number;
  height: number;
  base: Material;
}) {
  const rows = 7;
  return (
    <group>
      {Array.from({ length: rows }, (_, i) => {
        const yy = y + (height * (i + 0.5)) / rows;
        const t = height / rows * 0.7;
        return (
          <group key={i}>
            <Box p={[0, yy, d / 2]} s={[w, t, 0.012]} m={base} />
            <Box p={[0, yy, -d / 2]} s={[w, t, 0.012]} m={base} />
            <Box p={[-w / 2, yy, 0]} s={[0.012, t, d]} m={base} />
            <Box p={[w / 2, yy, 0]} s={[0.012, t, d]} m={base} />
          </group>
        );
      })}
    </group>
  );
}

function SwivelLounge({
  w,
  d,
  h,
  mat,
  base,
  trim,
}: {
  w: number;
  d: number;
  h: number;
  mat: Material;
  base: Material;
  trim: Material;
}) {
  const backZ = -d / 2 + 0.08;
  return (
    <group>
      <Cyl p={[0, 0.04, 0]} s={[0.28, 0.05, 0.28]} m={base} />
      <Cyl p={[0, 0.09, 0]} s={[0.18, 0.04, 0.18]} m={trim} />
      <Cyl p={[0, 0.16, 0]} s={[0.045, 0.12, 0.045]} m={base} />
      <WovenBox w={w * 0.92} d={d * 0.78} y={0.22} height={0.16} base={base} />
      <Box p={[0, h * 0.42, 0.03]} s={[w * 0.88, h * 0.18, d * 0.7]} m={mat} />
      <Welt p={[0, h * 0.42, d * 0.34]} s={[w * 0.88, 0.016, 0.012]} m={trim} />
      <group position={[0, 0, backZ]}>
        <WovenBox w={w * 0.88} d={0.08} y={h * 0.5} height={h * 0.34} base={base} />
      </group>
      <Box p={[0, h * 0.68, backZ + 0.06]} s={[w * 0.8, h * 0.32, 0.1]} m={mat} />
      <Box p={[0, h * 0.58, backZ + 0.14]} s={[w * 0.42, h * 0.14, 0.07]} m={mat} />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (w / 2 - 0.05), 0, 0.02]}>
          <WovenBox w={0.07} d={d * 0.62} y={h * 0.38} height={h * 0.14} base={base} />
          <Box p={[0, h * 0.48, 0]} s={[0.1, 0.05, d * 0.58]} m={mat} />
        </group>
      ))}
    </group>
  );
}

function OutdoorOttoman({
  w,
  d,
  h,
  mat,
  base,
  trim,
}: {
  w: number;
  d: number;
  h: number;
  mat: Material;
  base: Material;
  trim: Material;
}) {
  return (
    <group>
      {Legs(trim, [-w * 0.35, w * 0.35], [-d * 0.32, d * 0.32], 0.03, 0.06, 0.02)}
      <WovenBox w={w * 0.94} d={d * 0.92} y={0.06} height={h * 0.4} base={base} />
      <Box p={[0, h * 0.62, 0]} s={[w, h * 0.28, d]} m={mat} />
      <Welt p={[0, h * 0.62, d / 2 - 0.01]} s={[w, 0.016, 0.012]} m={trim} />
    </group>
  );
}

export function ProductPiece({
  kind,
  fabric,
  mats,
  profile,
  size,
  toScale = false,
}: {
  kind: FurnitureKind;
  fabric: string;
  mats: StoreMats;
  profile?: FurnitureProfile;
  size?: SizeIn;
  /** Scale an original showroom mesh to published inches. New profiles are already sized. */
  toScale?: boolean;
}) {
  if (profile && size) {
    return <ProfilePiece profile={profile} size={size} fabric={fabric} mats={mats} />;
  }
  const mesh = <KindPiece kind={kind} fabric={fabric} mats={mats} />;
  if (!toScale || !size) return mesh;
  const [nw, nh, nd] = NOMINAL_M[kind];
  return (
    <group scale={[(size.w * M) / nw, (size.h * M) / nh, (size.d * M) / nd]}>
      {mesh}
    </group>
  );
}

function KindPiece({
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
