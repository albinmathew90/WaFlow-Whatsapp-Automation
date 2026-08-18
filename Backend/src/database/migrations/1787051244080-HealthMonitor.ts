import { MigrationInterface, QueryRunner } from "typeorm";

export class HealthMonitor1787051244080 implements MigrationInterface {
    name = 'HealthMonitor1787051244080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system_alerts" ("id" varchar PRIMARY KEY NOT NULL, "sessionId" varchar NOT NULL, "level" varchar NOT NULL DEFAULT ('info'), "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "IDX_5fad3277c75c19a7c4f3b0bf10" ON "system_alerts" ("sessionId", "createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_5fad3277c75c19a7c4f3b0bf10"`);
        await queryRunner.query(`DROP TABLE "system_alerts"`);
    }

}
