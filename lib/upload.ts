import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const LOGO_DIR = join(process.cwd(), "public", "logos");

export async function saveFile(
  file: File,
  subdir: "uploads" | "logos" = "uploads"
): Promise<string> {
  const dir = subdir === "logos" ? LOGO_DIR : UPLOAD_DIR;
  await mkdir(dir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "png";
  const filename = `${uuidv4()}.${ext}`;
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);
  return `/${subdir}/${filename}`;
}
