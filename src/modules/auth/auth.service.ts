import bcrypt from 'bcryptjs';
import { authRepository } from './auth.repository';
import { RegisterInput } from './auth.schema';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('Email này đã được đăng ký tài khoản');
    }

    const existingIdentity = await authRepository.findUserByIdentityCard(data.identityCard);
    if (existingIdentity) {
      throw new Error('Số CCCD/CMND này đã được đăng ký');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await authRepository.createUserWithResidentProfile(data, passwordHash);

    return {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
    };
  }
}

export const authService = new AuthService();
