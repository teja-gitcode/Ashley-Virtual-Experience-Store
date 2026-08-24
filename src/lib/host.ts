import { firstPlacement, PRODUCT_MAP, ROOMS, standNear, type RoomId } from "./catalog";

export const HOST_NAME = "Alex";

export const HOST_IDLE: [number, number] = [1.7, 9.85];
export const HOST_GREET: [number, number] = [0.2, 11.25];

const AROUND_DESK: [number, number][] = [
  [2.45, 11.2],
  [2.45, 7.2],
  [0, 6.05],
];

export type HostLead = {
  label: string;
  waypoints: [number, number][];
  productId?: string;
};

function pathTo(end: [number, number], extra: [number, number][] = []): [number, number][] {
  return [...AROUND_DESK, ...extra, end];
}

export function leadToRoom(id: RoomId): HostLead | null {
  const room = ROOMS.find((r) => r.id === id);
  if (!room) return null;
  const [x, z] = room.spawn;
  const extra: [number, number][] =
    id === "lobby"
      ? []
      : id === "living"
        ? [
            [0, 4.55],
            [-10, 4.55],
          ]
        : id === "bedroom"
          ? [
              [0, 4.55],
              [10, 4.55],
            ]
          : id === "dining"
            ? [
                [0, -4.55],
                [-10, -4.55],
              ]
            : id === "sleep"
              ? [
                  [0, -4.55],
                  [10, -4.55],
                ]
              : id === "kitchen"
                ? [
                    [0, 0.4],
                    [-18, 0.4],
                  ]
                : id === "kids"
                  ? [
                      [0, 0.5],
                      [18, 0.5],
                    ]
                  : id === "office"
                    ? [
                        [0, -12],
                        [18, -12],
                      ]
                    : id === "patio"
                      ? [[0, -20.6]]
                      : id === "lot"
                        ? [
                            [0, 16.4],
                            [0, 23.5],
                          ]
                        : [];
  if (id === "lobby") {
    return { label: room.label, waypoints: [HOST_GREET] };
  }
  if (id === "lot") {
    return { label: room.label, waypoints: extra };
  }
  return { label: room.label, waypoints: pathTo([x, z], extra) };
}

export function leadToProduct(productId: string, name: string): HostLead | null {
  const place = firstPlacement(productId);
  if (!place) return null;
  const [x, z] = standNear(place);
  const product = PRODUCT_MAP[productId];
  const via = product ? (leadToRoom(product.room)?.waypoints.slice(0, -1) ?? pathTo([x, z])) : pathTo([x, z]);
  return { label: name, waypoints: [...via, [x, z]], productId };
}
