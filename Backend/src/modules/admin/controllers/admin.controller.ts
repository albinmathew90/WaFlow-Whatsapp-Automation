import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../../auth/decorators/auth.decorators';
import * as bcrypt from 'bcrypt';
import { MailService } from '../../crm/services/mail.service';

@Public()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  // Users
  @Get('users')
  getUsers() { return this.adminService.appUserRepo.find({ order: { createdAt: 'DESC' } }); }
  @Post('users')
  createUser(@Body() data: any) { return this.adminService.appUserRepo.save(data); }
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: any) { 
    await this.adminService.appUserRepo.update(id, data);
    return this.adminService.appUserRepo.findOneBy({ id: id as any }); // uuid so string is fine
  }
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) { return this.adminService.appUserRepo.delete(id); }

  // Blogs
  @Get('blogs')
  getBlogs() { return this.adminService.blogRepo.find({ order: { createdAt: 'DESC' } }); }
  @Post('blogs')
  createBlog(@Body() data: any) { return this.adminService.blogRepo.save(data); }
  @Put('blogs/:id')
  async updateBlog(@Param('id') id: string, @Body() data: any) { 
    await this.adminService.blogRepo.update(id, data);
    return this.adminService.blogRepo.findOneBy({ id: parseInt(id) });
  }
  @Delete('blogs/:id')
  deleteBlog(@Param('id') id: string) { return this.adminService.blogRepo.delete(id); }

  // Topics
  @Get('topics')
  getTopics() { return this.adminService.topicRepo.find({ order: { createdAt: 'DESC' } }); }
  @Post('topics')
  createTopic(@Body() data: any) { return this.adminService.topicRepo.save(data); }
  @Put('topics/:id')
  async updateTopic(@Param('id') id: string, @Body() data: any) { 
    await this.adminService.topicRepo.update(id, data);
    return this.adminService.topicRepo.findOneBy({ id: parseInt(id) });
  }
  @Delete('topics/:id')
  deleteTopic(@Param('id') id: string) { return this.adminService.topicRepo.delete(id); }

  // Media
  @Get('media')
  getMedia() { return this.adminService.mediaRepo.find({ order: { createdAt: 'DESC' } }); }
  @Post('media')
  createMedia(@Body() data: any) { return this.adminService.mediaRepo.save(data); }
  @Delete('media/:id')
  deleteMedia(@Param('id') id: string) { return this.adminService.mediaRepo.delete(id); }

  // SEO
  @Get('seo')
  getSeo() { return this.adminService.seoRepo.find({ order: { createdAt: 'DESC' } }); }
  @Post('seo')
  createSeo(@Body() data: any) { return this.adminService.seoRepo.save(data); }
  @Put('seo/:id')
  async updateSeo(@Param('id') id: string, @Body() data: any) { 
    await this.adminService.seoRepo.update(id, data);
    return this.adminService.seoRepo.findOneBy({ id: parseInt(id) });
  }
  @Delete('seo/:id')
  deleteSeo(@Param('id') id: string) { return this.adminService.seoRepo.delete(id); }

  // Settings
  @Get('settings')
  async getSettings() {
    let settings = await this.adminService.settingsRepo.find();
    if (settings.length === 0) {
      const newSettings = this.adminService.settingsRepo.create({});
      return this.adminService.settingsRepo.save(newSettings);
    }
    return settings[0];
  }

  @Put('settings')
  async updateSettings(@Body() data: any) {
    let settings = await this.adminService.settingsRepo.find();
    if (settings.length === 0) {
      const newSettings = this.adminService.settingsRepo.create(data);
      return this.adminService.settingsRepo.save(newSettings);
    }
    await this.adminService.settingsRepo.update(settings[0].id, data);
    return this.adminService.settingsRepo.findOneBy({ id: settings[0].id });
  }

  // Profile & Security
  @Get('profile')
  async getProfile() {
    let admins = await this.adminService.adminUserRepo.find();
    let admin = admins[0];
    if (!admin) {
      const hashed = await bcrypt.hash('Admin123!', 10);
      admin = this.adminService.adminUserRepo.create({
        email: 'admin@waflow.com',
        passwordHash: hashed,
        isTwoFactorEnabled: false
      });
      await this.adminService.adminUserRepo.save(admin);
    } else if (admin.passwordHash === 'dummyhash' || !admin.passwordHash.startsWith('$2')) {
      const hashed = await bcrypt.hash('Admin123!', 10);
      await this.adminService.adminUserRepo.update(admin.id, { passwordHash: hashed });
      admin.passwordHash = hashed;
    }
    return admin;
  }

  @Put('profile')
  async updateProfile(@Body() data: any) {
    const admin = await this.getProfile();
    await this.adminService.adminUserRepo.update(admin.id, { email: data.email });
    return this.adminService.adminUserRepo.findOneBy({ id: admin.id });
  }

  @Put('profile/password')
  async updatePassword(@Body() data: any) {
    const admin = await this.getProfile();
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, admin.passwordHash);
    
    if (!isCurrentPasswordValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    const newHashedPassword = await bcrypt.hash(data.newPassword, 10);
    await this.adminService.adminUserRepo.update(admin.id, { passwordHash: newHashedPassword });
    return { success: true };
  }

  @Post('auth/forgot-password')
  async forgotPassword() {
    const admin = await this.getProfile();
    if (!admin) return { success: false, message: 'Admin not found' };

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 15);

    await this.adminService.adminUserRepo.update(admin.id, { otpCode, otpExpiresAt });
    await this.mailService.sendPasswordResetEmail(admin.email, otpCode);

    return { success: true };
  }

  @Post('auth/verify-reset-otp')
  async verifyResetOtp(@Body() body: { code: string }) {
    const admin = await this.getProfile();
    if (!admin || admin.otpCode !== body.code || !admin.otpExpiresAt || admin.otpExpiresAt < new Date()) {
      return { success: false, message: 'Invalid or expired code' };
    }
    return { success: true };
  }

  @Post('auth/reset-password')
  async resetPassword(@Body() body: { code: string, newPassword: string }) {
    const admin = await this.getProfile();
    if (!admin || admin.otpCode !== body.code || !admin.otpExpiresAt || admin.otpExpiresAt < new Date()) {
      return { success: false, message: 'Invalid or expired code' };
    }

    const hashed = await bcrypt.hash(body.newPassword, 10);
    await this.adminService.adminUserRepo.update(admin.id, { 
      passwordHash: hashed,
      otpCode: null as any,
      otpExpiresAt: null as any
    });

    return { success: true };
  }

  @Post('auth/login')
  async login(@Body() body: any) {
    const admin = await this.getProfile(); // ensures it exists
    
    if (body.email !== admin.email) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    const isPasswordValid = await bcrypt.compare(body.password, admin.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (admin.isTwoFactorEnabled) {
      return { success: true, requires2FA: true };
    }

    const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: 'admin' });
    return { success: true, token };
  }

  @Post('auth/verify-2fa')
  async verify2FALogin(@Body() body: any) {
    const admin = await this.getProfile();
    
    if (body.email !== admin.email) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    const isPasswordValid = await bcrypt.compare(body.password, admin.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    const otplib = require('otplib');
    const isCodeValid = otplib.authenticator.verify({
      token: body.code,
      secret: admin.twoFactorSecret,
    });

    if (!isCodeValid) {
      return { success: false, message: 'Invalid 2FA code' };
    }

    const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: 'admin' });
    return { success: true, token };
  }

  @Post('auth/2fa/generate')
  async generateTwoFactorAuth() {
    const otplib = require('otplib');
    const qrcode = require('qrcode');
    const admin = await this.getProfile();
    
    const secret = otplib.authenticator.generateSecret();
    const otpauthUrl = otplib.authenticator.keyuri(admin.email, 'WAFLOW_Admin', secret);
    
    await this.adminService.adminUserRepo.update(admin.id, { twoFactorSecret: secret });
    
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return { qrCodeDataUrl, secret };
  }

  @Post('auth/2fa/turn-on')
  async turnOnTwoFactorAuth(@Body() body: { code: string }) {
    const otplib = require('otplib');
    const admin = await this.getProfile();
    
    if (!admin) {
      return { success: false, message: 'Admin not found' };
    }

    const isCodeValid = otplib.authenticator.verify({
      token: body.code,
      secret: admin.twoFactorSecret,
    });

    if (!isCodeValid) {
      return { success: false, message: 'Wrong authentication code' };
    }

    await this.adminService.adminUserRepo.update(admin.id, { isTwoFactorEnabled: true });
    return { success: true };
  }

  @Post('auth/2fa/turn-off')
  async turnOffTwoFactorAuth(@Body() body: { code: string }) {
    const otplib = require('otplib');
    const admin = await this.getProfile();
    
    if (!admin) {
      return { success: false, message: 'Admin not found' };
    }

    const isCodeValid = otplib.authenticator.verify({
      token: body.code,
      secret: admin.twoFactorSecret,
    });

    if (!isCodeValid) {
      return { success: false, message: 'Wrong authentication code' };
    }

    await this.adminService.adminUserRepo.update(admin.id, { isTwoFactorEnabled: false, twoFactorSecret: null as any });
    return { success: true };
  }
}