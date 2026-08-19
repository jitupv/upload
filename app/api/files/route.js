import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { blobs } = await list();
    const files = blobs
      .map((b) => ({
        url: b.url,
        downloadUrl: b.downloadUrl,
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
      }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
