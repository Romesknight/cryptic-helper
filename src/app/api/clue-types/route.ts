import { NextResponse } from "next/server";
import { CLUE_TYPES } from "@/data/clue-types";

/**
 * GET /api/clue-types
 * Returns all 9 clue types with their definitions and indicators.
 * Uses static data (no DB dependency) for fast, reliable responses.
 */
export async function GET() {
  return NextResponse.json(CLUE_TYPES);
}
