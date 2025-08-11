import { prisma } from './prisma';

export interface UserPreferencesInput {
  riskTolerance: 'LOW' | 'MODERATE' | 'HIGH';
  preferredCurrencies: string[];
  notificationsEnabled: boolean;
}

export async function updateUserPreferences(userId: string, preferences: UserPreferencesInput) {
  return prisma.userPreferences.upsert({
    where: {
      userId
    },
    update: {
      riskTolerance: preferences.riskTolerance,
      preferredCurrencies: preferences.preferredCurrencies.join(','),
      notificationsEnabled: preferences.notificationsEnabled
    },
    create: {
      userId,
      riskTolerance: preferences.riskTolerance,
      preferredCurrencies: preferences.preferredCurrencies.join(','),
      notificationsEnabled: preferences.notificationsEnabled
    }
  });
}

export async function getUserPreferences(userId: string) {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      riskTolerance: true,
      preferredCurrencies: true,
      notificationsEnabled: true
    }
  });

  if (!prefs) return null;

  return {
    ...prefs,
    preferredCurrencies: prefs.preferredCurrencies.split(',').filter(Boolean)
  };
}
