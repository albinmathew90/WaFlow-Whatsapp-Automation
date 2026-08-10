import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddOtpApiKeyLog1786002500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'otp_api_key_logs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'applicationId',
            type: 'varchar',
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'statusCode',
            type: 'int',
          },
          {
            name: 'latencyMs',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'otp_api_key_logs',
      new TableForeignKey({
        columnNames: ['applicationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'otp_applications',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('otp_api_key_logs');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('applicationId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('otp_api_key_logs', foreignKey);
    }
    await queryRunner.dropTable('otp_api_key_logs');
  }
}
