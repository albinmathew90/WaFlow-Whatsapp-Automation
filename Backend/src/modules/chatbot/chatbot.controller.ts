import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatbotService } from './services/chatbot.service';
import { RequireRole } from '../auth/decorators/auth.decorators';
import { ApiKeyRole } from '../auth/entities/api-key.entity';

@ApiTags('chatbot-widget')
@Controller('api/v1/chatbot/widget')
export class ChatbotPublicController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public endpoint for website widget to send messages' })
  async handleWidgetMessage(@Body() body: any) {
    if (!body.sessionId) {
      throw new NotFoundException('Session ID is required for the widget to connect.');
    }
    return this.chatbotService.handleWidgetMessage(body.sessionId, body);
  }
}

@ApiTags('chatbot')
@Controller('sessions/:sessionId/chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  // ─── Settings ─────────────────────────────────────────────────────────────
  @Get('settings')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Get chatbot settings for a session' })
  async getSettings(@Param('sessionId') sessionId: string) {
    return this.chatbotService.getSettings(sessionId);
  }

  @Post('settings')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Update chatbot settings' })
  async updateSettings(@Param('sessionId') sessionId: string, @Body() data: any) {
    return this.chatbotService.updateSettings(sessionId, data);
  }

  // ─── Leads ────────────────────────────────────────────────────────────────
  @Get('leads')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Get chatbot leads' })
  async getLeads(@Param('sessionId') sessionId: string) {
    return this.chatbotService.getLeads(sessionId);
  }

  @Post('leads/:leadId/reply')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Reply to a lead (human agent)' })
  async replyToLead(
    @Param('sessionId') sessionId: string,
    @Param('leadId') leadId: string,
    @Body('text') text: string,
  ) {
    return this.chatbotService.replyToLead(sessionId, leadId, text);
  }

  // ─── Knowledge Base ───────────────────────────────────────────────────────
  @Get('knowledge')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Get knowledge base items' })
  async getKnowledge(@Param('sessionId') sessionId: string) {
    return this.chatbotService.getKnowledge(sessionId);
  }

  @Post('knowledge')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Create a knowledge base item' })
  async createKnowledge(@Param('sessionId') sessionId: string, @Body() data: any) {
    return this.chatbotService.createKnowledge(sessionId, data);
  }

  @Put('knowledge/:id')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Update a knowledge base item' })
  async updateKnowledge(
    @Param('sessionId') sessionId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.chatbotService.updateKnowledge(sessionId, id, data);
  }

  @Delete('knowledge/:id')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Delete a knowledge base item' })
  async deleteKnowledge(@Param('sessionId') sessionId: string, @Param('id') id: string) {
    await this.chatbotService.deleteKnowledge(sessionId, id);
    return { success: true };
  }
}
