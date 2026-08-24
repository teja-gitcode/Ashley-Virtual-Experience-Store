import { createXRStore } from "@react-three/xr";

export const xrStore = createXRStore({
  hand: { teleportPointer: true },
  controller: { teleportPointer: true },
  screenInput: false,
});
