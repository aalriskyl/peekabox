import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { valid: false, message: "Kode tidak boleh kosong." },
      { status: 400 }
    );
  }

  const session = await prisma.sessionCode.findUnique({
    where: { code },
  });

  if (!session) {
    return NextResponse.json(
      { valid: false, message: "Kode tidak valid atau tidak ditemukan." },
      { status: 400 }
    );
  }

  if (session.status !== "ACTIVE") {
    return NextResponse.json(
      { valid: false, message: "Kode sudah digunakan atau kadaluarsa." },
      { status: 400 }
    );
  }

  // Check if code has expired
  if (session.expiredAt && new Date() > session.expiredAt) {
    return NextResponse.json(
      { valid: false, message: "Kode sudah kadaluarsa." },
      { status: 400 }
    );
  }

  // Return session data without updating the status
  return NextResponse.json({ 
    valid: true,
    sessionId: session.id,
    code: session.code,
    isUsed: session.status,
    expiresAt: session.expiredAt,
    createdAt: session.createdAt,
    usedAt: session.usedAt
  });
}
