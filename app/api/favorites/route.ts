import { NextRequest, NextResponse } from 'next/server';
import { prisma, initTempUser } from '@/app/lib/database';

// For now, we'll use a temporary user ID until authentication is implemented
const TEMP_USER_ID = 'temp-user-1';

// Initialize temp user on first API call
let userInitialized = false;

async function ensureUser() {
  if (!userInitialized) {
    await initTempUser();
    userInitialized = true;
  }
}

export async function GET() {
  try {
    await ensureUser();
    
    const favorites = await prisma.watchlist.findMany({
      where: {
        userId: TEMP_USER_ID,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUser();
    
    const { symbol, name } = await request.json();

    if (!symbol || !name) {
      return NextResponse.json(
        { error: 'Symbol and name are required' },
        { status: 400 }
      );
    }

    // Check if favorite already exists
    const existingFavorite = await prisma.watchlist.findUnique({
      where: {
        userId_symbol: {
          userId: TEMP_USER_ID,
          symbol: symbol.toUpperCase(),
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Favorite already exists' },
        { status: 409 }
      );
    }

    const favorite = await prisma.watchlist.create({
      data: {
        userId: TEMP_USER_ID,
        symbol: symbol.toUpperCase(),
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureUser();
    
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const deletedFavorite = await prisma.watchlist.delete({
      where: {
        userId_symbol: {
          userId: TEMP_USER_ID,
          symbol: symbol.toUpperCase(),
        },
      },
    });

    return NextResponse.json(deletedFavorite);
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
