export async function saveFile(
  file: File,
  subdir: "uploads" | "logos" = "uploads"
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
    : ext === "png" ? "image/png"
    : ext === "gif" ? "image/gif"
    : ext === "webp" ? "image/webp"
    : "image/png";

  const base64 = buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
}
