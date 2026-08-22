import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chatbot } from './entities/chatbot.entity';
import { ChatbotLead } from './entities/chatbot-lead.entity';
import { ChatbotKnowledge } from './entities/chatbot-knowledge.entity';
import { ChatbotController, ChatbotPublicController } from './chatbot.controller';
import { ChatbotService } from './services/chatbot.service';
import { KnowledgeEngineService } from './services/knowledge-engine.service';
import { CrmModule } from '../crm/crm.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chatbot, ChatbotLead, ChatbotKnowledge], 'data'),
    forwardRef(() => CrmModule),
    AuditModule,
  ],
  controllers: [ChatbotController, ChatbotPublicController],
  providers: [ChatbotService, KnowledgeEngineService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
