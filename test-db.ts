import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Attempt to connect to the database
    await prisma.$connect();
    console.log('✅ Successfully connected to the PostgreSQL database!');
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
  } finally {
    // Always disconnect when done
    await prisma.$disconnect();
  }
}

main();
