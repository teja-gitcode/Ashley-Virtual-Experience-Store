import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Camera, Heart, Plus, RotateCw, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { ProductPiece } from "@/game/furniture";
import { useStoreMaterials, type StoreMats } from "@/game/materials";
import {
  PRODUCT_MAP,
  PRODUCTS,
  money,
  productImage,
  snapsToWall,
} from "@/lib/catalog";
import { cn } from "@/lib/cn";
import {
  ROOM_PRESETS,
  useExperience,
  type FloorFinish,
  type RoomPlan,
} from "@/lib/experience-state";
import {
  INCH,
  assessRoom,
  formatInches,
  snapBackToWall,
  type DoorWall,
  type FitRoom,
} from "@/lib/room-fit";
import { downloadRoomSheet, renderRoomSheet, type SheetPiece } from "@/lib/room-sheet";

const DOOR_LABEL: Record<DoorWall, string> = { n: "North", s: "South", e: "East", w: "West" };

function saveRoomSheet(
  view: { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera } | null,
  plan: RoomPlan,
  fitRoom: FitRoom,
  report: { occupiedSqFt: number; roomSqFt: number; fits: boolean; issues: { uid: string }[] },
) {
  if (!view) return;
  view.gl.render(view.scene, view.camera);
  const pieces: SheetPiece[] = plan.items.flatMap((item) => {
    const product = PRODUCT_MAP[item.productId];
    if (!product) return [];
    return [
      {
        name: product.name,
        x: item.x,
        z: item.z,
        rot: item.rot,
        size: product.size,
        bad: report.issues.some((issue) => issue.uid === item.uid),
      },
    ];
  });
  const sheet = renderRoomSheet(view.gl.domElement, fitRoom, plan.name, pieces, report);
  downloadRoomSheet(sheet, plan.name);
}

