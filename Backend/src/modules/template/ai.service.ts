import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  constructor(private configService: ConfigService) {}

  async generateTemplate(prompt: string, assistant: string): Promise<any> {
    // Fallback to reading .env directly if process wasn't restarted
    let groqKey = this.configService.get<string>('GROQ_API_KEY');

    if (!groqKey) {
       try {
         const fs = require('fs');
         const path = require('path');
         const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
         const env = require('dotenv').parse(envContent);
         groqKey = groqKey || env.GROQ_API_KEY;
       } catch (e) {
         console.error('Failed to parse .env directly', e);
       }
    }

    const systemPrompt = `You are a professional WhatsApp marketing template generator. 
Your job is to generate a high-converting message template based on the user's prompt.
You must return a JSON object with exactly the following structure:
{
  "header": "Short catchy header (optional, up to 60 chars)",
  "body": "The main message body text",
  "footer": "Short footer text (optional, up to 60 chars)"
}

IMPORTANT RULES:
- Write the body as clean, natural plain text. Do NOT add any placeholders or variables by default.
- ONLY add placeholders like {{1}}, {{2}}, {{3}} if the user's prompt explicitly asks for a variable, dynamic field, or personalisation (e.g. "add the customer name", "include an expiry date", "personalise with their order number"). In that case replace only the specific mentioned fields with {{1}}, {{2}}, etc. in the order they appear.
- Never invent variables the user did not ask for.
Return ONLY valid JSON. Do not include markdown code blocks.`;

    try {
      if (assistant === 'groq') {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
          })
        });
        const data = await response.json();
        if (!response.ok) {
           console.error('Groq API Error:', data);
           throw new Error(data.error?.message || 'Groq API error');
        }
        return JSON.parse(data.choices[0].message.content);
      } 
      
      throw new Error('Unsupported AI assistant');
    } catch (error: any) {
      console.error('AI Generation Error:', error.message || error);
      throw new InternalServerErrorException(error.message || 'Failed to generate template from AI provider.');
    }
  }
}
