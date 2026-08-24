import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useXR, useXRControllerLocomotion, XROrigin } from "@react-three/xr";
import { useExperience } from "@/lib/experience-state";
import { PLACEMENTS, roomAt } from "@/lib/catalog";
import { buildWalls, LOT_OBSTACLES, rect, resolveMove, unstick, type Rect } from "./collision";
import { geo } from "./geo";
import type { StoreMats } from "./materials";

const keys = new Set<string>();
const PLAYER_R = 0.38;
const WALK = 4.6;
const RUN = 7.2;

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getPosition: () => { x: number; y: number; z: number };
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}

export function bindKeys() {
  const down = (e: KeyboardEvent) => {
    if (e.repeat) return;
    keys.add(e.code);
  };
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };
  const clear = () => keys.clear();
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
  };
}

export function Player({ mats }: { mats: StoreMats }) {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3(0, 0, 23.5));
  const camYaw = useRef(0);
  const camPitch = useRef(0.18);
  const bodyYaw = useRef(0);
  const speed = useRef(0);
  const walkT = useRef(0);
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const camRay = useRef(new THREE.Raycaster());
  const camDir = useRef(new THREE.Vector3());
  const { camera, gl } = useThree();
  const setRoom = useExperience((s) => s.setRoom);
  const phase = useExperience((s) => s.phase);
  const inXR = useXR((s) => s.session != null);
  const xrOrigin = useRef<THREE.Group>(null);
  const xrYaw = useRef(0);
  const gyroYaw = useRef(0);
  const gyroPitch = useRef(0.18);
  const gyroBase = useRef<{
    yaw: number;
    pitch: number;
    lookYaw: number;
    lookPitch: number;
  } | null>(null);
  const gyroQ = useRef({
    zee: new THREE.Vector3(0, 0, 1),
    euler: new THREE.Euler(),
    q0: new THREE.Quaternion(),
    q1: new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)),
    q: new THREE.Quaternion(),
    out: new THREE.Euler(),
  });

  const colliders = useMemo(() => {
    const walls = buildWalls();
    const furniture: Rect[] = PLACEMENTS.map((p) => {
      const c = Math.cos(p.rot);
      const s = Math.sin(p.rot);
      const w = Math.abs(c) * p.collideW + Math.abs(s) * p.collideD;
      const d = Math.abs(s) * p.collideW + Math.abs(c) * p.collideD;
      return rect(p.x, p.z, w, d);
    });
    furniture.push(rect(0, 8.6, 2.4, 0.8));
    return [...walls, ...furniture, ...LOT_OBSTACLES];
  }, []);

  useXRControllerLocomotion(
    (velocity, rotationY, dt) => {
      if (!inXR || useExperience.getState().phase !== "play") return;
      if (rotationY) xrYaw.current += rotationY;
      const step = typeof dt === "number" ? dt : 0.016;
      const dx = velocity.x * step;
      const dz = velocity.z * step;
      if (Math.hypot(dx, dz) < 0.0004 && !rotationY) return;
      const freed = unstick(pos.current.x, pos.current.z, colliders, PLAYER_R);
      const next = resolveMove(freed.x, freed.z, dx, dz, colliders, PLAYER_R);
      pos.current.x = THREE.MathUtils.clamp(next.x, -25.4, 25.4);
      pos.current.z = THREE.MathUtils.clamp(next.z, -29.4, 30.5);
    },
    { speed: 4.2 },
    { type: "snap", degrees: 45 },
  );

  useEffect(() => bindKeys(), []);

  const gyro = useExperience((s) => s.gyro);
  useEffect(() => {
    if (!gyro) {
      gyroBase.current = null;
      return;
    }

    let stop = false;

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      const g = gyroQ.current;
      const orient = ((screen.orientation?.angle ?? (window as Window & { orientation?: number }).orientation ?? 0) * Math.PI) / 180;
      g.euler.set(
        THREE.MathUtils.degToRad(e.beta),
        THREE.MathUtils.degToRad(e.alpha),
        -THREE.MathUtils.degToRad(e.gamma),
        "YXZ",
      );
      g.q.setFromEuler(g.euler);
      g.q.multiply(g.q1);
      g.q.multiply(g.q0.setFromAxisAngle(g.zee, -orient));
      g.out.setFromQuaternion(g.q, "YXZ");
      if (!gyroBase.current) {
        gyroBase.current = {
          yaw: g.out.y,
          pitch: g.out.x,
          lookYaw: camYaw.current,
          lookPitch: camPitch.current,
        };
        return;
      }
      const b = gyroBase.current;
      gyroYaw.current = b.lookYaw + (g.out.y - b.yaw);
      gyroPitch.current = THREE.MathUtils.clamp(b.lookPitch + (g.out.x - b.pitch) * 0.55, 0.04, 0.72);
    };

    window.addEventListener("deviceorientation", onOrient);
    return () => {
      stop = true;
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [gyro]);

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (useExperience.getState().phase !== "play") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-ui]")) return;
      e.preventDefault();
      const mag = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 90);
      useExperience.getState().nudgeZoom(mag * 0.014);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  useEffect(() => {
    window.__controlsTest = {
      getYaw: () => camYaw.current,
      getSpeed: () => speed.current,
      getPosition: () => ({ x: pos.current.x, y: pos.current.y, z: pos.current.z }),
      setKeys: (codes) => {
        keys.clear();
        for (const c of codes) keys.add(c);
      },
      setSteer: (v) => {
        keys.delete("KeyA");
        keys.delete("KeyD");
        if (v > 0.2) keys.add("KeyA");
        if (v < -0.2) keys.add("KeyD");
      },
    };
    return () => {
      delete window.__controlsTest;
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const st = useExperience.getState();

    if (st.phase === "start") {
      if (!inXR) {
        const t = state.clock.elapsedTime;
        camera.position.set(3.4 + Math.sin(t * 0.12) * 0.45, 2.55, 27.2);
        camera.lookAt(0, 2.35, 16.4);
      }
      if (group.current) {
        group.current.position.copy(pos.current);
        group.current.visible = false;
      }
      return;
    }

    if (group.current) group.current.visible = !st.firstPerson && !inXR;

    const tp = useExperience.getState().consumeTeleport();
    if (tp) {
      const free = unstick(tp.x, tp.z, colliders, PLAYER_R + 0.08);
      pos.current.set(free.x, 0, free.z);
    }

    const look = useExperience.getState().consumeLook();
    if (st.gyro && !inXR && gyroBase.current) {
      camYaw.current = gyroYaw.current;
      camPitch.current = gyroPitch.current;
    } else {
      camYaw.current -= look.dx * 0.005;
      camPitch.current = THREE.MathUtils.clamp(camPitch.current + look.dy * 0.0035, 0.04, 0.72);
    }

    const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const max = running ? RUN : WALK;

    const fx = -Math.sin(camYaw.current);
    const fz = -Math.cos(camYaw.current);
    const rx = Math.cos(camYaw.current);
    const rz = -Math.sin(camYaw.current);

    let mx = 0;
    let mz = 0;
    const joyX = st.joyX;
    const joyY = st.joyY;
    if (keys.has("KeyW") || keys.has("ArrowUp") || joyY < -0.15) {
      const mag = joyY < -0.15 ? -joyY : 1;
      mx += fx * mag;
      mz += fz * mag;
    }
    if (keys.has("KeyS") || keys.has("ArrowDown") || joyY > 0.15) {
      const mag = joyY > 0.15 ? joyY : 1;
      mx -= fx * mag;
      mz -= fz * mag;
    }
    if (keys.has("KeyA") || keys.has("ArrowLeft") || joyX < -0.15) {
      const mag = joyX < -0.15 ? -joyX : 1;
      mx -= rx * mag;
      mz -= rz * mag;
    }
    if (keys.has("KeyD") || keys.has("ArrowRight") || joyX > 0.15) {
      const mag = joyX > 0.15 ? joyX : 1;
      mx += rx * mag;
      mz += rz * mag;
    }

    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }

    const want = len > 0.05 ? max : 0;
    speed.current = THREE.MathUtils.damp(speed.current, want, 8, dt);

    if (len > 0.05) {
      const freed = unstick(pos.current.x, pos.current.z, colliders, PLAYER_R);
      pos.current.x = freed.x;
      pos.current.z = freed.z;
      const nx = (mx / (len || 1)) * speed.current * dt;
      const nz = (mz / (len || 1)) * speed.current * dt;
      const next = resolveMove(pos.current.x, pos.current.z, nx, nz, colliders, PLAYER_R);
      pos.current.x = THREE.MathUtils.clamp(next.x, -25.4, 25.4);
      pos.current.z = THREE.MathUtils.clamp(next.z, -29.4, 30.5);
      const target = Math.atan2(-mx, -mz);
      bodyYaw.current = THREE.MathUtils.damp(bodyYaw.current, target, 10, dt);
    } else {
      speed.current *= Math.max(0, 1 - dt * 8);
    }

    const room = roomAt(pos.current.x, pos.current.z);
    if (room !== st.room) setRoom(room);
    if (Math.abs(pos.current.x - st.px) + Math.abs(pos.current.z - st.pz) > 0.28) {
      useExperience.getState().setPos(pos.current.x, pos.current.z);
    }

    if (xrOrigin.current) {
      xrOrigin.current.position.set(pos.current.x, 0, pos.current.z);
      xrOrigin.current.rotation.y = xrYaw.current;
    }

    if (inXR) {
      if (group.current) {
        group.current.position.copy(pos.current);
        group.current.rotation.y = bodyYaw.current + Math.PI;
      }
      return;
    }

    if (st.firstPerson) {
      desired.current.set(
        pos.current.x + Math.sin(camYaw.current) * 0.18,
        pos.current.y + 1.58,
        pos.current.z + Math.cos(camYaw.current) * 0.18,
      );
      camera.position.lerp(desired.current, 1 - Math.exp(-dt * 14));
      const lookDist = 8;
      lookAt.current.set(
        pos.current.x - Math.sin(camYaw.current) * lookDist,
        pos.current.y + 1.5 - camPitch.current * 3.2,
        pos.current.z - Math.cos(camYaw.current) * lookDist,
      );
      camera.lookAt(lookAt.current);
    } else {
      const dist = st.camDist;
      const cp = Math.cos(camPitch.current);
      const sp = Math.sin(camPitch.current);
      desired.current.set(
        pos.current.x + Math.sin(camYaw.current) * dist * cp,
        pos.current.y + 1.55 + dist * sp * 0.7,
        pos.current.z + Math.cos(camYaw.current) * dist * cp,
      );
      lookAt.current.set(pos.current.x, pos.current.y + 1.28, pos.current.z);
      camDir.current.copy(desired.current).sub(lookAt.current);
      const want = camDir.current.length();
      if (want > 0.25) {
        camDir.current.multiplyScalar(1 / want);
        camRay.current.set(lookAt.current, camDir.current);
        camRay.current.far = want;
        const hits = camRay.current.intersectObjects(state.scene.children, true);
        for (const h of hits) {
          let o: THREE.Object3D | null = h.object;
          let skip = false;
          while (o) {
            if (
              o === group.current ||
              o.userData.camSkip === true ||
              typeof o.userData.productId === "string" ||
              typeof o.userData.couponId === "string"
            ) {
              skip = true;
              break;
            }
            o = o.parent;
          }
          if (skip) continue;
          if (h.face && Math.abs(h.face.normal.y) > 0.65) continue;
          desired.current.copy(lookAt.current).addScaledVector(camDir.current, Math.max(0.42, h.distance - 0.3));
          break;
        }
      }
      camera.position.lerp(desired.current, 1 - Math.exp(-dt * 8));
      camera.lookAt(lookAt.current);
    }

    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = bodyYaw.current + Math.PI;
    }

    const stepping = speed.current > 0.4;
    walkT.current += dt * (stepping ? speed.current * 1.7 : 0);
    const swing = stepping ? Math.sin(walkT.current) * 0.55 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.6;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.6;
  });

  void phase;

  return (
    <>
      <XROrigin ref={xrOrigin} />
      <group ref={group} position={[0, 0, 23.5]}>
      <mesh geometry={geo.box} position={[0, 1.42, 0]} scale={[0.3, 0.3, 0.3]} material={mats.skin} castShadow />
      <mesh geometry={geo.box} position={[0, 1.08, 0]} scale={[0.42, 0.48, 0.24]} material={mats.shirt} castShadow />
      <mesh
        ref={leftArm}
        geometry={geo.box}
        position={[-0.28, 1.08, 0]}
        scale={[0.11, 0.46, 0.11]}
        material={mats.shirt}
        castShadow
      />
      <mesh
        ref={rightArm}
        geometry={geo.box}
        position={[0.28, 1.08, 0]}
        scale={[0.11, 0.46, 0.11]}
        material={mats.shirt}
        castShadow
      />
      <mesh
        ref={leftLeg}
        geometry={geo.box}
        position={[-0.11, 0.52, 0]}
        scale={[0.15, 0.58, 0.15]}
        material={mats.khaki}
        castShadow
      />
      <mesh
        ref={rightLeg}
        geometry={geo.box}
        position={[0.11, 0.52, 0]}
        scale={[0.15, 0.58, 0.15]}
        material={mats.khaki}
        castShadow
      />
      </group>
    </>
  );
}
