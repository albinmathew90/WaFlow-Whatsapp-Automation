import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ParseArrayPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/auth.decorators';
import { CrmContactsService } from '../services/crm-contacts.service';
import { CreateCrmContactDto, UpdateCrmContactDto } from '../dto/crm.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('crm-contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/contacts')
export class CrmContactsController {
  constructor(private readonly crmContactsService: CrmContactsService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCrmContactDto) {
    return this.crmContactsService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.crmContactsService.findAll(req.user.id);
  }

  @Post('bulk')
  async createBulk(
    @Req() req: any, 
    @Body(new ParseArrayPipe({ items: CreateCrmContactDto })) dtos: CreateCrmContactDto[]
  ) {
    return this.crmContactsService.bulkCreate(req.user.id, dtos);
  }

  @Delete('bulk')
  async removeBulk(@Req() req: any, @Body() body: { ids: string[] }) {
    return this.crmContactsService.bulkRemove(req.user.id, body.ids);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCrmContactDto) {
    return this.crmContactsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.crmContactsService.remove(req.user.id, id);
  }

  @Get('columns')
  async getColumns(@Req() req: any) {
    return this.crmContactsService.getColumns(req.user.id);
  }
}
