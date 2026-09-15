import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = (form.get("kind") as string) || "image"; // image | video
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const isVideo = kind === "video" || file.type.startsWith("video/");
    const allowedVideo = ["video/mp4", "video/webm", "video/quicktime"];
    const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (isVideo && !allowedVideo.includes(file.type)) {
      return NextResponse.json({ error: "Video must be MP4 or WebM" }, { status: 400 });
    }
    if (!isVideo && !allowedImage.includes(file.type)) {
      return NextResponse.json({ error: "Image must be JPG, PNG, WebP or AVIF" }, { status: 400 });
    }
    if (isVideo && file.size > MAX_VIDEO) {
      return NextResponse.json({ error: "Video must be under 80MB" }, { status: 400 });
    }
    if (!isVideo && file.size > MAX_IMAGE) {
      return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 });
    }
    const ext = file.type === "video/webm" ? "webm" : file.type === "video/mp4" ? "mp4" : file.name.split(".").pop() || "bin";
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", isVideo ? "videos" : "images");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buf);
    const url = `/uploads/${isVideo ? "videos" : "images"}/${name}`;
    return NextResponse.json({ ok: true, url, type: file.type, size: file.size });
  } catch (e) {
    console.error("upload failed", e);
    return NextResponse.json({ error: "Upload failed. Try a smaller file." }, { status: 500 });
  }
}
