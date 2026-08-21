import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ParseArrayPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/auth.decorators';
import { CrmTemplatesService } from '../services/crm-templates.service';
import { CreateCrmTemplateDto } from '../dto/crm.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('crm-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/templates')
export class CrmTemplatesController {
  constructor(private readonly crmTemplatesService: CrmTemplatesService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCrmTemplateDto) {
    return this.crmTemplatesService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.crmTemplatesService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.crmTemplatesService.findOne(req.user.id, id);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: CreateCrmTemplateDto) {
    return this.crmTemplatesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.crmTemplatesService.remove(req.user.id, id);
  }

  @Post('bulk')
  async createBulk(
    @Req() req: any, 
    @Body(new ParseArrayPipe({ items: CreateCrmTemplateDto })) dtos: CreateCrmTemplateDto[]
  ) {
    return this.crmTemplatesService.bulkCreate(req.user.id, dtos);
  }
}
