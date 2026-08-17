import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, tag, path, type } = body;

    // Validate secret strictly
    const validSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET || process.env.REVALIDATE_SECRET;

    if (!validSecret || secret !== validSecret) {
      return NextResponse.json({ message: "Invalid or missing secret" }, { status: 401 });
    }

    if (path) {
      const validPathType: "page" | "layout" = type === "layout" ? "layout" : "page";
      revalidatePath(path, validPathType);
      return NextResponse.json({ revalidated: true, path, type: validPathType, now: Date.now() });
    }

    if (!tag) {
      return NextResponse.json({ message: "Missing tag or path parameter" }, { status: 400 });
    }

    revalidateTag(tag);

    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ message: "Error revalidating", error: err.message }, { status: 500 });
  }
}
