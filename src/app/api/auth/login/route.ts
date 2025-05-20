import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  name: z.string().min(3).max(20),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    // Verify JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { name },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return user data without password
    const userData = {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: { user: userData, token },
      message: "Login successful",
    });
  } catch (error: unknown) {  // Explicitly type error as unknown
    console.error("Login error:", error);
    
    let errorMessage = "Login failed";
    let errorDetails: unknown = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = process.env.NODE_ENV === "development" ? error.message : undefined;
    }

    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: errorDetails
      },
      { status: 500 }
    );
  }
}