import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { IfInSessionMode, TeleportTarget, XR } from "@react-three/xr";
import { Suspense, useEffect } from "react";
import * as THREE from "three";
import { Player } from "./player";
import { StoreWorld } from "./world";
import { HostStaff } from "./staff";
import { Picker } from "./picker";
import { PresenceGate } from "./presence-gate";
import { useStoreMaterials } from "./materials";
import { StoreChrome } from "@/components/store-chrome";
import { useExperience } from "@/lib/experience-state";
import { xrStore } from "./xr-store";

function Scene() {
  const mats = useStoreMaterials();
  const dusk = useExperience((s) => s.dusk);
  return (
    <>
      <color attach="background" args={[dusk ? "#1a222c" : "#8aa0b5"]} />
      <fog attach="fog" args={[dusk ? "#243044" : "#b7c4d0", dusk ? 40 : 58, dusk ? 90 : 130]} />
      <Sky
        sunPosition={dusk ? [4, 2.4, 8] : [12, 16, 8]}
        turbidity={dusk ? 8 : 4}
        rayleigh={dusk ? 0.6 : 0.35}
        mieCoefficient={dusk ? 0.01 : 0.004}
      />
      <hemisphereLight args={dusk ? ["#f0c9a0", "#2a2430", 0.28] : ["#f3e6d2", "#5c4a38", 0.42]} />
      <ambientLight intensity={dusk ? 0.12 : 0.22} />
      <directionalLight
        position={dusk ? [8, 10, 6] : [14, 18, 10]}
        intensity={dusk ? 0.55 : 1.05}
        color={dusk ? "#ffb070" : "#ffe6c4"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={110}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.00025}
        shadow-normalBias={0.04}
      />
      <StoreWorld mats={mats} />
      <HostStaff mats={mats} />
      <Player mats={mats} />
      <PresenceGate />
      <Picker />
      <IfInSessionMode>
        <TeleportTarget
          onTeleport={(point) => {
            useExperience.getState().requestTeleport(point.x, point.z);
          }}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} userData={{ camSkip: true }}>
            <planeGeometry args={[80, 80]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </TeleportTarget>
      </IfInSessionMode>
    </>
  );
}

export function Experience() {
  const phase = useExperience((s) => s.phase);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("qa")) useExperience.getState().enter();
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-navy">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: phase === "play" ? "auto" : "none",
          touchAction: "none",
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.78,
        }}
        camera={{ fov: 52, near: 0.12, far: 180, position: [3.4, 2.55, 27.2] }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.setClearColor("#8aa0b5");
        }}
      >
        <XR store={xrStore}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </XR>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 z-50">
        <StoreChrome />
      </div>
    </div>
  );
}
