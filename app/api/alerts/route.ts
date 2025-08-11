import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kv } from "@vercel/kv";
import { Prisma } from "@prisma/client";

interface AlertError {
  error: string;
  code?: string;
  status: number;
}

interface CreateAlertDTO {
  symbol: string;
  price: number;
  condition: "above" | "below";
}

// Rate limit for creating alerts (max 10 alerts per hour per IP)
async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `alert-limit:${ip}`;
  const count = await kv.incr(key);
  
  if (count === 1) {
    await kv.expire(key, 3600); // 1 hour
  }
  
  return count <= 10;
}

// Validate alert data
async function validateAlert(symbol: string, price: number, condition: string): Promise<boolean> {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("Invalid symbol");
  }

  if (!price || typeof price !== "number" || price <= 0) {
    throw new Error("Invalid price");
  }

  if (!condition || !["above", "below"].includes(condition)) {
    throw new Error("Invalid condition");
  }

  // Check if symbol exists
  const symbolData = await kv.get(`crypto:${symbol}`);
  if (!symbolData) {
    throw new Error("Invalid cryptocurrency symbol");
  }

  return true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const alerts = await prisma.priceAlert.findMany({
      where: {
        ...(userId ? { userId } : {})
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json<AlertError>(
      { error: "Failed to fetch alerts", status: 500 },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const withinLimit = await checkRateLimit(ip);
    
    if (!withinLimit) {
      return NextResponse.json<AlertError>(
        { error: "Rate limit exceeded", code: "RATE_LIMIT", status: 429 },
        { status: 429 }
      );
    }

    const body = await request.json() as CreateAlertDTO;
    const { symbol, price, condition } = body;
    const userId = request.headers.get("x-user-id");

    await validateAlert(symbol, price, condition);

    const alert = await prisma.priceAlert.create({
      data: {
        symbol,
        price,
        condition,
        userId,
        triggered: false
      }
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error creating alert:", error);

    if (error instanceof Error) {
      return NextResponse.json<AlertError>(
        { error: error.message, code: "VALIDATION_ERROR", status: 400 },
        { status: 400 }
      );
    }

    return NextResponse.json<AlertError>(
      { error: "Failed to create alert", status: 500 },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = request.headers.get("x-user-id");

    if (!id) {
      return NextResponse.json<AlertError>(
        { error: "Alert ID is required", code: "MISSING_ID", status: 400 },
        { status: 400 }
      );
    }

    await prisma.priceAlert.delete({
      where: {
        id,
        ...(userId ? { userId } : {})
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json<AlertError>(
          { error: "Alert not found", code: "NOT_FOUND", status: 404 },
          { status: 404 }
        );
      }
    }

    return NextResponse.json<AlertError>(
      { error: "Failed to delete alert", status: 500 },
      { status: 500 }
    );
  }
}