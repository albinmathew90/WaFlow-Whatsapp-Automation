import { MigrationInterface, QueryRunner } from "typeorm";

export class OtpAuditAnalytics1786085563055 implements MigrationInterface {
    name = 'OtpAuditAnalytics1786085563055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "otp_audit_logs" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "event" varchar(100) NOT NULL, "message" text NOT NULL, "status" varchar(50) NOT NULL DEFAULT ('success'), "metadata" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "otp_analytics_daily" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "date" date NOT NULL, "totalRequests" integer NOT NULL DEFAULT (0), "verified" integer NOT NULL DEFAULT (0), "failed" integer NOT NULL DEFAULT (0), "expired" integer NOT NULL DEFAULT (0), "delivered" integer NOT NULL DEFAULT (0), "read" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bf7266c8935a156abfa0fc9e89" ON "otp_analytics_daily" ("applicationId", "date") `);
        await queryRunner.query(`CREATE TABLE "temporary_otp_audit_logs" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "event" varchar(100) NOT NULL, "message" text NOT NULL, "status" varchar(50) NOT NULL DEFAULT ('success'), "metadata" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_668a0d6e1787ecaede5b890db95" FOREIGN KEY ("applicationId") REFERENCES "otp_applications" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_otp_audit_logs"("id", "applicationId", "event", "message", "status", "metadata", "createdAt") SELECT "id", "applicationId", "event", "message", "status", "metadata", "createdAt" FROM "otp_audit_logs"`);
        await queryRunner.query(`DROP TABLE "otp_audit_logs"`);
        await queryRunner.query(`ALTER TABLE "temporary_otp_audit_logs" RENAME TO "otp_audit_logs"`);
        await queryRunner.query(`DROP INDEX "IDX_bf7266c8935a156abfa0fc9e89"`);
        await queryRunner.query(`CREATE TABLE "temporary_otp_analytics_daily" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "date" date NOT NULL, "totalRequests" integer NOT NULL DEFAULT (0), "verified" integer NOT NULL DEFAULT (0), "failed" integer NOT NULL DEFAULT (0), "expired" integer NOT NULL DEFAULT (0), "delivered" integer NOT NULL DEFAULT (0), "read" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_b9f7da1693718ae59076cad27ef" FOREIGN KEY ("applicationId") REFERENCES "otp_applications" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_otp_analytics_daily"("id", "applicationId", "date", "totalRequests", "verified", "failed", "expired", "delivered", "read", "createdAt", "updatedAt") SELECT "id", "applicationId", "date", "totalRequests", "verified", "failed", "expired", "delivered", "read", "createdAt", "updatedAt" FROM "otp_analytics_daily"`);
        await queryRunner.query(`DROP TABLE "otp_analytics_daily"`);
        await queryRunner.query(`ALTER TABLE "temporary_otp_analytics_daily" RENAME TO "otp_analytics_daily"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bf7266c8935a156abfa0fc9e89" ON "otp_analytics_daily" ("applicationId", "date") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_bf7266c8935a156abfa0fc9e89"`);
        await queryRunner.query(`ALTER TABLE "otp_analytics_daily" RENAME TO "temporary_otp_analytics_daily"`);
        await queryRunner.query(`CREATE TABLE "otp_analytics_daily" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "date" date NOT NULL, "totalRequests" integer NOT NULL DEFAULT (0), "verified" integer NOT NULL DEFAULT (0), "failed" integer NOT NULL DEFAULT (0), "expired" integer NOT NULL DEFAULT (0), "delivered" integer NOT NULL DEFAULT (0), "read" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "otp_analytics_daily"("id", "applicationId", "date", "totalRequests", "verified", "failed", "expired", "delivered", "read", "createdAt", "updatedAt") SELECT "id", "applicationId", "date", "totalRequests", "verified", "failed", "expired", "delivered", "read", "createdAt", "updatedAt" FROM "temporary_otp_analytics_daily"`);
        await queryRunner.query(`DROP TABLE "temporary_otp_analytics_daily"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bf7266c8935a156abfa0fc9e89" ON "otp_analytics_daily" ("applicationId", "date") `);
        await queryRunner.query(`ALTER TABLE "otp_audit_logs" RENAME TO "temporary_otp_audit_logs"`);
        await queryRunner.query(`CREATE TABLE "otp_audit_logs" ("id" varchar PRIMARY KEY NOT NULL, "applicationId" varchar NOT NULL, "event" varchar(100) NOT NULL, "message" text NOT NULL, "status" varchar(50) NOT NULL DEFAULT ('success'), "metadata" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "otp_audit_logs"("id", "applicationId", "event", "message", "status", "metadata", "createdAt") SELECT "id", "applicationId", "event", "message", "status", "metadata", "createdAt" FROM "temporary_otp_audit_logs"`);
        await queryRunner.query(`DROP TABLE "temporary_otp_audit_logs"`);
        await queryRunner.query(`DROP INDEX "IDX_bf7266c8935a156abfa0fc9e89"`);
        await queryRunner.query(`DROP TABLE "otp_analytics_daily"`);
        await queryRunner.query(`DROP TABLE "otp_audit_logs"`);
    }

}
