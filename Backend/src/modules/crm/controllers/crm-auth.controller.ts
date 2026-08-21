import { Controller, Post, Body, Get, UseGuards, Req, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/auth.decorators';
import { CrmAuthService } from '../services/crm-auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from '../dto/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('crm-auth')
@Controller('crm/auth')
export class CrmAuthController {
  constructor(private readonly crmAuthService: CrmAuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.crmAuthService.register(dto);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.crmAuthService.login(dto);
  }

  @Public()
  @Post('google')
  async googleLogin(@Body() profile: { email: string; name: string; avatar?: string }) {
    return this.crmAuthService.googleLogin(profile);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.crmAuthService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    return this.crmAuthService.resetPassword(body.email, body.code, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    const { password, ...userWithoutPassword } = req.user;
    return {
      ...userWithoutPassword,
      hasPassword: !!password,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  async updateProfile(@Req() req: any, @Body() body: { name?: string; avatar?: string }) {
    return this.crmAuthService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.crmAuthService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(@Req() req: any) {
    return this.crmAuthService.deleteAccount(req.user.id);
  }
}
