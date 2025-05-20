import { NextResponse } from "next/server";
import { writeFile, unlink, readdir, stat, mkdir, readFile } from "fs/promises";
import path from "path";

// Types
type Frame = {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  createdAt: Date;
  dimensions?: { width: number; height: number };
};

// Constants
const FRAMES_DIR = path.join(process.cwd(), "public/frames");
const BASE_URL = "/frames";
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const REQUIRED_WIDTH = 2635;
const REQUIRED_HEIGHT = 3715;

// Helper functions
async function ensureFramesDir() {
  try {
    await mkdir(FRAMES_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create frames directory:", error);
    throw new Error("Failed to initialize frames directory");
  }
}

async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  try {
    const sharp = (await import("sharp")).default;
    const { width, height } = await sharp(buffer).metadata();
    return { width: width || 0, height: height || 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

async function getFrameById(id: string): Promise<Frame | null> {
  try {
    const files = await readdir(FRAMES_DIR);
    const file = files.find((f) => path.parse(f).name === id);
    if (!file) return null;

    const stats = await stat(path.join(FRAMES_DIR, file));
    const buffer = await readFile(path.join(FRAMES_DIR, file));

    return {
      id: path.parse(file).name,
      url: `${BASE_URL}/${file}`,
      filename: file,
      size: stats.size,
      type: path.extname(file).slice(1),
      createdAt: stats.birthtime,
      dimensions: await getImageDimensions(buffer),
    };
  } catch (error) {
    console.error(`Error getting frame by ID ${id}:`, error);
    return null;
  }
}

function extractIdFromRequest(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get("id");
}

// API Handlers
export async function GET(request: Request) {
  try {
    await ensureFramesDir();
    const id = extractIdFromRequest(request);

    if (id) {
      const frame = await getFrameById(id);
      if (!frame) {
        return NextResponse.json(
          { success: false, message: "Frame tidak ditemukan" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: frame,
        message: "Berhasil mendapatkan frame",
      });
    }

    const files = await readdir(FRAMES_DIR);
    const frames = await Promise.all(
      files.map(async (file) => {
        const stats = await stat(path.join(FRAMES_DIR, file));
        return {
          id: path.parse(file).name,
          url: `${BASE_URL}/${file}`,
          filename: file,
          size: stats.size,
          type: path.extname(file).slice(1),
          createdAt: stats.birthtime,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: frames,
      message: "Berhasil mendapatkan semua frame",
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat frame" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureFramesDir();
    const formData = await request.formData();
    const file = formData.get("frame") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Tidak ada frame yang diunggah" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Format file tidak didukung. Gunakan: ${ALLOWED_TYPES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `Ukuran file terlalu besar. Maksimal: ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `frame-${Date.now()}${path.extname(file.name)}`;
    const filePath = path.join(FRAMES_DIR, filename);

    await writeFile(filePath, buffer);
    const dimensions = await getImageDimensions(buffer);

    // Validate dimensions
    if (
      dimensions.width !== REQUIRED_WIDTH ||
      dimensions.height !== REQUIRED_HEIGHT
    ) {
      // Clean up the uploaded file
      await unlink(path.join(FRAMES_DIR, filename));
      return NextResponse.json(
        {
          success: false,
          message: `Gambar harus berukuran tepat ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT} piksel (Ukuran A6). Gambar yang diunggah: ${dimensions.width}x${dimensions.height} piksel`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: path.parse(filename).name,
        url: `${BASE_URL}/${filename}`,
        filename,
        size: file.size,
        type: file.type.split("/")[1],
        createdAt: new Date(),
        dimensions,
      },
      message: "Berhasil mengunggah frame",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengunggah frame" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const file = formData.get("frame") as File | null;

    const existingFrame = await getFrameById(id);
    if (!existingFrame) {
      return NextResponse.json(
        { success: false, message: "Frame tidak ditemukan" },
        { status: 404 }
      );
    }

    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: "Format file tidak didukung" },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: "Ukuran file terlalu besar" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const dimensions = await getImageDimensions(buffer);

      // Validate dimensions
      if (
        dimensions.width !== REQUIRED_WIDTH ||
        dimensions.height !== REQUIRED_HEIGHT
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Gambar harus berukuran tepat ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT} piksel (Ukuran A6). Gambar yang diunggah: ${dimensions.width}x${dimensions.height} piksel`,
          },
          { status: 400 }
        );
      }

      await unlink(path.join(FRAMES_DIR, existingFrame.filename));
      const newFilename = `frame-${Date.now()}${path.extname(file.name)}`;
      await writeFile(path.join(FRAMES_DIR, newFilename), buffer);

      return NextResponse.json({
        success: true,
        data: {
          id: path.parse(newFilename).name,
          url: `${BASE_URL}/${newFilename}`,
          filename: newFilename,
          size: file.size,
          type: file.type.split("/")[1],
          createdAt: new Date(),
          dimensions,
        },
        message: "Berhasil mengupdate frame",
      });
    }

    return NextResponse.json({
      success: true,
      data: existingFrame,
      message: "Frame tidak diubah",
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate frame" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = extractIdFromRequest(request);
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID frame diperlukan" },
        { status: 400 }
      );
    }

    const frame = await getFrameById(id);
    if (!frame) {
      return NextResponse.json(
        { success: false, message: "Frame tidak ditemukan" },
        { status: 404 }
      );
    }

    await unlink(path.join(FRAMES_DIR, frame.filename));
    return NextResponse.json({
      success: true,
      message: "Berhasil menghapus frame",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus frame" },
      { status: 500 }
    );
  }
}
