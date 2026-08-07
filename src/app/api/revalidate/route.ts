import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, tag, path, type } = body;

    // Use a simple CRON_SECRET or ADMIN_SECRET from env
    const validSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET || 'dev-secret';

    if (secret !== validSecret && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    if (path) {
      revalidatePath(path, type || "page");
      return NextResponse.json({ revalidated: true, path, type, now: Date.now() });
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
