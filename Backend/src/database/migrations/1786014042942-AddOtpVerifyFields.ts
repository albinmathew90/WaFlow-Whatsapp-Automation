import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtpVerifyFields1786014042942 implements MigrationInterface {
    name = 'AddOtpVerifyFields1786014042942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE "otp_requests" ADD COLUMN "verified" boolean NOT NULL DEFAULT (0)`);
        } catch (e) {}
        try {
            await queryRunner.query(`ALTER TABLE "otp_requests" ADD COLUMN "verifiedAt" datetime`);
        } catch (e) {}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Handled by TypeORM entity sync down or ignored safely
    }
}
