import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { MailService } from './mail.service';

@Injectable()
export class CrmAuthService {
  constructor(
    @InjectRepository(User, 'data')
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: any }> {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);
    const user = this.usersRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });
    
    await this.usersRepository.save(user);

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async googleLogin(profile: { email: string; name: string; avatar?: string }): Promise<{ accessToken: string; user: any }> {
    let user = await this.usersRepository.findOne({ where: { email: profile.email } });
    
    if (!user) {
      // Auto-register google users (no password)
      user = this.usersRepository.create({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
      });
      await this.usersRepository.save(user);
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { message: 'If an account exists, a reset code was sent.' };
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordToken = code;
    // Expires in 15 minutes
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    
    await this.usersRepository.save(user);
    
    // Send email asynchronously
    this.mailService.sendPasswordResetEmail(user.email, code).catch(err => {
      console.error('Failed to send reset email', err);
    });

    return { message: 'If an account exists, a reset code was sent.' };
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    if (user.resetPasswordToken !== code) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await this.usersRepository.save(user);

    return { message: 'Password has been reset successfully' };
  }



  async updateProfile(userId: string, data: { name?: string; avatar?: string }): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    
    if (data.name !== undefined) user.name = data.name;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    
    await this.usersRepository.save(user);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    };
  }

  async changePassword(userId: string, currentPassword: string | undefined, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.password) {
      if (!currentPassword) {
        throw new UnauthorizedException('Current password is required');
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    return { message: 'Password has been changed successfully' };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.usersRepository.remove(user);
    return { message: 'Account has been deleted successfully' };
  }
}
