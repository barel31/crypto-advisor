import { PrismaClient } from '@prisma/client';
import { kv } from '@vercel/kv';
import type { PriceAlert, AlertCondition } from '@/types/alerts';

const prisma = new PrismaClient();

export class AlertValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlertValidationError';
  }
}

export async function validateAlert(symbol: string, price: number, condition: AlertCondition) {
  if (!symbol || typeof symbol !== 'string') {
    throw new AlertValidationError('Invalid symbol');
  }

  if (!price || typeof price !== 'number' || price <= 0) {
    throw new AlertValidationError('Invalid price');
  }

  if (!condition || !['above', 'below'].includes(condition)) {
    throw new AlertValidationError('Invalid condition');
  }

  // Check if symbol exists in our crypto API
  const symbolData = await kv.get(`cache:crypto:${symbol}`);
  if (!symbolData) {
    throw new AlertValidationError('Invalid cryptocurrency symbol');
  }
}

// Rate limit for creating alerts (max 10 alerts per user per day)
export async function checkAlertLimit(userId: string): Promise<boolean> {
  const key = `alertlimit:${userId}`;
  const count = await kv.get<number>(key) || 0;
  
  if (count >= 10) {
    return false;
  }
  
  await kv.incr(key);
  // Set expiry if not exists (24 hours)
  await kv.expire(key, 24 * 60 * 60);
  
  return true;
}

export async function createAlert(data: Omit<PriceAlert, 'id' | 'createdAt'>) {
  return prisma.priceAlert.create({
    data: {
      ...data,
      triggered: false
    }
  });
}

export async function getAlerts(userId?: string) {
  return prisma.priceAlert.findMany({
    where: userId ? { userId } : undefined,
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function deleteAlert(id: string, userId?: string) {
  return prisma.priceAlert.delete({
    where: {
      id,
      ...(userId && { userId })
    }
  });
}

export async function checkAndTriggerAlerts() {
  const activeAlerts = await prisma.priceAlert.findMany({
    where: {
      triggered: false
    }
  });

  for (const alert of activeAlerts) {
    const price = await kv.get<number>(`cache:price:${alert.symbol}`);
    
    if (!price) continue;

    const shouldTrigger = 
      (alert.condition === 'above' && price >= alert.price) ||
      (alert.condition === 'below' && price <= alert.price);

    if (shouldTrigger) {
      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: { triggered: true }
      });

      // Here you would typically send a notification to the user
      // via email, push notification, etc.
    }
  }
}
