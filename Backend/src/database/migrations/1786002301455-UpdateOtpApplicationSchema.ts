import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1786002301455 implements MigrationInterface {
    name = ' $npmConfigName1786002301455'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "application_whatsapp_sessions" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "sessionId" varchar NOT NULL, "phoneNumber" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), "status" varchar(20) NOT NULL DEFAULT ('active'))`);
        await queryRunner.query(`CREATE TABLE "temporary_otp_applications" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "otpLength" integer NOT NULL DEFAULT (4), "expiryMinutes" integer NOT NULL DEFAULT (10), "maxAttempts" integer NOT NULL DEFAULT (3), "cooldownSeconds" integer NOT NULL DEFAULT (60), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_eae5a1fe954f34e1501f5c59e6d" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_otp_applications"("id", "userId", "name", "otpLength", "expiryMinutes", "maxAttempts", "cooldownSeconds", "createdAt", "updatedAt") SELECT "id", "userId", "name", "otpLength", "expiryMinutes", "maxAttempts", "cooldownSeconds", "createdAt", "updatedAt" FROM "otp_applications"`);
        await queryRunner.query(`DROP TABLE "otp_applications"`);
        await queryRunner.query(`ALTER TABLE "temporary_otp_applications" RENAME TO "otp_applications"`);
        await queryRunner.query(`CREATE TABLE "temporary_otp_applications" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "otpLength" integer NOT NULL DEFAULT (4), "expiryMinutes" integer NOT NULL DEFAULT (10), "maxAttempts" integer NOT NULL DEFAULT (3), "cooldownSeconds" integer NOT NULL DEFAULT (60), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "applicationId" varchar NOT NULL, "company" varchar(100) NOT NULL, "domain" varchar(255) NOT NULL, "description" text, "logo" varchar, "defaultWhatsappSessionId" varchar, "apiKeyHash" varchar(64), "secretKeyHash" varchar(64), "webhookSecret" varchar(64), "status" varchar(20) NOT NULL DEFAULT ('active'), "environment" varchar(20) NOT NULL DEFAULT ('development'), "maxResends" integer NOT NULL DEFAULT (3), "deletedAt" datetime, CONSTRAINT "UQ_a35a151aa26fec3799e22017b2a" UNIQUE ("applicationId"), CONSTRAINT "FK_eae5a1fe954f34e1501f5c59e6d" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_otp_applications"("id", "userId", "name", "otpLength", "expiryMinutes", "maxAttempts", "cooldownSeconds", "createdAt", "updatedAt") SELECT "id", "userId", "name", "otpLength", "expiryMinutes", "maxAttempts", "cooldownSeconds", "createdAt", "updatedAt" FROM "otp_applications"`);
        await queryRunner.query(`DROP TABLE "otp_applications"`);
        await queryRunner.query(`ALTER TABLE "temporary_otp_applications" RENAME TO "otp_applications"`);
        await queryRunner.query(`CREATE TABLE "temporary_application_whatsapp_sessions" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "sessionId" varchar NOT NULL, "phoneNumber" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), "status" varchar(20) NOT NULL DEFAULT ('active'), CONSTRAINT "FK_5841ea5f2664ec2eeaffbe161e1" FOREIGN KEY ("applicationId") REFERENCES "otp_applications" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_61bc5dcb3a7158e7a49080b192d" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_application_whatsapp_sessions"("id", "applicationId", "sessionId", "phoneNumber", "isDefault", "status") SELECT "id", "applicationId", "sessionId", "phoneNumber", "isDefault", "status" FROM "application_whatsapp_sessions"`);
        await queryRunner.query(`DROP TABLE "application_whatsapp_sessions"`);
        await queryRunner.query(`ALTER TABLE "temporary_application_whatsapp_sessions" RENAME TO "application_whatsapp_sessions"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_whatsapp_sessions" RENAME TO "temporary_application_whatsapp_sessions"`);
        await queryRunner.query(`CREATE TABLE "application_whatsapp_sessions" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "sessionId" varchar NOT NULL, "phoneNumber" varchar(50), "isDefault" boolean NOT NULL DEFAULT (0), "status" varchar(20) NOT NULL DEFAULT ('active'))`);
        await queryRunner.query(`INSERT INTO "application_whatsapp_sessions"("id", "applicationId", "sessionId", "phoneNumber", "isDefault", "status") SELECT "id", "applicationId", "sessionId", "phoneNumber", "isDefault", "status" FROM "temporary_application_whatsapp_sessions"`);
        await queryRunner.query(`DROP TABLE "temporary_application_whatsapp_sessions"`);
        await queryRunner.query(`ALTER TABLE "otp_applications" RENAME TO "temporary_otp_applications"`);
        await queryRunner.query(`CREATE TABLE "otp_applications" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "otpLength" integer NOT NULL DEFAULT (4), "expiryMinutes" integer NOT NULL DEFAULT (10), "maxAttempts" integer NOT NULL DEFAULT (3), "cooldownSeconds" integer NOT NULL DEFAULT (60), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_eae5a1fe954f34e1501f5c59e6d" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "otp_applications"("id", "userId", "name", "otpLength", "expiryMinutes", "maxAttempts", "cooldownSeconds", "createdAt", "updatedAt") SELECT "id", "userId", "name", "otpLength", "expiryMinutes", "maxAttempts", "cooldownSeconds", "createdAt", "updatedAt" FROM "temporary_otp_applications"`);
        await queryRunner.query(`DROP TABLE "temporary_otp_applications"`);
        await queryRunner.query(`ALTER TABLE "otp_applications" RENAME TO "temporary_otp_applications"`);
        await queryRunner.query(`CREATE TABLE "otp_applications" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "name" varchar(100) NOT NULL, "whatsappSenderId" varchar, "otpLength" integer NOT NULL DEFAULT (4), "expiryMinutes" integer NOT NULL DEFAULT (10), "maxAttempts" integer NOT NULL DEFAULT (3), "cooldownSeconds" integer NOT NULL DEFAULT (60), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_eae5a1fe954f34e1501f5c59e6d" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "otp_applications"("id", "userId", "name", "otpLength", "expiryMinutes", "maxAttempts", "cooldownSeconds", "createdAt", "updatedAt") SELECT "id", "userId", "name", "otpLength", "expiryMinutes", "maxAttempts", "cooldownSeconds", "createdAt", "updatedAt" FROM "temporary_otp_applications"`);
        await queryRunner.query(`DROP TABLE "temporary_otp_applications"`);
        await queryRunner.query(`DROP TABLE "application_whatsapp_sessions"`);
    }

}
