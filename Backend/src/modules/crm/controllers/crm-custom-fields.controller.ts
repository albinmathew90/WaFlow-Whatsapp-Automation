import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/auth.decorators';
import { CrmCustomFieldsService } from '../services/crm-custom-fields.service';
import { CreateCrmCustomFieldDto, UpdateCrmCustomFieldDto } from '../dto/crm.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('crm-custom-fields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/custom-fields')
export class CrmCustomFieldsController {
  constructor(private readonly customFieldsService: CrmCustomFieldsService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCrmCustomFieldDto) {
    return this.customFieldsService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.customFieldsService.findAll(req.user.id);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCrmCustomFieldDto) {
    return this.customFieldsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.customFieldsService.remove(req.user.id, id);
  }
}
