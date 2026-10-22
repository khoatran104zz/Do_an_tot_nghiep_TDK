import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimiter } from '@/lib/rate-limiter';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // Rate limiting: max 5 login attempts per minute per email
        const rateLimitResult = rateLimiter.check(`login:${normalizedEmail}`, 5, 60 * 1000);
        if (!rateLimitResult.allowed) {
          throw new Error('Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 1 phút.');
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            tenant: {
              select: { id: true, name: true, code: true, status: true },
            },
            residentProfile: {
              include: {
                occupancies: {
                  where: { isLivingHere: true },
                  take: 1,
                },
                ownedApartments: {
                  where: { isCurrent: true },
                  take: 1,
                },
              },
            },
          },
        });

        if (!user || !user.isActive) {
          throw new Error('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa');
        }

        // If user belongs to a suspended/inactive tenant, prevent login
        if (user.tenant && user.tenant.status !== 'ACTIVE') {
          throw new Error('Tổ hợp chung cư của bạn đang tạm ngừng hoạt động. Vui lòng liên hệ hỗ trợ K-Home.');
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordMatch) {
          throw new Error('Mật khẩu không chính xác');
        }

        let assignedBuildingIds: string[] = [];
        if (user.role === 'MANAGER') {
          const managed = await prisma.managerBuilding.findMany({
            where: { managerId: user.id },
            select: { buildingId: true },
          });
          assignedBuildingIds = managed.map((m) => m.buildingId);
        }

        const activeApartmentId =
          user.residentProfile?.occupancies?.[0]?.apartmentId ||
          user.residentProfile?.ownedApartments?.[0]?.apartmentId ||
          null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          tenantId: user.tenantId || null,
          tenantName: user.tenant?.name || null,
          tenantCode: user.tenant?.code || null,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          residentId: user.residentProfile?.id || null,
          apartmentId: activeApartmentId,
          assignedBuildingIds,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId || null;
        token.tenantName = (user as any).tenantName || null;
        token.tenantCode = (user as any).tenantCode || null;
        token.phone = (user as any).phone;
        token.avatarUrl = (user as any).avatarUrl;
        token.residentId = (user as any).residentId;
        token.apartmentId = (user as any).apartmentId;
        token.assignedBuildingIds = (user as any).assignedBuildingIds || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.tenantId = (token.tenantId as string | null) || null;
        session.user.tenantName = (token.tenantName as string | null) || null;
        session.user.tenantCode = (token.tenantCode as string | null) || null;
        session.user.phone = token.phone as string | undefined;
        session.user.avatarUrl = token.avatarUrl as string | undefined;
        session.user.residentId = token.residentId as string | null | undefined;
        session.user.apartmentId = token.apartmentId as string | null | undefined;
        session.user.assignedBuildingIds = (token.assignedBuildingIds as string[]) || [];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
