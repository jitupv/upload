import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Issues a short-lived token so the browser can upload DIRECTLY to Vercel Blob.
// This bypasses Vercel's 4.5 MB serverless request body limit entirely.
export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Anyone with the link can upload. Tighten here later if you want.
        return {
          addRandomSuffix: true,
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB cap
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("uploaded:", blob.pathname, blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
