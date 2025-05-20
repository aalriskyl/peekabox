import { NextRequest, NextResponse } from "next/server";
// import fs from 'fs';
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { mkdir, writeFile } from "fs/promises";

// Ensure final-photos directory exists
async function ensureFinalPhotosDir() {
  const finalPhotosDir = path.join(process.cwd(), "public", "final-photos");
  try {
    await mkdir(finalPhotosDir, { recursive: true });
  } catch (error) {
    console.error("Error creating final-photos directory:", error);
  }
  return finalPhotosDir;
}

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // Generate a unique filename
    const filename = `${uuidv4()}.png`;
    const finalPhotosDir = await ensureFinalPhotosDir();
    const outputPath = path.join(finalPhotosDir, filename);

    // Save the image
    await writeFile(outputPath, buffer);

    // Return the path to the generated image
    return NextResponse.json({
      success: true,
      imagePath: `/final-photos/${filename}`,
    });
  } catch (error) {
    console.error("Error saving screenshot:", error);
    return NextResponse.json(
      { error: "Failed to save screenshot" },
      { status: 500 }
    );
  }
}
