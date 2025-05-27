import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name, date, time, event, location, type, category } = await request.json();

    // Validate input
    if (!name || !date || !time || !event || !location || !type || !category) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        date: new Date(date),
        time,
        event,
        location,
        type,
        category,
      },
    });

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Vendor creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 