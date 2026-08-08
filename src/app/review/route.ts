import { NextResponse } from "next/server";
import { getGoogleReviewUrl } from "@/lib/config/reviews";

// NFC sticker #1 points here rather than straight at Google, so the destination
// can change without peeling and re-writing the tag.
//
// Deliberately stateless: no session, no database, no work before the redirect.
// A sticker on the counter is only as reliable as the slowest thing on this path.
export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: getGoogleReviewUrl(),
      // The destination is configuration, not content: never let a shared cache
      // pin an old target after the URL is corrected.
      "Cache-Control": "no-store",
    },
  });
}
