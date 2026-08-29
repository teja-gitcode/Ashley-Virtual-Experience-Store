import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience-state";
import { alexGreet, resumeAudio } from "@/lib/audio";
import { HOST_GREET, HOST_IDLE } from "@/lib/host";
import { buildWalls, resolveMove } from "./collision";
import { geo } from "./geo";
import type { StoreMats } from "./materials";

const NEAR = 6.2;
const FAR = 10.5;
const WALK = 3.6;

export function HostStaff({ mats }: { mats: StoreMats }) {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3(HOST_IDLE[0], 0, HOST_IDLE[1]));
  const yaw = useRef(0);
  const walkT = useRef(0);
  const waypointI = useRef(0);
  const openedOnce = useRef(false);
  const leadKey = useRef<string | null>(null);
  const walls = useMemo(() => buildWalls(), []);

  useEffect(() => {
    openedOnce.current = false;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const st = useExperience.getState();
    if (st.phase !== "play") {
      pos.current.set(HOST_IDLE[0], 0, HOST_IDLE[1]);
      if (group.current) {
        group.current.position.copy(pos.current);
        group.current.visible = true;
      }
      return;
    }

    const dist = Math.hypot(st.px - pos.current.x, st.pz - pos.current.z);
    const nearby = dist < NEAR;
    if (nearby !== st.hostNearby) st.setHostNearby(nearby);

    let targetX = HOST_IDLE[0];
    let targetZ = HOST_IDLE[1];
    let faceX = st.px;
    let faceZ = st.pz;

    if (st.hostLead) {
      const key = `${st.hostLead.label}:${st.hostLead.productId ?? ""}`;
      if (leadKey.current !== key) {
        leadKey.current = key;
        waypointI.current = 0;
      }
      const pts = st.hostLead.waypoints;
      const i = Math.min(waypointI.current, pts.length - 1);
      const [wx, wz] = pts[i];
      targetX = wx;
      targetZ = wz;
      faceX = wx;
      faceZ = wz;
      const d = Math.hypot(wx - pos.current.x, wz - pos.current.z);
      if (d < 0.28) {
        if (i >= pts.length - 1) {
          const lead = st.hostLead;
          st.setHostArrived(lead.label);
          if (lead.productId) st.select(lead.productId);
          waypointI.current = 0;
        } else {
          waypointI.current = i + 1;
        }
      }
    } else {
      waypointI.current = 0;
      leadKey.current = null;
      if (nearby || st.hostMenuOpen) {
        targetX = HOST_GREET[0];
        targetZ = HOST_GREET[1];
        faceX = st.px;
        faceZ = st.pz;
      }
    }

    const dx = targetX - pos.current.x;
    const dz = targetZ - pos.current.z;
    const len = Math.hypot(dx, dz);
    let stepped = false;
    if (len > 0.08) {
      const step = Math.min(len, WALK * dt);
      const nx = (dx / len) * step;
      const nz = (dz / len) * step;
      const next = resolveMove(pos.current.x, pos.current.z, nx, nz, walls, 0.28);
      let x = next.x;
      let z = next.z;
      // If a wall froze both axes, take the open-space step anyway (desk/aisle).
      if (Math.abs(x - pos.current.x) + Math.abs(z - pos.current.z) < 0.0005) {
        x = pos.current.x + nx;
        z = pos.current.z + nz;
      }
      pos.current.x = THREE.MathUtils.clamp(x, -25.4, 25.4);
      pos.current.z = THREE.MathUtils.clamp(z, -29.4, 30.5);
      yaw.current = Math.atan2(-(dx / len), -(dz / len));
      stepped = true;
    } else {
      const fx = faceX - pos.current.x;
      const fz = faceZ - pos.current.z;
      if (fx * fx + fz * fz > 0.05) yaw.current = Math.atan2(-fx, -fz);
    }

    const atGreet = Math.hypot(pos.current.x - HOST_GREET[0], pos.current.z - HOST_GREET[1]) < 0.4;
    const ready = atGreet && !stepped && nearby && !st.hostLead;
    if (ready !== st.hostReady) st.setHostReady(ready);
    if (ready && !openedOnce.current && !st.hostMenuOpen && !st.selectedId && !st.catalogOpen && !st.bagOpen) {
      openedOnce.current = true;
      st.openHostMenu();
      if (!st.muted) {
        resumeAudio();
        alexGreet();
      }
    }
    if (!nearby && dist > FAR) openedOnce.current = false;

    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = yaw.current + Math.PI;
    }

    walkT.current += dt * (stepped ? 9 : 0);
    const swing = stepped ? Math.sin(walkT.current) * 0.5 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.55;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.55;
  });

  return (
    <group ref={group} position={[HOST_IDLE[0], 0, HOST_IDLE[1]]} userData={{ productId: "welcome-desk" }}>
      <mesh geometry={geo.box} position={[0, 1.42, 0]} scale={[0.3, 0.3, 0.3]} material={mats.skin} castShadow />
      <mesh geometry={geo.box} position={[0, 1.08, 0]} scale={[0.42, 0.48, 0.24]} material={mats.staff} castShadow />
      <mesh
        ref={leftArm}
        geometry={geo.box}
        position={[-0.28, 1.08, 0]}
        scale={[0.11, 0.46, 0.11]}
        material={mats.staff}
        castShadow
      />
      <mesh
        ref={rightArm}
        geometry={geo.box}
        position={[0.28, 1.08, 0]}
        scale={[0.11, 0.46, 0.11]}
        material={mats.staff}
        castShadow
      />
      <mesh
        ref={leftLeg}
        geometry={geo.box}
        position={[-0.11, 0.52, 0]}
        scale={[0.15, 0.58, 0.15]}
        material={mats.navy}
        castShadow
      />
      <mesh
        ref={rightLeg}
        geometry={geo.box}
        position={[0.11, 0.52, 0]}
        scale={[0.15, 0.58, 0.15]}
        material={mats.navy}
        castShadow
      />
    </group>
  );
}
