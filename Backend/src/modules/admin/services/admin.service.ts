import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../entities/admin-user.entity';
import { AdminBlog } from '../entities/admin-blog.entity';
import { AdminBlogTopic } from '../entities/admin-blog-topic.entity';
import { AdminMedia } from '../entities/admin-media.entity';
import { AdminSeo } from '../entities/admin-seo.entity';
import { AdminSettings } from '../entities/admin-settings.entity';
import { AdminVisitor } from '../entities/admin-visitor.entity';
import { User } from '../../crm/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminUser, 'data') public adminUserRepo: Repository<AdminUser>,
    @InjectRepository(User, 'data') public appUserRepo: Repository<User>,
    @InjectRepository(AdminBlog, 'data') public blogRepo: Repository<AdminBlog>,
    @InjectRepository(AdminBlogTopic, 'data') public topicRepo: Repository<AdminBlogTopic>,
    @InjectRepository(AdminMedia, 'data') public mediaRepo: Repository<AdminMedia>,
    @InjectRepository(AdminSeo, 'data') public seoRepo: Repository<AdminSeo>,
    @InjectRepository(AdminSettings, 'data') public settingsRepo: Repository<AdminSettings>,
    @InjectRepository(AdminVisitor, 'data') public visitorRepo: Repository<AdminVisitor>,
  ) {}
}