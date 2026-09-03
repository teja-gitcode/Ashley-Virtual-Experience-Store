import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience-state";
import { usePresence } from "@/lib/presence";
import { geo } from "./geo";
import { rect, type Rect } from "./collision";
import { applyPick, hitFrom } from "./picker";
import { xrStore } from "./xr-store";
import type { ThreeEvent } from "@react-three/fiber";

function carMat(color: string, extra?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.22,
    ...extra,
  });
}

export const LOT_CARS = [
  { id: "lot-sedan", label: "Cream sedan", paint: "#f3f1ea", kind: "sedan" as const, x: -9.5, z: 25.2, yaw: 0 },
  { id: "lot-hatch", label: "Orange hatch", paint: "#f48120", kind: "hatch" as const, x: 9.5, z: 25.2, yaw: 0 },
];

export function isLotCarId(id: string | null | undefined): boolean {
  return !!id && LOT_CARS.some((c) => c.id === id);
}

export function lotCarLabel(id: string) {
  return LOT_CARS.find((c) => c.id === id)?.label ?? "Car";
}

export function carRect(x: number, z: number, yaw: number): Rect {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const w = Math.abs(c) * 1.9 + Math.abs(s) * 4.2;
  const d = Math.abs(s) * 1.9 + Math.abs(c) * 4.2;
  return rect(x, z, w, d);
}

export function CarModel({
  paint,
  kind = "sedan",
  wheelSpinRef,
}: {
  paint: string;
  kind?: "sedan" | "hatch";
  wheelSpinRef?: { current: number };
}) {
  const wheels = useRef<(THREE.Mesh | null)[]>([]);

  const mats = useMemo(() => {
    const body = carMat(paint, { roughness: 0.28, metalness: 0.34 });
    const trim = carMat("#1c1e22", { roughness: 0.55, metalness: 0.2 });
    const rubber = carMat("#141416", { roughness: 0.92, metalness: 0.05 });
    const hub = carMat("#d7dbe2", { roughness: 0.32, metalness: 0.65 });
    const glass = new THREE.MeshStandardMaterial({
      color: "#c8eefe",
      emissive: "#7ec8ee",
      emissiveIntensity: 0.35,
      roughness: 0.08,
      metalness: 0.12,
      transparent: true,
      opacity: 0.72,
    });
    const light = new THREE.MeshStandardMaterial({
      color: "#fff6d2",
      emissive: "#ffe9a8",
      emissiveIntensity: 1.15,
      roughness: 0.35,
    });
    const tail = new THREE.MeshStandardMaterial({
      color: "#c81f24",
      emissive: "#ff2a2a",
      emissiveIntensity: 0.9,
      roughness: 0.4,
    });
    return { body, trim, rubber, hub, glass, light, tail };
  }, [paint]);

  useEffect(() => {
    return () => {
      for (const m of Object.values(mats)) m.dispose();
    };
  }, [mats]);

  useFrame((_, dt) => {
    const add = (wheelSpinRef?.current ?? 0) * dt;
    if (!add) return;
    for (const w of wheels.current) {
      if (w) w.rotation.y += add;
    }
  });

  const hatch = kind === "hatch";
  const cabinZ = hatch ? -0.22 : 0.18;
  const cabinD = hatch ? 2.55 : 1.88;

  return (
    <group userData={{ camSkip: true }}>
      <mesh geometry={geo.box} position={[0, 0.2, 0]} scale={[1.62, 0.14, 3.85]} material={mats.trim} castShadow />
      <mesh geometry={geo.box} position={[0, 0.55, 0]} scale={[1.8, 0.48, 4.02]} material={mats.body} castShadow />
      <mesh geometry={geo.box} position={[0, 0.78, 1.28]} scale={[1.72, 0.2, 1.05]} material={mats.body} castShadow />
      <mesh
        geometry={geo.box}
        position={[0, 1.12, cabinZ]}
        scale={[1.68, 0.58, cabinD]}
        material={mats.trim}
        castShadow
      />
      <mesh
        geometry={geo.box}
        position={[0, 1.44, cabinZ - (hatch ? 0.08 : 0.04)]}
        scale={[1.52, 0.1, hatch ? 2.28 : 1.62]}
        material={mats.body}
        castShadow
      />
      {!hatch ? (
        <mesh geometry={geo.box} position={[0, 0.78, -1.42]} scale={[1.72, 0.22, 0.88]} material={mats.body} castShadow />
      ) : (
        <mesh geometry={geo.box} position={[0, 0.78, -1.72]} scale={[1.7, 0.2, 0.42]} material={mats.body} castShadow />
      )}

      <mesh geometry={geo.box} position={[0, 0.36, 2.06]} scale={[1.78, 0.26, 0.18]} material={mats.trim} castShadow />
      <mesh geometry={geo.box} position={[0, 0.36, -2.06]} scale={[1.78, 0.26, 0.18]} material={mats.trim} castShadow />
      <mesh geometry={geo.box} position={[0, 0.48, 2.14]} scale={[0.7, 0.14, 0.06]} material={mats.trim} />
      <mesh geometry={geo.box} position={[-0.56, 0.52, 2.16]} scale={[0.36, 0.15, 0.08]} material={mats.light} />
      <mesh geometry={geo.box} position={[0.56, 0.52, 2.16]} scale={[0.36, 0.15, 0.08]} material={mats.light} />
      <mesh geometry={geo.box} position={[-0.58, 0.52, -2.16]} scale={[0.4, 0.14, 0.08]} material={mats.tail} />
      <mesh geometry={geo.box} position={[0.58, 0.52, -2.16]} scale={[0.4, 0.14, 0.08]} material={mats.tail} />

      <mesh
        geometry={geo.box}
        position={[0, 1.14, hatch ? 1.05 : 1.08]}
        rotation={[-0.48, 0, 0]}
        scale={[1.5, 0.48, 0.05]}
        material={mats.glass}
      />
      <mesh
        geometry={geo.box}
        position={[0, 1.16, hatch ? -1.12 : -0.78]}
        rotation={[hatch ? 0.38 : 0.48, 0, 0]}
        scale={[1.5, hatch ? 0.52 : 0.4, 0.05]}
        material={mats.glass}
      />
      <mesh geometry={geo.box} position={[-0.85, 1.14, cabinZ]} scale={[0.05, 0.4, cabinD - 0.42]} material={mats.glass} />
      <mesh geometry={geo.box} position={[0.85, 1.14, cabinZ]} scale={[0.05, 0.4, cabinD - 0.42]} material={mats.glass} />

      <mesh geometry={geo.box} position={[-0.98, 1.08, 0.62]} scale={[0.12, 0.12, 0.2]} material={mats.trim} />
      <mesh geometry={geo.box} position={[0.98, 1.08, 0.62]} scale={[0.12, 0.12, 0.2]} material={mats.trim} />

      {(
        [
          [-0.88, 0.34, 1.18],
          [0.88, 0.34, 1.18],
          [-0.88, 0.34, -1.18],
          [0.88, 0.34, -1.18],
        ] as [number, number, number][]
      ).map((wp, i) => (
        <group key={i} position={wp} rotation={[0, 0, Math.PI / 2]}>
          <mesh
            ref={(el) => {
              wheels.current[i] = el;
            }}
            geometry={geo.cyl}
            scale={[0.34, 0.2, 0.34]}
            material={mats.rubber}
            castShadow
          />
          <mesh geometry={geo.cyl} scale={[0.17, 0.21, 0.17]} material={mats.hub} />
        </group>
      ))}
    </group>
  );
}

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

