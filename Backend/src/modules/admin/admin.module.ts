import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { AdminBlog } from './entities/admin-blog.entity';
import { AdminBlogTopic } from './entities/admin-blog-topic.entity';
import { AdminMedia } from './entities/admin-media.entity';
import { AdminSeo } from './entities/admin-seo.entity';
import { AdminSettings } from './entities/admin-settings.entity';
import { User } from '../crm/entities/user.entity';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { JwtModule } from '@nestjs/jwt';
import { CrmModule } from '../crm/crm.module';

@Module({
  imports: [
    CrmModule,
    TypeOrmModule.forFeature([AdminUser, AdminBlog, AdminBlogTopic, AdminMedia, AdminSeo, AdminSettings, User], 'data'),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_for_crm_openwa',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}