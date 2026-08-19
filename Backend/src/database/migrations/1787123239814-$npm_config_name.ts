import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1787123239814 implements MigrationInterface {
    name = ' $npmConfigName1787123239814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chatbots" ("id" varchar PRIMARY KEY NOT NULL, "session_id" varchar NOT NULL, "enabled" boolean NOT NULL DEFAULT (0), "welcome_message" varchar NOT NULL DEFAULT ('Hello! Welcome. How can I help you today? 👋'), "fallback_message" varchar NOT NULL DEFAULT ('Sorry, I didn't understand that. Please try again or type 'help'.'), "offline_message" varchar NOT NULL DEFAULT ('We're currently offline. Please leave a message and we'll get back to you.'), "bot_name" varchar NOT NULL DEFAULT ('Blastup Bot'), "bot_icon" varchar NOT NULL DEFAULT ('bot'), "header_text" varchar NOT NULL DEFAULT ('Chat with us'), "sub_header_text" varchar NOT NULL DEFAULT ('We typically reply within minutes'), "button_label" varchar NOT NULL DEFAULT ('Chat'), "primary_color" varchar NOT NULL DEFAULT ('#25D366'), "secondary_color" varchar NOT NULL DEFAULT ('#128C7E'), "gradient" boolean NOT NULL DEFAULT (1), "gradient_angle" integer NOT NULL DEFAULT (135), "position" varchar NOT NULL DEFAULT ('bottom-right'), "theme" varchar NOT NULL DEFAULT ('glassmorphic'), "rules" text NOT NULL DEFAULT (), "collect_leads" boolean NOT NULL DEFAULT (0), "lead_fields" text NOT NULL DEFAULT (name,email), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "IDX_a998d4f16199b387b3f0764fbc" ON "chatbots" ("session_id") `);
        await queryRunner.query(`CREATE TABLE "chatbot_leads" ("id" varchar PRIMARY KEY NOT NULL, "session_id" varchar NOT NULL, "visitor_session_id" varchar NOT NULL, "domain" varchar NOT NULL DEFAULT (''), "page_url" varchar NOT NULL DEFAULT (''), "captured_data" text NOT NULL DEFAULT ([object Object]), "messages" text NOT NULL DEFAULT (), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "IDX_7b8bbe854b532801180d20e1b5" ON "chatbot_leads" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8076e493a388b7ecae3324d5a3" ON "chatbot_leads" ("visitor_session_id") `);
        await queryRunner.query(`CREATE TABLE "chatbot_knowledge" ("id" varchar PRIMARY KEY NOT NULL, "session_id" varchar NOT NULL, "title" varchar NOT NULL, "category" varchar NOT NULL DEFAULT ('Other'), "content" text NOT NULL, "keywords" text NOT NULL DEFAULT (), "synonyms" text NOT NULL DEFAULT (), "priority" integer NOT NULL DEFAULT (5), "status" varchar NOT NULL DEFAULT ('active'), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "IDX_123a81bba55fff86c1cadf67d7" ON "chatbot_knowledge" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ad1a4f50052bd9d1e882ae0b29" ON "chatbot_knowledge" ("session_id", "status", "priority") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_ad1a4f50052bd9d1e882ae0b29"`);
        await queryRunner.query(`DROP INDEX "IDX_123a81bba55fff86c1cadf67d7"`);
        await queryRunner.query(`DROP TABLE "chatbot_knowledge"`);
        await queryRunner.query(`DROP INDEX "IDX_8076e493a388b7ecae3324d5a3"`);
        await queryRunner.query(`DROP INDEX "IDX_7b8bbe854b532801180d20e1b5"`);
        await queryRunner.query(`DROP TABLE "chatbot_leads"`);
        await queryRunner.query(`DROP INDEX "IDX_a998d4f16199b387b3f0764fbc"`);
        await queryRunner.query(`DROP TABLE "chatbots"`);
    }

}