export function DriveableCar({
  id,
  paint,
  kind,
}: {
  id: string;
  paint: string;
  kind: "sedan" | "hatch";
}) {
  const spin = useRef(0);
  const group = useRef<THREE.Group>(null);
  const seed = LOT_CARS.find((c) => c.id === id);
  const mine = useExperience((s) => s.drivingId === id);
  const remoteDriving = usePresence((s) => s.peers.some((p) => p.car === id));

  useFrame(() => {
    const s = useExperience.getState();
    const p = s.carPoses[id] ?? seed;
    if (p && group.current) {
      group.current.position.set(p.x, 0, p.z);
      group.current.rotation.y = p.yaw;
    }
    spin.current = s.drivingId === id ? s.driveSpeed / 0.34 : 0;
  });

  if (remoteDriving && !mine) return null;

  return (
    <group
      ref={group}
      position={[seed?.x ?? 0, 0, seed?.z ?? 0]}
      rotation={[0, seed?.yaw ?? 0, 0]}
      userData={{ carId: id, camSkip: true }}
      onClick={onXrPick}
      onPointerOver={onXrHover}
    >
      <CarModel paint={paint} kind={kind} wheelSpinRef={spin} />
      <mesh position={[0, 0.7, 0]} visible={false} userData={{ carId: id }}>
        <boxGeometry args={[2.1, 1.5, 4.4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

export function LotCars() {
  return (
    <>
      {LOT_CARS.map((c) => (
        <DriveableCar key={c.id} id={c.id} paint={c.paint} kind={c.kind} />
      ))}
    </>
  );
}
