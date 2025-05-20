import { NextResponse } from "next/server";
import { writeFile, unlink, stat, mkdir, readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Types
type Photo = {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  // width: number;
  // height: number;
  order: number;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Constants
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");
const BASE_URL = "/uploads";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Helper functions
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
    throw new Error("Failed to initialize upload directory");
  }
}

// async function getImageDimensions(
//   buffer: Buffer
// ): Promise<{ width: number; height: number }> {
//   try {
//     const sharp = (await import("sharp")).default;
//     const { width, height } = await sharp(buffer).metadata();
//     return { width: width || 0, height: height || 0 };
//   } catch {
//     return { width: 0, height: 0 };
//   }
// }

async function getPhotoById(id: string, sessionId: string): Promise<Photo | null> {
  try {
    const photo = await prisma.photo.findUnique({
      where: { id, sessionId },
    });

    if (!photo) return null;

    const filePath = path.join(UPLOAD_DIR, `${photo.id}${path.extname(photo.url)}`);
    const stats = await stat(filePath);
    await readFile(filePath);

    return {
      id: photo.id,
      url: photo.url,
      filename: path.basename(photo.url),
      size: stats.size,
      type: path.extname(photo.url).slice(1),
      order: photo.order,
      sessionId: photo.sessionId,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    };
  } catch (error) {
    console.error(`Error getting photo by ID ${id}:`, error);
    return null;
  }
}

// API Handlers
export async function GET(request: Request) {
  try {
    await ensureUploadDir();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID diperlukan" },
        { status: 400 }
      );
    }

    if (id) {
      const photo = await getPhotoById(id, sessionId);
      if (!photo) {
        return NextResponse.json(
          { success: false, message: "Foto tidak ditemukan" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: photo,
        message: "Berhasil mendapatkan foto",
      });
    }

    // Get photos for the specific session only
    const photos = await prisma.photo.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
    });

    const photosWithDetails = await Promise.all(
      photos.map(async (photo) => {
        try {
          const filePath = path.join(UPLOAD_DIR, `${photo.id}${path.extname(photo.url)}`);
          const stats = await stat(filePath);
          return {
            id: photo.id,
            url: photo.url,
            filename: path.basename(photo.url),
            size: stats.size,
            type: path.extname(photo.url).slice(1),
            order: photo.order,
            sessionId: photo.sessionId,
            createdAt: photo.createdAt,
            updatedAt: photo.updatedAt,
          };
        } catch (error) {
          console.error(`Error getting stats for photo ${photo.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any null values from failed stat calls
    const validPhotos = photosWithDetails.filter((photo): photo is Photo => photo !== null);

    return NextResponse.json({
      success: true,
      data: validPhotos,
      message: "Berhasil mendapatkan daftar foto sesi",
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat foto" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log("Starting photo upload...");
    await ensureUploadDir();
    
    console.log("Parsing form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;

    console.log("Received file:", file ? `${file.name} (${file.type}, ${file.size} bytes)` : 'none');
    console.log("Session ID:", sessionId);

    if (!file) {
      console.error("No file provided in form data");
      return NextResponse.json(
        { success: false, message: "Tidak ada file yang diunggah" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      console.error("No sessionId provided");
      return NextResponse.json(
        { success: false, message: "Session ID diperlukan" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error(`Unsupported file type: ${file.type}`);
      return NextResponse.json(
        { 
          success: false, 
          message: `Tipe file tidak didukung. Gunakan: ${ALLOWED_TYPES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE} bytes)`);
      return NextResponse.json(
        { 
          success: false, 
          message: `Ukuran file (${(file.size / 1024 / 1024).toFixed(2)}MB) melebihi batas maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        },
        { status: 400 }
      );
    }

    console.log("Getting next order number...");
    const lastPhoto = await prisma.photo.findFirst({
      where: { sessionId },
      orderBy: { order: 'desc' },
    });

    const order = lastPhoto ? lastPhoto.order + 1 : 1;
    const fileExt = path.extname(file.name) || '.jpg'; // Default to .jpg if no extension
    const fileId = Date.now().toString();
    const filename = `${fileId}${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    console.log(`Saving file to ${filePath}...`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      await writeFile(filePath, buffer);
      console.log("File saved successfully");
    } catch (writeError) {
      console.error("Failed to save file:", writeError);
      return NextResponse.json(
        { 
          success: false, 
          message: `Gagal menyimpan file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}` 
        },
        { status: 500 }
      );
    }

    console.log("Checking if session exists...");
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      console.error(`Session not found with ID: ${sessionId}`);
      // Clean up the uploaded file since we can't associate it with a session
      try {
        await unlink(filePath);
        console.log("Cleaned up file after session not found");
      } catch (cleanupError) {
        console.error("Failed to clean up file:", cleanupError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Sesi tidak ditemukan dengan ID: ${sessionId}` 
        },
        { status: 404 }
      );
    }

    console.log("Saving to database...");
    try {
      const photo = await prisma.photo.create({
        data: {
          id: fileId,
          url: `${BASE_URL}/${filename}`,
          order,
          session: {
            connect: { id: sessionId }
          },
        },
      });
      console.log("Database record created successfully");

      return NextResponse.json({
        success: true,
        data: {
          id: photo.id,
          url: photo.url,
          filename: path.basename(photo.url),
          size: file.size,
          type: file.type,
          order: photo.order,
          sessionId: photo.sessionId,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt,
        },
        message: "Berhasil mengunggah foto",
      });
    } catch (dbError) {
      // Clean up the file if database operation fails
      try {
        await unlink(filePath);
        console.log("Cleaned up file after database error");
      } catch (cleanupError) {
        console.error("Failed to clean up file:", cleanupError);
      }
      
      console.error("Database error:", dbError);
      throw dbError; // This will be caught by the outer catch block
    }
  } catch (error) {
    console.error("Error in photo upload:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Gagal mengunggah foto: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const sessionId = searchParams.get("sessionId");

    if (!id && !sessionId) {
      return NextResponse.json(
        { success: false, message: "ID foto atau sessionId diperlukan" },
        { status: 400 }
      );
    }

    if (id) {
      // Delete single photo
      const photo = await prisma.photo.findUnique({
        where: { id },
      });

      if (!photo) {
        return NextResponse.json(
          { success: false, message: "Foto tidak ditemukan" },
          { status: 404 }
        );
      }

      // Delete file from disk
      const filePath = path.join(UPLOAD_DIR, `${photo.id}${path.extname(photo.url)}`);
      try {
        await unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error);
      }

      // Delete from database
      await prisma.photo.delete({
        where: { id },
      });
    } else if (sessionId) {
      // Delete all photos for session
      const photos = await prisma.photo.findMany({
        where: { sessionId },
      });

      // Delete all files
      await Promise.all(
        photos.map(async (photo) => {
          const filePath = path.join(UPLOAD_DIR, `${photo.id}${path.extname(photo.url)}`);
          try {
            await unlink(filePath);
          } catch (error) {
            console.error(`Failed to delete file ${filePath}:`, error);
          }
        })
      );

      // Delete all photos from database
      await prisma.photo.deleteMany({
        where: { sessionId },
      });
    }

    return NextResponse.json({
      success: true,
      message: id ? "Foto berhasil dihapus" : "Semua foto sesi berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus foto" },
      { status: 500 }
    );
  }
}
