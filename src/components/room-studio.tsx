import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { Camera, Heart, Plus, RotateCw, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { resolveMove, unstick, type Rect } from "@/game/collision";
import { ProductPiece } from "@/game/furniture";
import { geo } from "@/game/geo";
import { useStoreMaterials, type StoreMats } from "@/game/materials";
import {
  chasePull,
  fitDoor,
  homeBounds,
  homeColliders,
  layoutHome,
  roomInteriors,
  roomOpenings,
  sharedCover,
  spanSegments,
  walkSpawn,
  wallOnScreenAxis,
  type RoomOrigin,
  type RoomRect,
} from "@/lib/home-layout";
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

/** Which wall of the active room sits on that edge of the current view. */
function sideFromView(camera: THREE.Camera, which: "left" | "right" | "above" | "below"): DoorWall {
  camera.updateMatrixWorld();
  const axis = new THREE.Vector3();
  axis.setFromMatrixColumn(camera.matrixWorld, which === "left" || which === "right" ? 0 : 1);
  if (which === "left" || which === "below") axis.negate();
  axis.y = 0;
  if (axis.lengthSq() < 1e-8) return "e";
  return wallOnScreenAxis(axis.x, axis.z);
}

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
  const [walking, setWalking] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const layout = useMemo(() => layoutHome(plans), [plans]);
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

  const origin = layout.find((room) => room.id === plan.id) ?? layout[0];
  const linked = plan.join ? fitDoor(plan, origin, plans, layout) : null;
  const fitRoom: FitRoom = {
    widthIn: plan.widthIn,
    lengthIn: plan.lengthIn,
    heightIn: plan.heightIn,
    doorWall: linked?.wall ?? plan.doorWall,
    doorOffsetIn: linked?.offsetIn ?? plan.doorOffsetIn,
    doorWidthIn: linked?.widthIn ?? plan.doorWidthIn,
    extraDoors:
      linked && linked.wall !== plan.doorWall
        ? [{ wall: plan.doorWall, offsetIn: plan.doorOffsetIn, widthIn: plan.doorWidthIn }]
        : roomOpenings(plan, origin, plans, layout)
            .filter((opening) => opening.wall !== plan.doorWall)
            .map((opening) => ({
              wall: opening.wall,
              offsetIn: opening.center / INCH,
              widthIn: opening.width / INCH,
            })),
  };
  const fitItems = plan.items.flatMap((item) => {
    const product = PRODUCT_MAP[item.productId];
    if (!product) return [];
    return [{ uid: item.uid, x: item.x, z: item.z, rot: item.rot, size: product.size }];
  });
  const report = assessRoom(fitRoom, fitItems);
  const bad = new Set(report.issues.map((issue) => issue.uid));
  const saved = PRODUCTS.filter((product) => shortlist.includes(product.id));
  const addRoomOn = (which: "left" | "right" | "above" | "below") => {
    const camera = view.current?.camera;
    useExperience.getState().addRoomPlan(camera ? sideFromView(camera, which) : "e");
  };

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
            onClick={() => {
              setWalking((value) => !value);
              setTop(false);
            }}
            className={cn(
              "rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
              walking ? "bg-orange text-navy" : "bg-white/10",
            )}
          >
            {walking ? "Stop walking" : "Walk through"}
          </button>
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
            <HomeScene
              plans={plans}
              layout={layout}
              activeId={plan.id}
              bad={bad}
              top={top}
              ceiling={ceiling}
              walking={walking}
              selected={selected}
              onSelect={setSelected}
            />
          </Canvas>
          <p className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-md bg-navy/75 px-3 py-2 text-xs text-paper md:right-auto">
            {walking
              ? "First person. WASD to walk, drag to look, scroll to zoom. Hold Shift to run. C switches the camera."
              : "Drag a piece. R rotates it. Scroll to zoom. The view stays put while you change the size. Add a room on the left, right, above, or below."}
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
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone">Add a room</p>
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
            <p className="mt-1 text-[11px] text-stone">On the side you see from this view of {plan.name}.</p>
            <div className="mt-2 grid grid-cols-3 gap-1">
              <span />
              <SideButton label="Above" onClick={() => addRoomOn("above")} />
              <span />
              <SideButton label="Left" onClick={() => addRoomOn("left")} />
              <span className="self-center text-center text-[10px] uppercase tracking-[0.08em] text-stone">this room</span>
              <SideButton label="Right" onClick={() => addRoomOn("right")} />
              <span />
              <SideButton label="Below" onClick={() => addRoomOn("below")} />
              <span />
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-stone">In this room</p>
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

function SideButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-line bg-paper px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink"
    >
      {label}
    </button>
  );
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

