export function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    navigator.maxTouchPoints > 0
  );
}

export async function requestOrientationPermission() {
  const DOE = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<PermissionState>;
  };
  if (typeof DOE.requestPermission === "function") {
    try {
      return (await DOE.requestPermission()) === "granted";
    } catch {
      return false;
    }
  }
  return true;
}

export async function inlineXrSupported() {
  const xr = navigator.xr;
  if (!xr?.isSessionSupported) return false;
  try {
    return await xr.isSessionSupported("inline");
  } catch {
    return false;
  }
}
