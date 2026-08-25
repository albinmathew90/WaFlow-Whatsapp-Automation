import { MigrationInterface, QueryRunner } from "typeorm";

export class TrialLimits1787649527421 implements MigrationInterface {
    name = 'TrialLimits1787649527421'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_users" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "password" varchar, "name" varchar, "avatar" varchar, "resetPasswordToken" varchar, "resetPasswordExpires" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "country" varchar, "phoneNumber" varchar, "subscriptionStatus" varchar, "renewalDate" datetime, "lastRenewedOn" datetime, "webhookToken" varchar, "hasUsedTrial" boolean NOT NULL DEFAULT (0), "trialExpiresAt" datetime, "trialPhoneNumber" varchar, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "temporary_users"("id", "email", "password", "name", "avatar", "resetPasswordToken", "resetPasswordExpires", "createdAt", "updatedAt", "country", "phoneNumber", "subscriptionStatus", "renewalDate", "lastRenewedOn", "webhookToken") SELECT "id", "email", "password", "name", "avatar", "resetPasswordToken", "resetPasswordExpires", "createdAt", "updatedAt", "country", "phoneNumber", "subscriptionStatus", "renewalDate", "lastRenewedOn", "webhookToken" FROM "users"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "password" varchar, "name" varchar, "avatar" varchar, "resetPasswordToken" varchar, "resetPasswordExpires" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "country" varchar, "phoneNumber" varchar, "subscriptionStatus" varchar, "renewalDate" datetime, "lastRenewedOn" datetime, "webhookToken" varchar, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "users"("id", "email", "password", "name", "avatar", "resetPasswordToken", "resetPasswordExpires", "createdAt", "updatedAt", "country", "phoneNumber", "subscriptionStatus", "renewalDate", "lastRenewedOn", "webhookToken") SELECT "id", "email", "password", "name", "avatar", "resetPasswordToken", "resetPasswordExpires", "createdAt", "updatedAt", "country", "phoneNumber", "subscriptionStatus", "renewalDate", "lastRenewedOn", "webhookToken" FROM "temporary_users"`);
        await queryRunner.query(`DROP TABLE "temporary_users"`);
    }

}
