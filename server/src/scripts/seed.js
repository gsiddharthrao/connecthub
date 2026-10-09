const dotenv = require('dotenv');
dotenv.config();

const { connectDB, disconnectDB } = require('../config/db');
const { seedDemoData } = require('../utils/seeder');

async function runSeeder() {
  console.log('[Seeder CLI] Starting opt-in database seeder...');
  try {
    await connectDB();
    await seedDemoData();
    console.log('[Seeder CLI] Seeding completed successfully.');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder CLI Error] Failed to seed database: ${error.message}`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
}

runSeeder();
