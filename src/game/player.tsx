import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useXR, useXRControllerLocomotion, XROrigin } from "@react-three/xr";
import { useExperience } from "@/lib/experience-state";
import { sendMyPose, usePresence } from "@/lib/presence";
import { footstep, resumeAudio } from "@/lib/audio";
import { PLACEMENTS, roomAt } from "@/lib/catalog";
import { buildWalls, CAR_STORE_BARRIER, LOT_OBSTACLES, rect, resolveMove, unstick, type Rect } from "./collision";
import { carRect, LOT_CARS } from "./cars";
import { geo } from "./geo";
import type { StoreMats } from "./materials";

const keys = new Set<string>();
const PLAYER_R = 0.38;
const WALK = 4.6;
const RUN = 7.2;
const DRIVE = 15;
const DRIVE_REV = 6.5;
const CAR_R = 1.12;
const WORLD_X = 45.6;
const WORLD_Z_MIN = -29.4;
const WORLD_Z_MAX = 45.2;

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getPosition: () => { x: number; y: number; z: number };
      getCamera: () => { x: number; y: number; z: number };
      setPitch: (p: number) => void;
      setYaw: (y: number) => void;
      teleport: (x: number, z: number) => void;
      setZoom: (d: number) => void;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}

function extraCarBoxes(
  drivingId: string | null,
  poses: Record<string, { x: number; z: number; yaw: number }>,
) {
  return LOT_CARS.filter((c) => c.id !== drivingId).map((c) => {
    const p = poses[c.id] ?? c;
    return carRect(p.x, p.z, p.yaw);
  });
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
  const driveWas = useRef<string | null>(null);
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
      pos.current.x = THREE.MathUtils.clamp(next.x, -WORLD_X, WORLD_X);
      pos.current.z = THREE.MathUtils.clamp(next.z, WORLD_Z_MIN, WORLD_Z_MAX);
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
      getCamera: () => ({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      }),
      setPitch: (p) => {
        camPitch.current = THREE.MathUtils.clamp(p, 0.04, 0.72);
      },
      setYaw: (y) => {
        camYaw.current = y;
      },
      teleport: (x, z) => {
        useExperience.getState().requestTeleport(x, z);
      },
      setZoom: (d) => {
        useExperience.getState().setZoom(d);
      },
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
  }, [camera]);

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

    const drivingId = st.drivingId;
    if (group.current) group.current.visible = !drivingId && !st.firstPerson && !inXR;

    const parked = extraCarBoxes(drivingId, st.carPoses);
    const walkBoxes = [...colliders, ...parked];

    const tp = useExperience.getState().consumeTeleport();
    if (tp) {
      const free = unstick(tp.x, tp.z, walkBoxes, PLAYER_R + 0.08);
      pos.current.set(free.x, 0, free.z);
      useExperience.getState().setPos(free.x, free.z);
    }

    const look = useExperience.getState().consumeLook();
    if (st.gyro && !inXR && gyroBase.current) {
      camYaw.current = gyroYaw.current;
      camPitch.current = gyroPitch.current;
    } else if (!drivingId) {
      camYaw.current -= look.dx * 0.005;
      camPitch.current = THREE.MathUtils.clamp(camPitch.current + look.dy * 0.0035, 0.04, 0.72);
    } else {
      camPitch.current = THREE.MathUtils.clamp(camPitch.current + look.dy * 0.0035, 0.08, 0.55);
    }

    if (inXR && drivingId) {
      useExperience.getState().exitCar();
    }

    if (drivingId && !inXR) {
      if (driveWas.current !== drivingId) {
        speed.current = 0;
        driveWas.current = drivingId;
      }
      const pose = st.carPoses[drivingId] ?? { x: pos.current.x, z: pos.current.z, yaw: 0 };
      let yaw = pose.yaw;
      const joyX = st.joyX;
      const joyY = st.joyY;
      let throttle = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp") || joyY < -0.15) throttle += joyY < -0.15 ? -joyY : 1;
      if (keys.has("KeyS") || keys.has("ArrowDown") || joyY > 0.15) throttle -= joyY > 0.15 ? joyY : 1;
      let steer = 0;
      if (keys.has("KeyA") || keys.has("ArrowLeft") || joyX < -0.15) steer += joyX < -0.15 ? -joyX : 1;
      if (keys.has("KeyD") || keys.has("ArrowRight") || joyX > 0.15) steer -= joyX > 0.15 ? joyX : 1;
      const max = throttle < 0 ? DRIVE_REV : DRIVE;
      speed.current = THREE.MathUtils.damp(speed.current, throttle * max, 3.2, dt);
      if (Math.abs(speed.current) > 0.35) {
        yaw += steer * Math.min(1.15, Math.abs(speed.current) / 7) * 1.7 * dt;
      }
      const dx = Math.sin(yaw) * speed.current * dt;
      const dz = Math.cos(yaw) * speed.current * dt;
      const boxes = [...colliders, ...parked, CAR_STORE_BARRIER];
      const next = resolveMove(pose.x, pose.z, dx, dz, boxes, CAR_R);
      const x = THREE.MathUtils.clamp(next.x, -WORLD_X, WORLD_X);
      const z = THREE.MathUtils.clamp(next.z, 16.45, WORLD_Z_MAX);
      pos.current.set(x, 0, z);
      bodyYaw.current = yaw;
      camYaw.current = yaw + Math.PI;
      useExperience.getState().setCarPose(drivingId, x, z, yaw, speed.current);
      useExperience.getState().setNearbyCar(drivingId);
    } else {
      driveWas.current = null;
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
        const freed = unstick(pos.current.x, pos.current.z, walkBoxes, PLAYER_R);
        pos.current.x = freed.x;
        pos.current.z = freed.z;
        const nx = (mx / (len || 1)) * speed.current * dt;
        const nz = (mz / (len || 1)) * speed.current * dt;
        const next = resolveMove(pos.current.x, pos.current.z, nx, nz, walkBoxes, PLAYER_R);
        pos.current.x = THREE.MathUtils.clamp(next.x, -WORLD_X, WORLD_X);
        pos.current.z = THREE.MathUtils.clamp(next.z, WORLD_Z_MIN, WORLD_Z_MAX);
        const target = Math.atan2(-mx, -mz);
        bodyYaw.current = THREE.MathUtils.damp(bodyYaw.current, target, 10, dt);
        if (speed.current > 0.5 && !st.muted) {
          resumeAudio();
          footstep();
        }
      } else {
        speed.current *= Math.max(0, 1 - dt * 8);
      }

      let near: string | null = null;
      let nearD = 3.2;
      for (const c of LOT_CARS) {
        const p = st.carPoses[c.id] ?? c;
        const d = Math.hypot(pos.current.x - p.x, pos.current.z - p.z);
        if (d < nearD) {
          nearD = d;
          near = c.id;
        }
      }
      useExperience.getState().setNearbyCar(near);
    }

    const room = roomAt(pos.current.x, pos.current.z);
    if (room !== st.room) setRoom(room);
    if (Math.abs(pos.current.x - st.px) + Math.abs(pos.current.z - st.pz) > 0.28) {
      useExperience.getState().setPos(pos.current.x, pos.current.z);
    }
    sendMyPose({
      x: pos.current.x,
      z: pos.current.z,
      yaw: bodyYaw.current,
      walk: speed.current > 0.4 ? 1 : 0,
      name: usePresence.getState().guestName,
      car: drivingId ?? "",
    });

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

    if (drivingId) {
      const yaw = bodyYaw.current;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      const dist = THREE.MathUtils.clamp(st.camDist + 6.8, 12, 18);
      lookAt.current.set(pos.current.x + fx * 4.6, 0.72, pos.current.z + fz * 4.6);
      let cx = pos.current.x - fx * dist;
      let cz = pos.current.z - fz * dist;
      let cy = 4.55;
      if (cz < 17.4) {
        cy += (17.4 - cz) * 0.5;
        cz = 17.4;
      }
      if (cz > 44.6) cz = 44.6;
      if (cx < -45.4) cx = -45.4;
      if (cx > 45.4) cx = 45.4;
      desired.current.set(cx, cy, cz);
      camera.position.lerp(desired.current, 1 - Math.exp(-dt * 7));
      camera.lookAt(lookAt.current);
    } else if (st.firstPerson) {
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
              typeof o.userData.couponId === "string" ||
              typeof o.userData.carId === "string"
            ) {
              skip = true;
              break;
            }
            o = o.parent;
          }
          if (skip) continue;
          // Skip floors only. Ceilings (normal.y < 0) must stop the camera
          // or zoom punches through the roof.
          const ny = h.normal?.y ?? h.face?.normal.y ?? 0;
          if (ny > 0.65) continue;
          desired.current.copy(lookAt.current).addScaledVector(camDir.current, Math.max(0.42, h.distance - 0.3));
          break;
        }
      }
      // Roof slab sits at y=4.5. Pull back along the look ray so zoom never
      // sits above the building.
      const roof = 4.18;
      if (pos.current.z < 16.2 && desired.current.y > roof) {
        const fromY = lookAt.current.y;
        const span = desired.current.y - fromY;
        if (span > 0.05) {
          desired.current.lerpVectors(lookAt.current, desired.current, (roof - fromY) / span);
        } else {
          desired.current.y = roof;
        }
      }
      camera.position.lerp(desired.current, 1 - Math.exp(-dt * 8));
      camera.lookAt(lookAt.current);
    }

    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = bodyYaw.current + Math.PI;
    }

    const stepping = !drivingId && speed.current > 0.4;
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
