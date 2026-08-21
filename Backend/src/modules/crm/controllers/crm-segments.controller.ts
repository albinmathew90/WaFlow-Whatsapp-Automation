import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/auth.decorators';
import { CrmSegmentsService } from '../services/crm-segments.service';
import { CreateCrmSegmentDto } from '../dto/crm.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('crm-segments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/segments')
export class CrmSegmentsController {
  constructor(private readonly segmentsService: CrmSegmentsService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCrmSegmentDto) {
    return this.segmentsService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.segmentsService.findAll(req.user.id);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.segmentsService.remove(req.user.id, id);
  }
}
