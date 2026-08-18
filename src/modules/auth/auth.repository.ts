import { prisma } from '@/lib/prisma';
import { RegisterInput } from './auth.schema';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findUserByIdentityCard(identityCard: string) {
    return prisma.resident.findUnique({
      where: { identityCard: identityCard.trim() },
    });
  }

  async createUserWithResidentProfile(data: RegisterInput, passwordHash: string) {
    return prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash,
          fullName: data.fullName,
          phone: data.phone,
          role: 'RESIDENT',
        },
      });

      // Find apartment if code is provided
      let apartmentId: string | undefined;
      if (data.apartmentCode) {
        const apartment = await tx.apartment.findUnique({
          where: { code: data.apartmentCode.trim() },
        });
        if (apartment) {
          apartmentId = apartment.id;
        }
      }

      // Create resident profile linked to user
      const resident = await tx.resident.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          identityCard: data.identityCard,
          apartmentId,
          relationshipToOwner: 'TENANT',
        },
      });

      return { user, resident };
    });
  }
}

export const authRepository = new AuthRepository();