export function RoomStudio() {
  const plans = useExperience((s) => s.roomPlans);
  const activeRoomId = useExperience((s) => s.activeRoomId);
  const shortlist = useExperience((s) => s.shortlist);
  const plan = plans.find((item) => item.id === activeRoomId) ?? plans[0];
  const [top, setTop] = useState(false);
  const [ceiling, setCeiling] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const view = useRef<{ gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera } | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Escape") useExperience.getState().closeStudio();
      if (event.code === "KeyR" && selected) {
        const current = useExperience.getState();
        const room = current.roomPlans.find((item) => item.id === current.activeRoomId);
        const piece = room?.items.find((item) => item.uid === selected);
        if (piece) current.moveRoomItem(piece.uid, piece.x, piece.z, piece.rot + Math.PI / 2);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (!plan) return null;

  const fitRoom: FitRoom = {
    widthIn: plan.widthIn,
    lengthIn: plan.lengthIn,
    heightIn: plan.heightIn,
    doorWall: plan.doorWall,
    doorOffsetIn: plan.doorOffsetIn,
    doorWidthIn: plan.doorWidthIn,
  };
  const fitItems = plan.items.flatMap((item) => {
    const product = PRODUCT_MAP[item.productId];
    if (!product) return [];
    return [{ uid: item.uid, x: item.x, z: item.z, rot: item.rot, size: product.size }];
  });
  const report = assessRoom(fitRoom, fitItems);
  const bad = new Set(report.issues.map((issue) => issue.uid));
  const saved = PRODUCTS.filter((product) => shortlist.includes(product.id));

  return (
    <div data-ui className="pointer-events-auto absolute inset-0 z-40 flex flex-col bg-navy text-paper">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 md:px-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange">My Room</p>
          <p className="truncate font-display text-lg leading-tight">{plan.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => saveRoomSheet(view.current, plan, fitRoom, report)}
            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
          >
            <Camera className="size-4" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>
          <button
            type="button"
            onClick={() => setTop((value) => !value)}
            className={cn(
              "rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
              top ? "bg-orange text-navy" : "bg-white/10",
            )}
          >
            {top ? "Orbit" : "Top view"}
          </button>
          <button
            type="button"
            onClick={() => useExperience.getState().closeStudio()}
            className="grid size-11 place-items-center rounded-md bg-white/10"
            aria-label="Close my room"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-[46vh] flex-1 md:min-h-0">
          <Canvas
            shadows
            dpr={[1, 1.5]}
            camera={{ fov: 42, near: 0.08, far: 80, position: [1.4, 1.7, 1.6] }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 0.9,
              preserveDrawingBuffer: true,
            }}
            onCreated={({ gl, scene, camera }) => {
              view.current = { gl, scene, camera };
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <color attach="background" args={["#d5dde6"]} />
            <hemisphereLight args={["#f4efe6", "#8a7560", 0.55]} />
            <ambientLight intensity={0.25} />
            <directionalLight
              position={[6, 10, 4]}
              intensity={1.15}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-camera-near={0.5}
              shadow-camera-far={30}
              shadow-camera-left={-8}
              shadow-camera-right={8}
              shadow-camera-top={8}
              shadow-camera-bottom={-8}
            />
            <RoomScene
              plan={plan}
              fitRoom={fitRoom}
              bad={bad}
              top={top}
              ceiling={ceiling}
              selected={selected}
              onSelect={setSelected}
            />
          </Canvas>
          <p className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-md bg-navy/75 px-3 py-2 text-xs text-paper md:right-auto">
            Drag a piece. R rotates the selected one. Snapshot saves the view and a dimensioned plan.
          </p>
        </div>
        <aside className="max-h-[46vh] overflow-auto border-t border-white/10 bg-cream p-4 text-ink md:max-h-none md:w-[22rem] md:border-l md:border-t-0">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-stone">
            Room name
            <input
              value={plan.name}
              onChange={(event) => useExperience.getState().updateActiveRoom({ name: event.target.value })}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-1">
            {Object.entries(ROOM_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => useExperience.getState().applyRoomPreset(key)}
                className="rounded-full bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone"
              >
                {preset.name}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DimField
              label="Width"
              totalIn={plan.widthIn}
              min={72}
              max={480}
              onChange={(widthIn) => useExperience.getState().updateActiveRoom({ widthIn })}
            />
            <DimField
              label="Length"
              totalIn={plan.lengthIn}
              min={72}
              max={480}
              onChange={(lengthIn) => useExperience.getState().updateActiveRoom({ lengthIn })}
            />
            <DimField
              label="Ceiling"
              totalIn={plan.heightIn}
              min={96}
              max={144}
              onChange={(heightIn) => useExperience.getState().updateActiveRoom({ heightIn })}
            />
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-stone">
              Floor
              <select
                value={plan.floor}
                onChange={(event) =>
                  useExperience.getState().updateActiveRoom({ floor: event.target.value as FloorFinish })
                }
                className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-2 text-sm normal-case tracking-normal text-ink"
              >
                <option value="oak">Oak</option>
                <option value="carpet">Carpet</option>
                <option value="tile">Tile</option>
              </select>
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-stone">
              Door
              <select
                value={plan.doorWall}
                onChange={(event) =>
                  useExperience.getState().updateActiveRoom({ doorWall: event.target.value as DoorWall })
                }
                className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-2 text-sm normal-case tracking-normal text-ink"
              >
                {(Object.keys(DOOR_LABEL) as DoorWall[]).map((wall) => (
                  <option key={wall} value={wall}>
                    {DOOR_LABEL[wall]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm text-stone">
              <input type="checkbox" checked={ceiling} onChange={(event) => setCeiling(event.target.checked)} />
              Show ceiling
            </label>
          </div>
          <div
            className={cn(
              "mt-4 rounded-md px-3 py-3",
              report.fits ? "bg-emerald-50 text-emerald-950" : "bg-red-50 text-red-950",
            )}
          >
            <p className="text-sm font-semibold">{report.fits ? "Fits" : "Needs a change"}</p>
            <p className="mt-1 text-sm">
              {report.occupiedSqFt.toFixed(1)} sq ft of {report.roomSqFt.toFixed(0)} sq ft ·{" "}
              {report.roomSqFt > 0 ? Math.round((report.occupiedSqFt / report.roomSqFt) * 100) : 0}% of the floor
            </p>
            {report.issues.length ? (
              <ul className="mt-2 space-y-1 text-xs">
                {report.issues.slice(0, 6).map((issue, index) => (
                  <li key={`${issue.uid}-${issue.kind}-${index}`}>{issueText(plan, issue.uid, issue.kind)}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs">Every piece is inside, clear of the door, and under the ceiling.</p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone">In this room</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => useExperience.getState().addRoomPlan()}
                className="rounded-md border border-line px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              >
                New room
              </button>
              {plans.length > 1 ? (
                <button
                  type="button"
                  onClick={() => useExperience.getState().removeRoomPlan(plan.id)}
                  className="rounded-md border border-line px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
          {plans.length > 1 ? (
            <div className="mt-2 flex gap-1 overflow-x-auto">
              {plans.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => useExperience.getState().setActiveRoom(item.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs",
                    item.id === plan.id ? "bg-navy text-paper" : "bg-paper text-stone",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ) : null}
          <ul className="mt-2 space-y-2">
            {plan.items.map((item) => {
              const product = PRODUCT_MAP[item.productId];
              if (!product) return null;
              return (
                <li key={item.uid} className={cn("rounded-md border px-2 py-2", bad.has(item.uid) ? "border-red-300 bg-red-50" : "border-line bg-paper")}>
                  <button type="button" onClick={() => setSelected(item.uid)} className="flex w-full items-center gap-2 text-left">
                    <img src={productImage(product.id)} alt="" className="h-10 w-14 rounded object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{product.name}</span>
                      <span className="text-[11px] text-stone">
                        {formatInches(product.size.w)} × {formatInches(product.size.d)} · {report.pieceSqFt[item.uid]?.toFixed(1)} sq ft
                      </span>
                    </span>
                  </button>
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => useExperience.getState().moveRoomItem(item.uid, item.x, item.z, item.rot + Math.PI / 2)}
                      className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs"
                    >
                      <RotateCw className="size-3" /> Rotate
                    </button>
                    <button
                      type="button"
                      onClick={() => useExperience.getState().removeRoomItem(item.uid)}
                      className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs"
                    >
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </div>
                </li>
              );
            })}
            {plan.items.length === 0 ? (
              <li className="rounded-md border border-dashed border-line px-3 py-4 text-sm text-stone">
                Heart pieces on the showroom floor, then add them here.
              </li>
            ) : null}
          </ul>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-stone">Shortlist</p>
          <ul className="mt-2 space-y-1">
            {saved.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => useExperience.getState().addRoomItem(product.id)}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-paper"
                >
                  <Plus className="size-4 shrink-0 text-orange-dark" />
                  <span className="min-w-0 flex-1 truncate text-sm">{product.name}</span>
                  <span className="text-xs tabular-nums text-stone">{money(product.price)}</span>
                </button>
              </li>
            ))}
            {saved.length === 0 ? (
              <li className="flex items-start gap-2 text-sm text-stone">
                <Heart className="mt-0.5 size-4" />
                No shortlisted pieces yet. Close this room and tap the heart on a product.
              </li>
            ) : null}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function issueText(plan: RoomPlan, uid: string, kind: string) {
  const item = plan.items.find((row) => row.uid === uid);
  const name = item ? PRODUCT_MAP[item.productId]?.name ?? "A piece" : "A piece";
  if (kind === "outside") return `${name} sticks out of the room.`;
  if (kind === "overlap") return `${name} overlaps another piece.`;
  if (kind === "ceiling") return `${name} is taller than the ceiling.`;
  return `${name} blocks the door.`;
}

function DimField({
  label,
  totalIn,
  min,
  max,
  onChange,
}: {
  label: string;
  totalIn: number;
  min: number;
  max: number;
  onChange: (inches: number) => void;
}) {
  const feet = Math.floor(totalIn / 12);
  const inches = totalIn - feet * 12;
  const commit = (nextFeet: number, nextInches: number) => {
    const total = nextFeet * 12 + nextInches;
    onChange(Math.max(min, Math.min(max, total)));
  };
  return (
    <fieldset className="text-xs font-semibold uppercase tracking-[0.12em] text-stone">
      <legend>{label}</legend>
      <div className="mt-1 flex gap-1 normal-case tracking-normal">
        <input
          type="number"
          min={0}
          value={feet}
          onChange={(event) => commit(Number(event.target.value), inches)}
          className="w-14 rounded-md border border-line bg-paper px-2 py-2 text-sm text-ink"
          aria-label={`${label} feet`}
        />
        <span className="self-center text-[11px]">ft</span>
        <input
          type="number"
          min={0}
          max={11}
          value={inches}
          onChange={(event) => commit(feet, Number(event.target.value))}
          className="w-14 rounded-md border border-line bg-paper px-2 py-2 text-sm text-ink"
          aria-label={`${label} inches`}
        />
        <span className="self-center text-[11px]">in</span>
      </div>
    </fieldset>
  );
}

function RoomScene({
  plan,
  fitRoom,
  bad,
  top,
  ceiling,
  selected,
  onSelect,
}: {
  plan: RoomPlan;
  fitRoom: FitRoom;
  bad: Set<string>;
  top: boolean;
  ceiling: boolean;
  selected: string | null;
  onSelect: (uid: string) => void;
}) {
  const mats = useStoreMaterials();
  const controls = useRef<OrbitControlsImpl>(null);
  const width = plan.widthIn * INCH;
  const length = plan.lengthIn * INCH;
  const height = plan.heightIn * INCH;
  const span = Math.max(width, length);
  const floor = plan.floor === "oak" ? mats.oakFloor : plan.floor === "tile" ? mats.tile : mats.carpet;

  const move = (uid: string, x: number, z: number) => {
    const limitX = width / 2 + 0.5;
    const limitZ = length / 2 + 0.5;
    useExperience.getState().moveRoomItem(
      uid,
      Math.max(-limitX, Math.min(limitX, x)),
      Math.max(-limitZ, Math.min(limitZ, z)),
    );
  };
  const drop = (uid: string) => {
    const current = useExperience.getState();
    const room = current.roomPlans.find((item) => item.id === current.activeRoomId) ?? plan;
    const item = room.items.find((row) => row.uid === uid);
    const product = item ? PRODUCT_MAP[item.productId] : undefined;
    if (!item || !product || !snapsToWall(product)) return;
    const snapped = snapBackToWall(fitRoom, {
      uid,
      x: item.x,
      z: item.z,
      rot: item.rot,
      size: product.size,
    });
    if (snapped) current.moveRoomItem(uid, snapped.x, snapped.z, snapped.rot);
  };

  return (
    <>
      <CameraRig top={top} span={span} width={width} length={length} height={height} controls={controls} />
      <OrbitControls
        ref={controls}
        enablePan
        enableRotate={!top}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={1.4}
        maxDistance={span * 3}
        target={[0, 0.4, 0]}
      />
      <DragLayer
        controls={controls}
        onSelect={onSelect}
        onMove={move}
        onDrop={drop}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={floor}>
        <planeGeometry args={[width, length]} />
      </mesh>
      <RoomGrid width={width} length={length} />
      <RoomWalls plan={plan} mats={mats} />
      {ceiling ? (
        <mesh position={[0, height, 0]} material={mats.ceiling}>
          <boxGeometry args={[width, 0.06, length]} />
        </mesh>
      ) : null}
      <Html position={[0, 0.35, -length / 2 - 0.2]} center>
        <span className="whitespace-nowrap rounded bg-navy/80 px-2 py-1 text-[11px] text-paper">
          {formatInches(plan.widthIn)} wide
        </span>
      </Html>
      <Html position={[width / 2 + 0.2, 0.35, 0]} center>
        <span className="whitespace-nowrap rounded bg-navy/80 px-2 py-1 text-[11px] text-paper">
          {formatInches(plan.lengthIn)} long
        </span>
      </Html>
      {plan.items.map((item) => {
        const product = PRODUCT_MAP[item.productId];
        if (!product) return null;
        const w = product.size.w * INCH;
        const d = product.size.d * INCH;
        return (
          <group
            key={item.uid}
            position={[item.x, 0, item.z]}
            rotation={[0, item.rot, 0]}
            userData={{ pieceUid: item.uid }}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[w, d]} />
              <meshBasicMaterial
                color={bad.has(item.uid) ? "#b4332a" : selected === item.uid ? "#d97706" : "#2f6b4f"}
                transparent
                opacity={0.38}
              />
            </mesh>
            <ProductPiece
              kind={product.kind}
              fabric={product.fabric}
              mats={mats}
              profile={product.profile}
              size={product.size}
              toScale
            />
          </group>
        );
      })}
    </>
  );
}

function CameraRig({
  top,
  span,
  width,
  length,
  height,
  controls,
}: {
  top: boolean;
  span: number;
  width: number;
  length: number;
  height: number;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    if (top) {
      camera.up.set(0, 0, 1);
      camera.position.set(0, span * 1.35, 0.01);
      camera.lookAt(0, 0, 0);
    } else {
      // Stay inside the room. A camera beyond the wall only sees plaster.
      camera.up.set(0, 1, 0);
      camera.position.set(-width / 2 + 0.5, Math.min(2.35, height - 0.25), length / 2 - 0.5);
      camera.lookAt(0, 0.3, 0);
    }
    controls.current?.target.set(0, top ? 0 : 0.4, 0);
    controls.current?.update();
  }, [top, span, width, length, height, camera, controls]);
  return null;
}

function DragLayer({
  controls,
  onSelect,
  onMove,
  onDrop,
}: {
  controls: React.RefObject<OrbitControlsImpl | null>;
  onSelect: (uid: string) => void;
  onMove: (uid: string, x: number, z: number) => void;
  onDrop: (uid: string) => void;
}) {
  const { camera, gl, scene } = useThree();
  const moveRef = useRef(onMove);
  const dropRef = useRef(onDrop);
  const selectRef = useRef(onSelect);
  moveRef.current = onMove;
  dropRef.current = onDrop;
  selectRef.current = onSelect;

  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    let uid: string | null = null;

    const aim = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
    };
    const uidAt = (event: PointerEvent) => {
      aim(event);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const entry of hits) {
        let node: THREE.Object3D | null = entry.object;
        while (node) {
          if (typeof node.userData.pieceUid === "string") return node.userData.pieceUid as string;
          node = node.parent;
        }
      }
      return null;
    };
    const down = (event: PointerEvent) => {
      const found = uidAt(event);
      if (!found) return;
      uid = found;
      selectRef.current(found);
      if (controls.current) controls.current.enabled = false;
    };
    const move = (event: PointerEvent) => {
      if (!uid) return;
      aim(event);
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      moveRef.current(uid, hit.x, hit.z);
    };
    const up = () => {
      if (!uid) return;
      const dropped = uid;
      uid = null;
      if (controls.current) controls.current.enabled = true;
      dropRef.current(dropped);
    };
    gl.domElement.addEventListener("pointerdown", down, true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      gl.domElement.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [camera, gl, scene, controls]);
  return null;
}

function RoomGrid({ width, length }: { width: number; length: number }) {
  const positions = useMemo(() => {
    const values: number[] = [];
    const feetW = Math.round(width / 0.3048);
    const feetL = Math.round(length / 0.3048);
    for (let i = 0; i <= feetW; i++) {
      const x = -width / 2 + (i * width) / feetW;
      values.push(x, 0.015, -length / 2, x, 0.015, length / 2);
    }
    for (let i = 0; i <= feetL; i++) {
      const z = -length / 2 + (i * length) / feetL;
      values.push(-width / 2, 0.015, z, width / 2, 0.015, z);
    }
    return new Float32Array(values);
  }, [width, length]);
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#b7aa96" />
    </lineSegments>
  );
}

function RoomWalls({ plan, mats }: { plan: RoomPlan; mats: StoreMats }) {
  const width = plan.widthIn * INCH;
  const length = plan.lengthIn * INCH;
  const height = plan.heightIn * INCH;
  const door = plan.doorWidthIn * INCH;
  const offset = plan.doorOffsetIn * INCH;
  return (
    <>
      <SplitWall
        position={[0, height / 2, -length / 2 - 0.04]}
        span={width}
        height={height}
        gap={plan.doorWall === "s" ? door : 0}
        gapCenter={plan.doorWall === "s" ? offset : 0}
        material={mats.wall}
      />
      <SplitWall
        position={[0, height / 2, length / 2 + 0.04]}
        span={width}
        height={height}
        gap={plan.doorWall === "n" ? door : 0}
        gapCenter={plan.doorWall === "n" ? offset : 0}
        material={mats.wall}
      />
      <SplitWall
        position={[-width / 2 - 0.04, height / 2, 0]}
        span={length}
        height={height}
        gap={plan.doorWall === "w" ? door : 0}
        gapCenter={plan.doorWall === "w" ? offset : 0}
        rotationY={Math.PI / 2}
        material={mats.wall}
      />
      <SplitWall
        position={[width / 2 + 0.04, height / 2, 0]}
        span={length}
        height={height}
        gap={plan.doorWall === "e" ? door : 0}
        gapCenter={plan.doorWall === "e" ? offset : 0}
        rotationY={Math.PI / 2}
        material={mats.wall}
      />
    </>
  );
}

function SplitWall({
  position,
  span,
  height,
  gap,
  gapCenter,
  rotationY = 0,
  material,
}: {
  position: [number, number, number];
  span: number;
  height: number;
  gap: number;
  gapCenter: number;
  rotationY?: number;
  material: StoreMats["wall"];
}) {
  const segments =
    gap > 0.05
      ? [
          { center: (-span / 2 + (gapCenter - gap / 2)) / 2, length: gapCenter - gap / 2 - -span / 2 },
          { center: (gapCenter + gap / 2 + span / 2) / 2, length: span / 2 - (gapCenter + gap / 2) },
        ].filter((segment) => segment.length > 0.04)
      : [{ center: 0, length: span }];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {segments.map((segment) => (
        <mesh key={`${segment.center}:${segment.length}`} position={[segment.center, 0, 0]} material={material} castShadow receiveShadow>
          <boxGeometry args={[segment.length, height, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}
