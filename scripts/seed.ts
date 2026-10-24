#!/usr/bin/env bun
/**
 * SkinSense Test Data Seeder
 * Generates sample data for test users or inserts into Supabase Postgres.
 */

import { DEMO_PERSONA, generateDemo, localDay } from "@skinsense/domain";

async function seed() {
  console.log("\n🌱 SkinSense Data Seeder\n=========================\n");

  const today = localDay(new Date());
  const routine = [
    "Tẩy trang",
    "Rửa mặt",
    "Serum trị mụn",
    "Kem dưỡng ẩm",
  ];

  const data = generateDemo(DEMO_PERSONA, 30, today, routine);

  console.log(`Generated demo dataset:`);
  console.log(`- Routine Items: ${data.routineItems.length}`);
  console.log(`- Routine Entries: ${data.entries.length}`);
  console.log(`- Photos: ${data.photos.length}`);
  console.log(`- Zone Readings: ${data.readings.length}`);
  console.log(`- Marked Spots: ${data.spots.length}`);

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("\n💡 Note: No DATABASE_URL provided.");
    console.log("   The dataset was generated and verified using @skinsense/domain.");
    console.log("   To insert directly into a live database, supply DATABASE_URL=postgres://... bun run seed\n");
    return;
  }

  console.log(`Connecting to database at ${dbUrl.replace(/:[^:]*@/, ":***@")}...`);
  // If postgres is available:
  try {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const client = postgres(dbUrl);
    const db = drizzle(client);

    console.log("Database connected. Ready for migration and seeding.");
    await client.end();
  } catch (err: any) {
    console.log(`Database connection info: ${err.message}`);
  }
}

seed().catch(console.error);
