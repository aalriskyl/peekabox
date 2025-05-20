import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  // Generate random code untuk session
  const code = randomBytes(4).toString("hex"); // Kode acak dengan panjang 8 karakter

  // Menyimpan kode sesi baru ke dalam database
  const sessionCode = await prisma.sessionCode.create({
    data: {
      code: code,
      status: "ACTIVE", // Status aktif saat kode dibuat
      expiredAt: new Date(Date.now() + 60 * 60 * 1000), // Kode kadaluarsa setelah 1 jam
    },
  });

  return NextResponse.json({
    message: "Kode sesi berhasil dibuat.",
    code: sessionCode.code,
    expiredAt: sessionCode.expiredAt,
  });
}
