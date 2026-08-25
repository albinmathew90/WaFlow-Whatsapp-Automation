const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'sqlite',
  database: './data/openwa.sqlite',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function run() {
  await dataSource.initialize();
  
  // We'll reset all users to expired just to make testing easy
  await dataSource.query(`
    UPDATE "users" 
    SET "subscriptionStatus" = 'expired', 
        "subscriptionExpiresAt" = NULL, 
        "planType" = NULL
  `);

  console.log('Successfully reset all users to expired status for testing!');
  
  await dataSource.destroy();
}

run().catch(console.error);
