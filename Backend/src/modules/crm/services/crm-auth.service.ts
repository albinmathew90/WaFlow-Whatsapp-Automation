import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
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

  async requestSignupOtp(dto: any): Promise<{ message: string }> {
    const existingPhone = await this.usersRepository.findOne({ where: { phoneNumber: dto.phoneNumber, isVerified: true } });
    if (existingPhone && existingPhone.email !== dto.email) {
      throw new ConflictException('This WhatsApp number is already registered to another account.');
    }

    let user = await this.usersRepository.findOne({ where: { email: dto.email } });
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    if (user) {
      if (user.isVerified) {
        throw new ConflictException('Account already exists and is verified.');
      }
      user.phoneNumber = dto.phoneNumber;
      user.phoneVerificationExpires = expiresAt;
      
      if (dto.password) {
        const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
        user.password = await bcrypt.hash(dto.password, saltRounds);
      }
      user.name = dto.name;
      
      await this.usersRepository.save(user);
    } else {
      let hashedPassword = '';
      if (dto.password) {
        const saltRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
        hashedPassword = await bcrypt.hash(dto.password, saltRounds);
      }
      user = this.usersRepository.create({
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        phoneVerificationExpires: expiresAt,
        isVerified: false,
      });
      await this.usersRepository.save(user);
    }

    // Send OTP via internal WaFlow OTP engine using provided credentials
    try {
      const appId = process.env.INTERNAL_OTP_APP_ID;
      const apiKey = process.env.INTERNAL_OTP_SECRET_KEY;
      const port = process.env.PORT || 2785;
      
      if (appId && apiKey) {
        const res = await fetch(`http://localhost:${port}/api/otp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            applicationId: appId,
            phone: dto.phoneNumber
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('OTP Engine rejected request:', res.status, errText);
          throw new BadRequestException('Failed to send OTP');
        }

        const data = await res.json();
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 10);

        user.phoneVerificationCode = data.requestId;
        user.phoneVerificationExpires = expires;
        await this.usersRepository.save(user);

      } else {
        console.warn('INTERNAL_OTP_APP_ID or INTERNAL_OTP_SECRET_KEY is missing. Cannot send WhatsApp OTP.');
      }
    } catch (err) {
      console.error('Failed to send OTP via WaFlow API:', err);
      throw new BadRequestException('Could not send OTP');
    }

    return { message: 'OTP sent to WhatsApp' };
  }

  async verifySignupOtp(phone: string, otp: string): Promise<{ accessToken: string; user: any }> {
    const user = await this.usersRepository.findOne({ where: { phoneNumber: phone, isVerified: false } });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (!user.phoneVerificationExpires || user.phoneVerificationExpires < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    try {
      const appId = process.env.INTERNAL_OTP_APP_ID;
      const apiKey = process.env.INTERNAL_OTP_SECRET_KEY;
      const port = process.env.PORT || 2785;
      
      if (appId && apiKey && user.phoneVerificationCode) {
        const res = await fetch(`http://localhost:${port}/api/otp/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            applicationId: appId,
            phone: phone,
            requestId: user.phoneVerificationCode,
            otp: otp
          }),
        });
        
        if (!res.ok) {
          throw new UnauthorizedException('Invalid OTP');
        }
      } else {
        // Fallback for missing keys (should not happen in prod)
        throw new UnauthorizedException('OTP Verification engine not configured');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid OTP');
    }

    user.isVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;

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

  async requestPhoneChangeOtp(userId: string, newPhoneNumber: string): Promise<{ message: string }> {
    const existingPhone = await this.usersRepository.findOne({ where: { phoneNumber: newPhoneNumber, isVerified: true } });
    if (existingPhone && existingPhone.id !== userId) {
      throw new ConflictException('This WhatsApp number is already registered to another account.');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      const appId = process.env.INTERNAL_OTP_APP_ID;
      const apiKey = process.env.INTERNAL_OTP_SECRET_KEY;
      const port = process.env.PORT || 2785;
      
      if (appId && apiKey) {
        const res = await fetch(`http://localhost:${port}/api/otp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            applicationId: appId,
            phone: newPhoneNumber
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('OTP Engine rejected request:', res.status, errText);
          throw new BadRequestException('Failed to send OTP');
        }

        const data = await res.json();
        
        user.phoneVerificationCode = data.requestId;
        user.phoneVerificationExpires = expiresAt;
        await this.usersRepository.save(user);

      } else {
        console.warn('INTERNAL_OTP_APP_ID or INTERNAL_OTP_SECRET_KEY is missing. Cannot send WhatsApp OTP.');
      }
    } catch (err) {
      console.error('Failed to send OTP via WaFlow API:', err);
      throw new BadRequestException('Could not send OTP');
    }

    return { message: 'OTP sent to new WhatsApp number' };
  }

  async verifyPhoneChangeOtp(userId: string, newPhoneNumber: string, otp: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.phoneVerificationExpires || user.phoneVerificationExpires < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    try {
      const appId = process.env.INTERNAL_OTP_APP_ID;
      const apiKey = process.env.INTERNAL_OTP_SECRET_KEY;
      const port = process.env.PORT || 2785;
      
      if (appId && apiKey && user.phoneVerificationCode) {
        const res = await fetch(`http://localhost:${port}/api/otp/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            applicationId: appId,
            phone: newPhoneNumber,
            requestId: user.phoneVerificationCode,
            otp: otp
          }),
        });
        
        if (!res.ok) {
          throw new UnauthorizedException('Invalid OTP');
        }
      } else {
        throw new UnauthorizedException('OTP Verification engine not configured');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid OTP');
    }

    user.phoneNumber = newPhoneNumber;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpires = undefined;

    await this.usersRepository.save(user);

    return { message: 'Phone number updated successfully' };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isVerified === false) {
      throw new UnauthorizedException('Account is not verified. Please sign up again to verify your phone number.');
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

  async googleLogin(profile: { email: string; name: string; avatar?: string }): Promise<any> {
    let user = await this.usersRepository.findOne({ where: { email: profile.email } });
    
    if (!user) {
      // Create unverified user if they don't exist
      user = this.usersRepository.create({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        isVerified: false,
      });
      await this.usersRepository.save(user);
    }

    if (!user.isVerified || !user.phoneNumber) {
      // Stop the login flow and ask for phone verification
      return { 
        requiresPhoneVerification: true, 
        email: user.email, 
        name: user.name 
      };
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
