/** Pointer id of the walk stick, or null. Picker ignores this pointer. */
export let stickPointerId: number | null = null;

export function setStickPointer(id: number | null) {
  stickPointerId = id;
}
