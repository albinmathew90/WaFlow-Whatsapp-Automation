import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, NotFoundException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatbotService } from './services/chatbot.service';
import { RequireRole, Public } from '../auth/decorators/auth.decorators';
import { ApiKeyRole } from '../auth/entities/api-key.entity';

@ApiTags('chatbot-widget')
@Controller('v1/chatbot/widget')
export class ChatbotPublicController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public endpoint for website widget to send messages' })
  async handleWidgetMessage(@Body() body: any) {
    if (!body.chatbotId) {
      throw new NotFoundException('Chatbot ID is required for the widget to connect.');
    }
    return this.chatbotService.handleWidgetMessage(body.chatbotId, body);
  }
}

import { JwtAuthGuard } from '../crm/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('crm-chatbot')
@Controller('crm/chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  // ─── Settings ─────────────────────────────────────────────────────────────
  @Get('settings')
  @ApiOperation({ summary: 'Get chatbot settings for a user session' })
  async getSettings(@Req() req: any) {
    return this.chatbotService.getSettings(req.user.id);
  }

  @Post('settings')
  @ApiOperation({ summary: 'Update chatbot settings' })
  async updateSettings(@Req() req: any, @Body() data: any) {
    return this.chatbotService.updateSettings(req.user.id, data);
  }

  // ─── Leads ────────────────────────────────────────────────────────────────
  @Get('leads')
  @ApiOperation({ summary: 'Get chatbot leads' })
  async getLeads(@Req() req: any) {
    console.log('User in getLeads:', req.user);
    return this.chatbotService.getLeads(req.user.id);
  }

  @Post('leads/:leadId/reply')
  @ApiOperation({ summary: 'Reply to a lead (human agent)' })
  async replyToLead(
    @Req() req: any,
    @Param('leadId') leadId: string,
    @Body('text') text: string,
  ) {
    return this.chatbotService.replyToLead(req.user.id, leadId, text);
  }

  @Delete('leads/:leadId')
  @ApiOperation({ summary: 'Delete a chatbot lead' })
  async deleteLead(@Req() req: any, @Param('leadId') leadId: string) {
    return this.chatbotService.deleteLead(req.user.id, leadId);
  }

  // ─── Knowledge Base ───────────────────────────────────────────────────────
  @Get('knowledge')
  @ApiOperation({ summary: 'Get knowledge base items' })
  async getKnowledge(@Req() req: any) {
    return this.chatbotService.getKnowledge(req.user.id);
  }

  @Post('knowledge')
  @ApiOperation({ summary: 'Create a knowledge base item' })
  async createKnowledge(@Req() req: any, @Body() data: any) {
    return this.chatbotService.createKnowledge(req.user.id, data);
  }

  @Put('knowledge/:id')
  @ApiOperation({ summary: 'Update a knowledge base item' })
  async updateKnowledge(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.chatbotService.updateKnowledge(req.user.id, id, data);
  }

  @Delete('knowledge/:id')
  @ApiOperation({ summary: 'Delete a knowledge base item' })
  async deleteKnowledge(@Req() req: any, @Param('id') id: string) {
    await this.chatbotService.deleteKnowledge(req.user.id, id);
    return { success: true };
  }
}
