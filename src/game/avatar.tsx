import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { geo } from "./geo";

const skin = new THREE.MeshStandardMaterial({ color: "#e2b392", roughness: 0.7 });
const khaki = new THREE.MeshStandardMaterial({ color: "#8d7a58", roughness: 0.8 });

export const SHOPPER_COLORS = [
  "#243044",
  "#8d4e36",
  "#2c4560",
  "#35563a",
  "#7a2e2a",
  "#5c4a8a",
  "#c46a4a",
  "#1b5c5c",
];

export function colorForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SHOPPER_COLORS[h % SHOPPER_COLORS.length];
}

export function BlockPerson({
  shirt,
  walking = false,
}: {
  shirt: THREE.Material;
  walking?: boolean;
}) {
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt * (walking ? 9 : 0);
    const swing = walking ? Math.sin(t.current) * 0.5 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.55;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.55;
  });
  return (
    <group>
      <mesh geometry={geo.box} position={[0, 1.42, 0]} scale={[0.3, 0.3, 0.3]} material={skin} castShadow />
      <mesh geometry={geo.box} position={[0, 1.08, 0]} scale={[0.42, 0.48, 0.24]} material={shirt} castShadow />
      <mesh
        ref={leftArm}
        geometry={geo.box}
        position={[-0.28, 1.08, 0]}
        scale={[0.11, 0.46, 0.11]}
        material={shirt}
        castShadow
      />
      <mesh
        ref={rightArm}
        geometry={geo.box}
        position={[0.28, 1.08, 0]}
        scale={[0.11, 0.46, 0.11]}
        material={shirt}
        castShadow
      />
      <mesh
        ref={leftLeg}
        geometry={geo.box}
        position={[-0.11, 0.52, 0]}
        scale={[0.15, 0.58, 0.15]}
        material={khaki}
        castShadow
      />
      <mesh
        ref={rightLeg}
        geometry={geo.box}
        position={[0.11, 0.52, 0]}
        scale={[0.15, 0.58, 0.15]}
        material={khaki}
        castShadow
      />
    </group>
  );
}

export function NameTag({ text }: { text: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = "rgba(27, 38, 52, 0.92)";
    ctx.beginPath();
    ctx.roundRect(8, 12, 240, 40, 10);
    ctx.fill();
    ctx.fillStyle = "#f4efe6";
    ctx.font = "600 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.slice(0, 18), 128, 32);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [text]);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame(({ camera }) => {
    const m = mesh.current;
    if (!m) return;
    m.quaternion.copy(camera.quaternion);
  });
  return (
    <mesh ref={mesh} position={[0, 1.92, 0]} renderOrder={8}>
      <planeGeometry args={[1.2, 0.3]} />
      <meshBasicMaterial map={tex} transparent depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
