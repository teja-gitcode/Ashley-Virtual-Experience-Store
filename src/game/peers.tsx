import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BlockPerson, NameTag, colorForId } from "./avatar";
import { CarModel, LOT_CARS } from "./cars";
import { usePresence, type PeerPose } from "@/lib/presence";

function RemoteShopper({
  id,
  pose,
}: {
  id: string;
  pose: PeerPose & { at: number };
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const target = useRef(pose);
  target.current = pose;
  const shirt = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colorForId(id), roughness: 0.78 }),
    [id],
  );
  useEffect(() => () => shirt.dispose(), [shirt]);
  const spin = useRef(0);
  const spec = LOT_CARS.find((c) => c.id === pose.car);

  useFrame((_, dt) => {
    const r = root.current;
    const b = body.current;
    if (!r || !b) return;
    const p = target.current;
    r.position.x = THREE.MathUtils.damp(r.position.x, p.x, 10, dt);
    r.position.z = THREE.MathUtils.damp(r.position.z, p.z, 10, dt);
    const driving = !!LOT_CARS.find((c) => c.id === p.car);
    const cur = b.rotation.y;
    let dest = driving ? p.yaw : p.yaw + Math.PI;
    let diff = dest - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    b.rotation.y = cur + diff * Math.min(1, dt * 10);
    spin.current = driving && p.walk > 0 ? 18 : 0;
  });

  return (
    <group ref={root} position={[pose.x, 0, pose.z]} userData={{ camSkip: true }}>
      <group ref={body}>
        {spec ? (
          <CarModel paint={spec.paint} kind={spec.kind} wheelSpinRef={spin} />
        ) : (
          <BlockPerson shirt={shirt} walking={pose.walk > 0} />
        )}
      </group>
      <group position={[0, spec ? 0.55 : 0, 0]}>
        <NameTag text={pose.name || "Guest"} />
      </group>
    </group>
  );
}

export function PeerCrowd() {
  const peers = usePresence((s) => s.peers);
  return (
    <group>
      {peers.map((p) => (
        <RemoteShopper key={p.id} id={p.id} pose={p} />
      ))}
    </group>
  );
}
