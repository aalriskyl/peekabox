import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { promisify } from "util";

export async function POST(request: NextRequest) {
  try {
    const { email, imagePath } = await request.json();
    console.log("Received email request:", { email, imagePath });

    if (!email || !imagePath) {
      return NextResponse.json(
        { error: "Email and image path are required" },
        { status: 400 }
      );
    }

    // Check if we have email configuration
    const hasEmailConfig =
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD;

    // Get the base URL for the application
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    // Construct the full image URL
    const fullImageUrl = `${baseUrl}${imagePath}`;

    // If we have email configuration, send the email
    if (hasEmailConfig) {
      // Create SMTP transporter with actual credentials
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Get the file path on the server
      const filePath = path.join(process.cwd(), "public", imagePath);

      // Check if file exists
      const fileExists = fs.existsSync(filePath);

      if (!fileExists) {
        console.error("Image file not found:", filePath);
        throw new Error("Image file not found");
      }

      // Read the file
      const readFile = promisify(fs.readFile);
      const fileContent = await readFile(filePath);

      // Get filename from path for logging purposes
      const fileName = path.basename(imagePath);
      console.log(`Sending email with attachment: ${fileName}`);

      // Send email with attachment
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Peek A Box" <noreply@peekabox.com>',
        to: email,
        subject: "Your Peek A Box Photo",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; text-align: center;">Your Peek A Box Photo</h1>
            <p style="text-align: center;">Thank you for capturing your moments with us!</p>
            <p style="text-align: center;">We've attached your photo to this email.</p>
            <p style="text-align: center;">Create, snap, and share memories with your squad using Peek A Box!</p>
            <p style="text-align: center;">peek. snap. repeat. follow @peek.abox & book us at (+62) 877 5692 1365</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Peek A Box. All rights reserved.
            </div>
          </div>
        `,
        attachments: [
          {
            filename: "peekabox-photo.png",
            content: fileContent,
            contentType: "image/png",
          },
        ],
      });
    } else {
      // For development: log that we would have sent an email
      console.log("DEVELOPMENT MODE: Would have sent email to", email);
      console.log("With image:", fullImageUrl);

      // Simulate a delay to make it feel like we're doing something
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Log to a file for development purposes
      try {
        const logDir = path.join(process.cwd(), "logs");
        await fs.promises.mkdir(logDir, { recursive: true });

        const logFile = path.join(logDir, "email-log.txt");
        const logEntry = `[${new Date().toISOString()}] Email to: ${email}, Image: ${imagePath}\n`;

        await fs.promises.appendFile(logFile, logEntry);
      } catch (logError) {
        console.error("Error logging email:", logError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
