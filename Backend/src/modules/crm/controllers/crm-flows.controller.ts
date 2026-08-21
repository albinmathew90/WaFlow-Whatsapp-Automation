import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req, NotFoundException, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/auth.decorators';
import { CrmFlowsService, CreateFlowDto } from '../services/crm-flows.service';
import { FlowRunnerService } from '../services/flow-runner.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('crm-flows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/flows')
export class CrmFlowsController {
  constructor(
    private readonly crmFlowsService: CrmFlowsService,
    private readonly flowRunnerService: FlowRunnerService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateFlowDto) {
    return this.crmFlowsService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.crmFlowsService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const flow = await this.crmFlowsService.findOne(req.user.id, id);
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: CreateFlowDto) {
    const flow = await this.crmFlowsService.update(req.user.id, id, dto);
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.crmFlowsService.remove(req.user.id, id);
    return { success: true };
  }

  @Post(':id/enable')
  async enable(@Req() req: any, @Param('id') id: string) {
    const flow = await this.crmFlowsService.setEnabled(req.user.id, id, true);
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  @Post(':id/disable')
  async disable(@Req() req: any, @Param('id') id: string) {
    const flow = await this.crmFlowsService.setEnabled(req.user.id, id, false);
    if (!flow) throw new NotFoundException('Flow not found');
    return flow;
  }

  // --- Webhook Endpoints ---

  @Public()
  @HttpCode(200)
  @Post('webhooks/:accountId/:token')
  async handleWebhook(
    @Param('accountId') accountId: string,
    @Param('token') token: string,
    @Body() payload: any
  ) {
    const isValid = await this.crmFlowsService.validateWebhookToken(accountId, token);
    if (!isValid) return { success: true };

    const eventName = payload.event;
    if (!eventName) return { success: true };

    const flows = await this.crmFlowsService.findAllEnabled(accountId);
    const matchingFlows = flows.filter(f => 
      f.trigger?.event === 'webhook' && 
      f.trigger?.triggerEventNames?.includes(eventName)
    );
    
    for (const flow of matchingFlows) {
      this.flowRunnerService.handleWebhook(flow.id, accountId, payload).catch(console.error);
    }
    
    return { success: true };
  }

  @Post(':id/webhook/test')
  async testWebhook(@Req() req: any, @Param('id') id: string, @Body() body: { event: string, sample_payload: any }) {
    return this.crmFlowsService.testWebhook(req.user.id, id, body.event, body.sample_payload);
  }

  @Patch(':id/trigger')
  async saveTrigger(@Req() req: any, @Param('id') id: string, @Body() body: { trigger_type: string, trigger_event_names: string[] }) {
    return this.crmFlowsService.updateTrigger(req.user.id, id, body.trigger_type, body.trigger_event_names);
  }

  @Get(':id/trigger')
  async getTrigger(@Req() req: any, @Param('id') id: string) {
    const trigger = await this.crmFlowsService.getTrigger(req.user.id, id);
    if (!trigger) throw new NotFoundException('Flow not found');
    return trigger;
  }

  @Post(':id/webhook/regenerate')
  async regenerateWebhookUrl(@Req() req: any, @Param('id') id: string) {
    return this.crmFlowsService.regenerateWebhookToken(req.user.id, id);
  }
}
