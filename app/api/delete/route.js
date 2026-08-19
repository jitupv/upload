import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }
    await del(url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
