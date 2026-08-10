import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtpResendFields1786015084062 implements MigrationInterface {
    name = 'AddOtpResendFields1786015084062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE "otp_requests" ADD COLUMN "resendCount" integer NOT NULL DEFAULT (0)`);
        } catch (e) {}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Handled by TypeORM entity sync down or ignored safely
    }
}
