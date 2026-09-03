import { NextRequest, NextResponse } from "next/server";
import {
  HARDWARE_CATALOG,
  listHardwareDevices,
} from "@modelforge/hardware-registry";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendor = (searchParams.get("vendor") as any) || undefined;
  const category = searchParams.get("category") || undefined;
  const minVram = searchParams.get("min_vram_gb")
    ? Number(searchParams.get("min_vram_gb"))
    : undefined;

  const devices = listHardwareDevices({ vendor, category, minVramGb: minVram });
  return NextResponse.json(devices);
}
