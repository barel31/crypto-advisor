import { prisma } from '@/lib/prisma';

// Initialize a temporary user for development
export async function initTempUser() {
  const TEMP_USER_ID = 'temp-user-1';
  
  try {
    // Check if temp user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: TEMP_USER_ID },
    });

    if (!existingUser) {
      // Create temp user
      await prisma.user.create({
        data: {
          id: TEMP_USER_ID,
          email: 'temp@example.com',
          name: 'Temporary User',
        },
      });
      console.log('Temporary user created for development');
    }
  } catch (error) {
    console.error('Error initializing temp user:', error);
  }
}

export { prisma };
