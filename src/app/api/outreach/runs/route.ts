import { NextResponse } from "next/server";

import { getOptionalConsoleActor } from "@/lib/auth/console";
import { startOutreachBatchAction } from "@/lib/outreach/actions";

export async function POST(request: Request) {
  const actor = await getOptionalConsoleActor();

  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let limit = 3;
  try {
    const body = (await request.json()) as { limit?: number };
    if (typeof body.limit === "number" && body.limit > 0 && body.limit <= 10) {
      limit = body.limit;
    }
  } catch {
    // default limit
  }

  const formData = new FormData();
  formData.set("limit", String(limit));
  const result = await startOutreachBatchAction(formData);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.formError },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    startedAt: new Date().toISOString(),
  });
}
