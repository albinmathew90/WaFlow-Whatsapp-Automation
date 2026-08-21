import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/auth.decorators';
import { CrmTagsService } from '../services/crm-tags.service';
import { CreateCrmTagDto } from '../dto/crm.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('crm-tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/tags')
export class CrmTagsController {
  constructor(private readonly tagsService: CrmTagsService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCrmTagDto) {
    return this.tagsService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.tagsService.findAll(req.user.id);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.tagsService.remove(req.user.id, id);
  }
}