function HomeScene({
  plans,
  layout,
  activeId,
  bad,
  top,
  ceiling,
  walking,
  selected,
  onSelect,
}: {
  plans: RoomPlan[];
  layout: RoomOrigin[];
  activeId: string;
  bad: Set<string>;
  top: boolean;
  ceiling: boolean;
  walking: boolean;
  selected: string | null;
  onSelect: (uid: string) => void;
}) {
  const mats = useStoreMaterials();
  const controls = useRef<OrbitControlsImpl>(null);
  const bounds = homeBounds(layout);
  const boxes = useMemo(() => homeColliders(plans, layout) as Rect[], [plans, layout]);
  const interiors = useMemo(() => roomInteriors(layout, 0.36), [layout]);
  const ceilings = useMemo(
    () =>
      layout.flatMap((origin) => {
        const room = plans.find((item) => item.id === origin.id);
        if (!room) return [];
        return [
          {
            minX: origin.x - origin.width / 2,
            maxX: origin.x + origin.width / 2,
            minZ: origin.z - origin.length / 2,
            maxZ: origin.z + origin.length / 2,
            y: room.heightIn * INCH - 0.22,
          },
        ];
      }),
    [plans, layout],
  );
  useEffect(() => {
    const hook = window as Window & { __homeLayout?: { id: string; x: number; z: number }[] };
    hook.__homeLayout = layout.map((room) => ({ id: room.id, x: room.x, z: room.z }));
  }, [layout]);
  const wallMat = useMemo(() => {
    const material = mats.wall.clone();
    material.side = THREE.DoubleSide;
    return material;
  }, [mats.wall]);
  const root = plans[0];
  const rootOrigin = layout[0];
  const spawn = root && rootOrigin ? walkSpawn(root, rootOrigin) : { x: 0, z: 0, yaw: Math.PI };

  const move = (uid: string, worldX: number, worldZ: number) => {
    const owner = plans.find((room) => room.items.some((item) => item.uid === uid));
    const origin = layout.find((room) => room.id === owner?.id);
    if (!owner || !origin) return;
    useExperience.getState().setActiveRoom(owner.id);
    const limitX = origin.width / 2 + 0.35;
    const limitZ = origin.length / 2 + 0.35;
    useExperience.getState().moveRoomItem(
      uid,
      Math.max(-limitX, Math.min(limitX, worldX - origin.x)),
      Math.max(-limitZ, Math.min(limitZ, worldZ - origin.z)),
    );
  };
  const drop = (uid: string) => {
    const current = useExperience.getState();
    const room = current.roomPlans.find((item) => item.items.some((piece) => piece.uid === uid));
    const item = room?.items.find((row) => row.uid === uid);
    const product = item ? PRODUCT_MAP[item.productId] : undefined;
    const origin = layout.find((entry) => entry.id === room?.id);
    if (!room || !item || !product || !origin || !snapsToWall(product)) return;
    const door = fitDoor(room, origin, current.roomPlans, layoutHome(current.roomPlans));
    const snapped = snapBackToWall(
      {
        widthIn: room.widthIn,
        lengthIn: room.lengthIn,
        heightIn: room.heightIn,
        doorWall: door.wall,
        doorOffsetIn: door.offsetIn,
        doorWidthIn: door.widthIn,
      },
      { uid, x: item.x, z: item.z, rot: item.rot, size: product.size },
    );
    if (snapped) current.moveRoomItem(uid, snapped.x, snapped.z, snapped.rot);
  };

  return (
    <>
      {walking ? (
        <HomeWalk spawn={spawn} boxes={boxes} rooms={interiors} ceilings={ceilings} mats={mats} />
      ) : null}
      <ViewProbe />
      {walking ? null : (
        <CameraRig top={top} bounds={bounds} single={plans.length === 1} controls={controls} />
      )}
      {walking ? null : (
        <OrbitControls
          ref={controls}
          enablePan
          enableRotate={!top}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={1.4}
          maxDistance={Math.max(18, bounds.span * 3)}
        />
      )}
      {walking ? null : (
        <DragLayer controls={controls} onSelect={onSelect} onMove={move} onDrop={drop} />
      )}
      {plans.map((room) => {
        const origin = layout.find((entry) => entry.id === room.id);
        if (!origin) return null;
        const active = room.id === activeId;
        return (
          <group key={room.id} position={[origin.x, 0, origin.z]}>
            <RoomShell
              plan={room}
              plans={plans}
              origin={origin}
              layout={layout}
              mats={mats}
              wallMat={wallMat}
              ceiling={ceiling && active && !walking}
              active={active}
              showLabel={!walking}
            />
            {room.items.map((item) => {
              const product = PRODUCT_MAP[item.productId];
              if (!product) return null;
              const showFit = active;
              return (
                <group
                  key={item.uid}
                  position={[item.x, 0, item.z]}
                  rotation={[0, item.rot, 0]}
                  userData={{ pieceUid: item.uid }}
                >
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                    <planeGeometry args={[product.size.w * INCH, product.size.d * INCH]} />
                    <meshBasicMaterial
                      color={showFit && bad.has(item.uid) ? "#b4332a" : selected === item.uid ? "#d97706" : "#2f6b4f"}
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
          </group>
        );
      })}
    </>
  );
}

const HOME_WALK = 4.6;
const HOME_RUN = 7.2;
const HOME_ZOOM_MIN = 0.65;
const HOME_ZOOM_MAX = 8;
const HOME_FOV = 52;
const HOME_FOV_MIN = 26;
const HOME_FOV_MAX = 78;
const HOME_BODY_R = 0.32;

type WalkCeiling = { minX: number; maxX: number; minZ: number; maxZ: number; y: number };

function ceilingCap(x: number, z: number, rooms: WalkCeiling[]) {
  const inside = rooms.filter(
    (room) => x >= room.minX - 0.45 && x <= room.maxX + 0.45 && z >= room.minZ - 0.45 && z <= room.maxZ + 0.45,
  );
  const pool = inside.length > 0 ? inside : rooms;
  if (pool.length === 0) return 2.2;
  let cap = pool[0].y;
  for (const room of pool) cap = Math.min(cap, room.y);
  return cap;
}

function HomeWalk({
  spawn,
  boxes,
  rooms,
  ceilings,
  mats,
}: {
  spawn: { x: number; z: number; yaw: number };
  boxes: Rect[];
  rooms: RoomRect[];
  ceilings: WalkCeiling[];
  mats: StoreMats;
}) {
  const { camera, scene, gl } = useThree();
  const yaw = useRef(spawn.yaw);
  const pitch = useRef(0.18);
  const dist = useRef(1.6);
  const fov = useRef(HOME_FOV);
  const firstPerson = useRef(true);
  const pos = useRef(new THREE.Vector3(spawn.x, 0, spawn.z));
  const bodyYaw = useRef(spawn.yaw);
  const speed = useRef(0);
  const walkT = useRef(0);
  const snapped = useRef(false);
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const keys = useRef(new Set<string>());
  const drag = useRef<{ x: number; y: number } | null>(null);
  const boxesRef = useRef(boxes);
  const roomsRef = useRef(rooms);
  const ceilingsRef = useRef(ceilings);
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const camRay = useRef(new THREE.Raycaster());
  const camDir = useRef(new THREE.Vector3());
  boxesRef.current = boxes;
  roomsRef.current = rooms;
  ceilingsRef.current = ceilings;

  useEffect(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }, []);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const previous = cam.fov;
    cam.fov = HOME_FOV;
    cam.updateProjectionMatrix();
    return () => {
      cam.fov = previous;
      cam.updateProjectionMatrix();
    };
  }, [camera]);

  useEffect(() => {
    return () => {
      delete (window as Window & { __homeWalk?: { x: number; z: number; yaw: number } }).__homeWalk;
    };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "KeyC" && !event.repeat) firstPerson.current = !firstPerson.current;
      keys.current.add(event.code);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current.clear();
    };
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      drag.current = { x: event.clientX, y: event.clientY };
    };
    const onMove = (event: PointerEvent) => {
      const last = drag.current;
      if (!last) return;
      const mx = event.movementX || event.clientX - last.x;
      const my = event.movementY || event.clientY - last.y;
      drag.current = { x: event.clientX, y: event.clientY };
      yaw.current -= mx * 0.005;
      pitch.current = THREE.MathUtils.clamp(pitch.current + my * 0.0035, 0.04, 0.72);
    };
    const onUp = () => {
      drag.current = null;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const raw = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * 400 : event.deltaY;
      const mag = Math.sign(raw) * Math.min(Math.abs(raw), 90);
      if (mag === 0) return;
      if (firstPerson.current) {
        fov.current = THREE.MathUtils.clamp(fov.current + mag * 0.08, HOME_FOV_MIN, HOME_FOV_MAX);
      } else {
        dist.current = THREE.MathUtils.clamp(dist.current + mag * 0.016, HOME_ZOOM_MIN, HOME_ZOOM_MAX);
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const yawNow = yaw.current;
    const fx = -Math.sin(yawNow);
    const fz = -Math.cos(yawNow);
    const rx = -fz;
    const rz = fx;
    let mx = 0;
    let mz = 0;
    const held = keys.current;
    if (held.has("KeyW") || held.has("ArrowUp")) {
      mx += fx;
      mz += fz;
    }
    if (held.has("KeyS") || held.has("ArrowDown")) {
      mx -= fx;
      mz -= fz;
    }
    if (held.has("KeyA") || held.has("ArrowLeft")) {
      mx -= rx;
      mz -= rz;
    }
    if (held.has("KeyD") || held.has("ArrowRight")) {
      mx += rx;
      mz += rz;
    }
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    const running = held.has("ShiftLeft") || held.has("ShiftRight");
    const want = len > 0.05 ? (running ? HOME_RUN : HOME_WALK) : 0;
    speed.current = THREE.MathUtils.damp(speed.current, want, 8, dt);
    if (len > 0.05) {
      const freed = unstick(pos.current.x, pos.current.z, boxesRef.current, HOME_BODY_R);
      pos.current.x = freed.x;
      pos.current.z = freed.z;
      const next = resolveMove(
        pos.current.x,
        pos.current.z,
        (mx / (len || 1)) * speed.current * dt,
        (mz / (len || 1)) * speed.current * dt,
        boxesRef.current,
        HOME_BODY_R,
      );
      pos.current.x = next.x;
      pos.current.z = next.z;
      bodyYaw.current = THREE.MathUtils.damp(bodyYaw.current, Math.atan2(-mx, -mz), 10, dt);
    } else {
      speed.current *= Math.max(0, 1 - dt * 8);
    }

    const eye = firstPerson.current;
    if (eye) {
      desired.current.set(pos.current.x - fx * 0.18, 1.58, pos.current.z - fz * 0.18);
      lookAt.current.set(pos.current.x + fx * 8, 1.5 - pitch.current * 3.2, pos.current.z + fz * 8);
    } else {
      const distNow = dist.current;
      const cp = Math.cos(pitch.current);
      const back = chasePull(pos.current.x, pos.current.z, fx, fz, Math.max(0.2, distNow * cp), roomsRef.current);
      const rise = Math.tan(pitch.current) * 0.7;
      desired.current.set(pos.current.x - fx * back, 1.55 + back * rise, pos.current.z - fz * back);
      lookAt.current.set(pos.current.x, 1.28, pos.current.z);
      camDir.current.copy(desired.current).sub(lookAt.current);
      const wantLen = camDir.current.length();
      if (wantLen > 0.25) {
        camDir.current.multiplyScalar(1 / wantLen);
        camRay.current.set(lookAt.current, camDir.current);
        camRay.current.far = wantLen;
        const hits = camRay.current.intersectObjects(scene.children, true);
        for (const hit of hits) {
          let node: THREE.Object3D | null = hit.object;
          let skip = false;
          while (node) {
            if (node === group.current || node.userData.camSkip === true || typeof node.userData.pieceUid === "string") {
              skip = true;
              break;
            }
            node = node.parent;
          }
          if (skip) continue;
          const ny = hit.normal?.y ?? hit.face?.normal.y ?? 0;
          if (ny > 0.65) continue;
          desired.current.copy(lookAt.current).addScaledVector(camDir.current, Math.max(0.42, hit.distance - 0.3));
          break;
        }
      }
      const cap = ceilingCap(pos.current.x, pos.current.z, ceilingsRef.current);
      if (desired.current.y > cap) {
        const fromY = lookAt.current.y;
        const span = desired.current.y - fromY;
        if (span > 0.05) desired.current.lerpVectors(lookAt.current, desired.current, (cap - fromY) / span);
        else desired.current.y = cap;
      }
    }

    const cam = camera as THREE.PerspectiveCamera;
    const nextFov = eye ? fov.current : HOME_FOV;
    if (Math.abs(cam.fov - nextFov) > 0.05) {
      cam.fov = nextFov;
      cam.updateProjectionMatrix();
    }

    camera.up.set(0, 1, 0);
    if (!snapped.current) {
      camera.position.copy(desired.current);
      snapped.current = true;
    } else {
      camera.position.lerp(desired.current, 1 - Math.exp(-dt * (eye ? 14 : 8)));
    }
    camera.lookAt(lookAt.current);

    if (group.current) {
      group.current.visible = !eye;
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

    const hook = window as Window & {
      __homeWalk?: { x: number; z: number; yaw: number; zoom: number; eye: boolean };
    };
    hook.__homeWalk = {
      x: pos.current.x,
      z: pos.current.z,
      yaw: yawNow,
      zoom: eye ? fov.current : dist.current,
      eye,
    };
  });

  return (
    <group ref={group} visible={false} position={[spawn.x, 0, spawn.z]} rotation={[0, spawn.yaw + Math.PI, 0]} userData={{ camSkip: true }}>
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
  );
}

function ViewProbe() {
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  useFrame(({ camera }) => {
    camera.updateMatrixWorld();
    right.current.setFromMatrixColumn(camera.matrixWorld, 0);
    up.current.setFromMatrixColumn(camera.matrixWorld, 1);
    const hook = window as Window & {
      __roomView?: {
        x: number;
        y: number;
        z: number;
        rightX: number;
        rightZ: number;
        upX: number;
        upZ: number;
      };
    };
    hook.__roomView = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      rightX: right.current.x,
      rightZ: right.current.z,
      upX: up.current.x,
      upZ: up.current.z,
    };
  });
  return null;
}

