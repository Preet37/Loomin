import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const savedSim = await prisma.simulation.create({
      data: {
        topic: body.topic,
        score: body.score,
        config: body.config // Prisma handles JSON automatically
      }
    });
    return NextResponse.json(savedSim);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const topSims = await prisma.simulation.findMany({
      orderBy: { score: 'desc' },
      take: 10
    });
    return NextResponse.json(topSims);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}