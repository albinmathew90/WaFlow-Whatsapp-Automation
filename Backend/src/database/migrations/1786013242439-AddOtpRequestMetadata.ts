import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtpRequestMetadata1786013242439 implements MigrationInterface {
    name = 'AddOtpRequestMetadata1786013242439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE "otp_requests" ADD COLUMN "metadata" text`);
        } catch (e) {}
        try {
            await queryRunner.query(`ALTER TABLE "otp_requests" ADD COLUMN "senderSession" varchar(255)`);
        } catch (e) {}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQLite does not support DROP COLUMN easily before newer versions, but TypeORM normally handles it via table rebuild.
        // Since it's an additive migration, we can leave down() empty or use modern SQLite DROP COLUMN if supported.
        await queryRunner.query(`ALTER TABLE "otp_requests" DROP COLUMN "senderSession"`);
        await queryRunner.query(`ALTER TABLE "otp_requests" DROP COLUMN "metadata"`);
    }
}
