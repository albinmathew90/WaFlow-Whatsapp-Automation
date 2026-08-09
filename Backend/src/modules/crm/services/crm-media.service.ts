import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmMedia } from '../entities/crm-media.entity';
import { StorageService } from '../../../common/storage/storage.service';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class CrmMediaService {
  constructor(
    @InjectRepository(CrmMedia, 'data')
    private readonly mediaRepository: Repository<CrmMedia>,
    private readonly storageService: StorageService,
  ) {}

  async uploadFile(userId: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }): Promise<CrmMedia> {
    const sizeBytes = file.size || (file.buffer ? file.buffer.length : 0);
    const originalName = file.originalname || 'media';

    // Prevent duplicate uploads of the same file
    const existingMedia = await this.mediaRepository.findOne({
      where: {
        userId,
        originalName,
        sizeBytes,
      },
    });

    if (existingMedia) {
      throw new ConflictException('This file already exists in your media library.');
    }

    const ext = path.extname(file.originalname || '') || '';
    const randomHash = crypto.randomBytes(8).toString('hex');
    const safeBase = path.basename(file.originalname || 'file', ext).toLowerCase().replace(/[^a-z0-9-_]/g, '_').slice(0, 50) || 'media';
    const filename = `crm_${safeBase}_${randomHash}${ext}`;

    await this.storageService.putFile(filename, file.buffer);

    const media = this.mediaRepository.create({
      userId,
      filename,
      originalName: file.originalname || filename,
      mimetype: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size || (file.buffer ? file.buffer.length : 0),
    });

    return this.mediaRepository.save(media);
  }

  async findAll(userId: string): Promise<CrmMedia[]> {
    return this.mediaRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<CrmMedia | null> {
    return this.mediaRepository.findOne({ where: { id, userId } });
  }

  async deleteFile(userId: string, id: string): Promise<void> {
    const media = await this.findOne(userId, id);
    if (!media) {
      throw new NotFoundException('Media file not found');
    }
    try {
      await this.storageService.deleteFile(media.filename);
    } catch {
      // ignore storage deletion errors
    }
    await this.mediaRepository.delete({ id: media.id });
  }

  async getFileBufferAndMime(filename: string): Promise<{ buffer: Buffer; mimetype: string }> {
    const media = await this.mediaRepository.findOne({ where: { filename } });
    const mimetype = media ? media.mimetype : 'application/octet-stream';
    const buffer = await this.storageService.getFile(filename);
    return { buffer, mimetype };
  }
}
