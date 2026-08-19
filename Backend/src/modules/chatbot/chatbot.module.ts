import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chatbot } from './entities/chatbot.entity';
import { ChatbotLead } from './entities/chatbot-lead.entity';
import { ChatbotKnowledge } from './entities/chatbot-knowledge.entity';
import { ChatbotController, ChatbotPublicController } from './chatbot.controller';
import { ChatbotService } from './services/chatbot.service';
import { KnowledgeEngineService } from './services/knowledge-engine.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chatbot, ChatbotLead, ChatbotKnowledge], 'data'),
    EventsModule,
  ],
  controllers: [ChatbotController, ChatbotPublicController],
  providers: [ChatbotService, KnowledgeEngineService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
