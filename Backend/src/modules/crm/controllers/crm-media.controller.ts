import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../auth/decorators/auth.decorators';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CrmMediaService } from '../services/crm-media.service';
import type { Response } from 'express';

@Public()
@ApiTags('crm-media')
@Controller('crm/media')
export class CrmMediaController {
  constructor(private readonly crmMediaService: CrmMediaService) {}

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 300 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a media file to the CRM Media Library' })
  async upload(@Req() req: any, @UploadedFile() file: any) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    return this.crmMediaService.uploadFile(req.user.id, file);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all media files in the library for current user' })
  async findAll(@Req() req: any) {
    return this.crmMediaService.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a media file from the library' })
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.crmMediaService.deleteFile(req.user.id, id);
    return { success: true };
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Public endpoint to stream media file by filename' })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const { buffer, mimetype } = await this.crmMediaService.getFileBufferAndMime(filename);
      res.setHeader('Content-Type', mimetype);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch {
      throw new NotFoundException('File not found');
    }
  }
}