function CameraRig({
  top,
  bounds,
  single,
  controls,
}: {
  top: boolean;
  bounds: { cx: number; cz: number; span: number; minX: number; maxX: number; minZ: number; maxZ: number };
  single: boolean;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  // Size edits change bounds every keystroke. Reframe only when the view mode changes,
  // so a zoomed-out orbit stays where the user left it.
  useEffect(() => {
    const frame = boundsRef.current;
    if (top) {
      // Screen right is +X and screen up is −Z, matching the default orbit view.
      camera.up.set(0, 0, -1);
      camera.position.set(frame.cx, Math.max(8, frame.span * 1.35), frame.cz);
      camera.lookAt(frame.cx, 0, frame.cz);
    } else if (single) {
      camera.up.set(0, 1, 0);
      camera.position.set(frame.minX + 0.5, 1.7, frame.maxZ - 0.5);
      camera.lookAt(frame.cx, 0.3, frame.cz);
    } else {
      camera.up.set(0, 1, 0);
      camera.position.set(frame.cx, Math.max(7, frame.span * 0.9), frame.cz + frame.span * 0.2);
      camera.lookAt(frame.cx, 0, frame.cz);
    }
    controls.current?.target.set(frame.cx, top ? 0 : 0.3, frame.cz);
    controls.current?.update();
  }, [top, single, camera, controls]);
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

function RoomShell({
  plan,
  plans,
  origin,
  layout,
  mats,
  wallMat,
  ceiling,
  active,
  showLabel,
}: {
  plan: RoomPlan;
  plans: RoomPlan[];
  origin: RoomOrigin;
  layout: RoomOrigin[];
  mats: StoreMats;
  wallMat: THREE.Material;
  ceiling: boolean;
  active: boolean;
  showLabel: boolean;
}) {
  const width = origin.width;
  const length = origin.length;
  const height = plan.heightIn * INCH;
  const floor = plan.floor === "oak" ? mats.oakFloor : plan.floor === "tile" ? mats.tile : mats.carpet;
  const openings = roomOpenings(plan, origin, plans, layout);
  const cover = sharedCover(plan, origin, layout);
  const gapsFor = (wall: DoorWall) => {
    const gaps = openings
      .filter((opening) => opening.wall === wall)
      .map((opening) => ({ center: opening.center, width: opening.width }));
    if (cover?.wall === wall) gaps.push({ center: cover.center, width: cover.width });
    return gaps;
  };

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={floor}>
        <planeGeometry args={[width, length]} />
      </mesh>
      <RoomGrid width={width} length={length} />
      <WallRun axis="x" position={[0, height / 2, -length / 2 - 0.04]} span={width} height={height} gaps={gapsFor("s")} material={wallMat} />
      <WallRun axis="x" position={[0, height / 2, length / 2 + 0.04]} span={width} height={height} gaps={gapsFor("n")} material={wallMat} />
      <WallRun axis="z" position={[-width / 2 - 0.04, height / 2, 0]} span={length} height={height} gaps={gapsFor("w")} material={wallMat} />
      <WallRun axis="z" position={[width / 2 + 0.04, height / 2, 0]} span={length} height={height} gaps={gapsFor("e")} material={wallMat} />
      {ceiling ? (
        <mesh position={[0, height, 0]} material={mats.ceiling}>
          <boxGeometry args={[width, 0.06, length]} />
        </mesh>
      ) : null}
      {showLabel ? (
        <Html position={[0, 1.5, 0]} center>
          <span className={cn("whitespace-nowrap rounded px-2 py-1 text-[11px]", active ? "bg-orange text-navy" : "bg-navy/80 text-paper")}>
            {plan.name}
          </span>
        </Html>
      ) : null}
    </>
  );
}

function WallRun({
  axis,
  position,
  span,
  height,
  gaps,
  material,
}: {
  axis: "x" | "z";
  position: [number, number, number];
  span: number;
  height: number;
  gaps: { center: number; width: number }[];
  material: THREE.Material;
}) {
  const parts = spanSegments(span, gaps);
  return (
    <group position={position}>
      {parts.map((segment) => (
        <mesh
          key={`${segment.center}:${segment.length}`}
          position={axis === "x" ? [segment.center, 0, 0] : [0, 0, segment.center]}
          material={material}
          castShadow
          receiveShadow
        >
          <boxGeometry args={axis === "x" ? [segment.length, height, 0.08] : [0.08, height, segment.length]} />
        </mesh>
      ))}
    </group>
  );
}
