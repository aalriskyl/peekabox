import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { message: "Kode tidak boleh kosong." },
      { status: 400 }
    );
  }

  // Cari sessionCode berdasarkan kode yang dimasukkan
  const sessionCode = await prisma.sessionCode.findUnique({
    where: { code },
  });

  if (!sessionCode) {
    return NextResponse.json(
      { message: "Kode tidak valid atau tidak ditemukan." },
      { status: 400 }
    );
  }

  // Check if code is already used
  if (sessionCode.status === "USED") {
    return NextResponse.json(
      { message: "Kode sudah digunakan." },
      { status: 400 }
    );
  }

  // Check if code is expired
  if (sessionCode.expiredAt && new Date() > sessionCode.expiredAt) {
    return NextResponse.json(
      { message: "Kode sudah kadaluarsa." },
      { status: 400 }
    );
  }

  // Mark the code as used
  await prisma.sessionCode.update({
    where: { code },
    data: { status: "USED", usedAt: new Date() },
  });

  // Cari apakah session sudah ada berdasarkan kode
  const existingSession = await prisma.session.findUnique({
    where: { code },
  });

  if (existingSession) {
    return NextResponse.json(
      { sessionId: existingSession.id },
      { status: 200 }
    );
  }

  // Jika session belum ada, buat session baru
  const session = await prisma.session.create({
    data: {
      code,
      status: 'ACTIVE',
      sessionCode: {
        connect: { id: sessionCode.id }
      },
      usedAt: new Date()
    },
  });

  return NextResponse.json({ 
    success: true,
    data: {
      sessionId: session.id,
      code: session.code
    }
  });
}
