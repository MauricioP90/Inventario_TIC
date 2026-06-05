import { AppDataSource } from "../src/data-source";

async function main() {
    await AppDataSource.initialize();
    console.log("Database initialized");
    
    // Add location_id to sim_cards table
    await AppDataSource.query(`
        ALTER TABLE sim_cards 
        ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    
    console.log("Database altered successfully");
    await AppDataSource.destroy();
}

main().catch(console.error);
