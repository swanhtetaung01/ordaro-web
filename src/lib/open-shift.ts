import type { Schemas } from "@/lib/backend";
import { readJson } from "@/lib/read-json";

/** The open shift at a store, when a cash movement has to count in the drawer. */
export async function openShiftId(locationId: string) {
  try {
    const shift = await readJson<Schemas["ShiftView"]>(`/api/sales/shifts?locationId=${locationId}`);
    return shift.status === "OPEN" ? shift.id : undefined;
  } catch {
    return undefined;
  }
}
