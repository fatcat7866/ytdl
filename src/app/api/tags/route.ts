import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tags - List all tags with video counts
export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { videos: true },
      },
    },
  });

  return NextResponse.json(tags);
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, color } = body as { name: string; color?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
  }

  const existing = await prisma.tag.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Tag already exists", tag: existing }, { status: 409 });
  }

  const tag = await prisma.tag.create({
    data: {
      name: name.trim(),
      color: color || null,
    },
  });

  return NextResponse.json(tag, { status: 201 });
}
