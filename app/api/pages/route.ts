import { auth } from "@/auth";
import { createPage, getPagesByUserId } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pages = await getPagesByUserId(session.user.id);
  return NextResponse.json(pages);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { title } = body;
  const result = await createPage(session.user.id, title);
  return NextResponse.json(result, { status: 201 });
}
