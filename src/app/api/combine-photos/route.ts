import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { v4 as uuidv4 } from 'uuid';

// Frame dimensions
const FRAME_WIDTH = 2635;
const FRAME_HEIGHT = 3715;

// Placeholder positions (x, y, width, height)
const PLACEHOLDERS = [
  { id: "1", x: 134, y: 511, width: 1048, height: 659 },
  { id: "2", x: 134, y: 1358, width: 1048, height: 659 },
  { id: "3", x: 134, y: 2213, width: 1048, height: 659 },
  { id: "4", x: 1460, y: 511, width: 1048, height: 659 },
  { id: "5", x: 1460, y: 1358, width: 1048, height: 659 },
  { id: "6", x: 1460, y: 2213, width: 1048, height: 659 },
];

// Ensure final-photos directory exists
async function ensureFinalPhotosDir() {
  const finalPhotosDir = path.join(process.cwd(), 'public', 'final-photos');
  try {
    await fs.promises.mkdir(finalPhotosDir, { recursive: true });
  } catch (error) {
    console.error('Error creating final-photos directory:', error);
  }
  return finalPhotosDir;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    const { photos, frameImage } = data;

    if (!photos || !Array.isArray(photos) || !frameImage) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Create the canvas
    const canvas = createCanvas(FRAME_WIDTH, FRAME_HEIGHT);
    const ctx = canvas.getContext('2d');

    // Load the frame image
    const frame = await loadImage(path.join(process.cwd(), 'public', frameImage));

    // Draw the photos first
    for (let i = 0; i < Math.min(photos.length, PLACEHOLDERS.length); i++) {
      const photo = photos[i];
      const placeholder = PLACEHOLDERS[i];
      
      if (photo && photo.url) {
        // Remove the leading slash if present
        const photoPath = photo.url.startsWith('/') 
          ? photo.url.substring(1) 
          : photo.url;
          
        try {
          const img = await loadImage(path.join(process.cwd(), 'public', photoPath));
          
          // Draw the photo in the placeholder position
          ctx.drawImage(
            img, 
            placeholder.x, 
            placeholder.y, 
            placeholder.width, 
            placeholder.height
          );
        } catch (error) {
          console.error(`Error loading image ${photo.url}:`, error);
        }
      }
    }

    // Draw the frame on top
    ctx.drawImage(frame, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

    // Generate a unique filename
    const filename = `${uuidv4()}.png`;
    const finalPhotosDir = await ensureFinalPhotosDir();
    const outputPath = path.join(finalPhotosDir, filename);
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    await fs.promises.writeFile(outputPath, buffer);

    // Return the path to the generated image
    return NextResponse.json({
      success: true,
      imagePath: `/final-photos/${filename}`
    });
  } catch (error) {
    console.error('Error combining photos:', error);
    return NextResponse.json(
      { error: 'Failed to combine photos' },
      { status: 500 }
    );
  }
}
