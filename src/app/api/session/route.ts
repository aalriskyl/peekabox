import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

function generateCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10; // 10 items per page
  const skip = (page - 1) * limit;

  try {
    if (id) {
      // Get single session by ID with its photos
      const session = await prisma.session.findUnique({
        where: { id },
        include: {
          photos: {
            orderBy: { order: "asc" },
          },
          sessionCode: true,
        },
      });

      if (!session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: {
          session,
        },
        message: "Session berhasil didapatkan",
      });
    } else {
      // Get paginated sessions with photo count
      const [sessions, total] = await Promise.all([
        prisma.session.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            _count: {
              select: { photos: true },
            },
          },
        }),
        prisma.session.count(),
      ]);

      // Format the response to include photoCount
      const formattedSessions = sessions.map((session) => ({
        id: session.id,
        code: session.code,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        usedAt: session.usedAt,
        photoCount: session._count.photos,
      }));

      return NextResponse.json({
        data: {
          formattedSessions,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            length: formattedSessions.length, // tambahkan ini
          },
        },
        message: "Sessions berhasil didapatkan",
      });
    }
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST() {
  let code = generateCode();
  let exists = await prisma.session.findUnique({ where: { code } });

  // regenerate until unique
  while (exists) {
    code = generateCode();
    exists = await prisma.session.findUnique({ where: { code } });
  }

  try {
    // First create a session code
    const sessionCode = await prisma.sessionCode.create({
      data: {
        code,
        status: "ACTIVE",
      },
    });

    // Then create the session with the session code
    const session = await prisma.session.create({
      data: {
        code,
        status: "ACTIVE",
        sessionCode: {
          connect: { id: sessionCode.id },
        },
      },
      include: {
        sessionCode: true,
      },
    });

    return NextResponse.json(
      {
        id: session.id,
        code: session.code,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        usedAt: session.usedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
