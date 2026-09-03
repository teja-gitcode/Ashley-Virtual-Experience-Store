import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience-state";
import { isCoarsePointer } from "@/lib/handheld";
import { stickPointerId } from "@/lib/stick";
import { xrStore } from "./xr-store";

function xrActive() {
  return xrStore.getState().session != null;
}

export type PickHit =
  | { type: "coupon"; id: string }
  | { type: "product"; id: string }
  | { type: "car"; id: string };

export function hitFrom(obj: THREE.Object3D | null): PickHit | null {
  let o: THREE.Object3D | null = obj;
  while (o) {
    if (typeof o.userData.couponId === "string") {
      return { type: "coupon", id: o.userData.couponId as string };
    }
    if (typeof o.userData.carId === "string") {
      return { type: "car", id: o.userData.carId as string };
    }
    if (typeof o.userData.productId === "string") {
      return { type: "product", id: o.userData.productId as string };
    }
    o = o.parent;
  }
  return null;
}

export function applyPick(found: PickHit | null) {
  if (!found) return;
  if (found.type === "coupon") useExperience.getState().claimCoupon(found.id);
  else if (found.type === "car") {
    const s = useExperience.getState();
    if (s.drivingId === found.id) s.exitCar();
    else s.enterCar(found.id);
  } else useExperience.getState().select(found.id);
}

export function Picker() {
  const { camera, scene, gl } = useThree();
  const ray = useRef(new THREE.Raycaster());
  const ndc = useRef(new THREE.Vector2());
  const down = useRef<{ x: number; y: number; lastX: number; lastY: number; id: number; dragging: boolean } | null>(
    null,
  );
  const walk = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";

    const toNdc = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      ndc.current.x = ((cx - r.left) / r.width) * 2 - 1;
      ndc.current.y = -((cy - r.top) / r.height) * 2 + 1;
    };

    const hit = (cx: number, cy: number) => {
      toNdc(cx, cy);
      ray.current.setFromCamera(ndc.current, camera);
      const hits = ray.current.intersectObjects(scene.children, true);
      let product: { type: "product"; id: string } | null = null;
      let car: { type: "car"; id: string } | null = null;
      const near = hits[0]?.distance ?? 0;
      for (const h of hits) {
        const found = hitFrom(h.object);
        if (!found) continue;
        if (found.type === "coupon") return found;
        if (!car && found.type === "car") car = found;
        if (!product && found.type === "product") product = found;
        if (h.distance > near + 0.5) break;
      }
      return car ?? product;
    };

    const onDown = (e: PointerEvent) => {
      if (xrActive() || e.pointerId === stickPointerId) return;
      if (useExperience.getState().phase !== "play") return;
      if ((e.target as HTMLElement).closest("[data-ui]")) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / Math.max(1, r.width);
      if (isCoarsePointer() && nx < 0.42) {
        walk.current = { x: e.clientX, y: e.clientY };
        useExperience.getState().setJoy(0, 0);
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
      down.current = {
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        id: e.pointerId,
        dragging: false,
      };
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onMove = (e: PointerEvent) => {
      if (xrActive() || e.pointerId === stickPointerId) return;
      if (useExperience.getState().phase !== "play") return;
      if (walk.current) {
        const max = 56;
        const dx = e.clientX - walk.current.x;
        const dy = e.clientY - walk.current.y;
        const len = Math.hypot(dx, dy);
        const s = len > max ? max / len : 1;
        useExperience.getState().setJoy((dx * s) / max, (dy * s) / max);
        return;
      }
      if (!down.current) {
        const found = hit(e.clientX, e.clientY);
        useExperience.getState().hover(found?.id ?? null);
        el.style.cursor = found ? "pointer" : "grab";
        return;
      }
      const dx = e.clientX - down.current.x;
      const dy = e.clientY - down.current.y;
      if (Math.hypot(dx, dy) > 4) down.current.dragging = true;
      if (down.current.dragging) {
        const mx = e.movementX || e.clientX - down.current.lastX;
        const my = e.movementY || e.clientY - down.current.lastY;
        down.current.lastX = e.clientX;
        down.current.lastY = e.clientY;
        if (!useExperience.getState().gyro) useExperience.getState().addLook(mx, my);
        el.style.cursor = "grabbing";
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId === stickPointerId) return;
      if (walk.current) {
        walk.current = null;
        useExperience.getState().setJoy(0, 0);
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
      if (!down.current) return;
      const wasDrag = down.current.dragging;
      down.current = null;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (wasDrag) return;
      if (xrActive()) return;
      if (useExperience.getState().phase !== "play") return;
      applyPick(hit(e.clientX, e.clientY));
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [camera, scene, gl]);

  return null;
}
