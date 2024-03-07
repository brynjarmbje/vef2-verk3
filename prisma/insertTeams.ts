import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../src/utils/slugify.js';

const prisma = new PrismaClient();

// List of team names
const teams = [
  'Boltaliðið',
  'Dripplararnir',
  'Skotföstu kempurnar',
  'Markaskorarnir',
  'Sigurliðið',
  'Risaeðlurnar',
  'Framherjarnir',
  'Fljótu fæturnir',
  'Vinningshópurinn',
  'Ósigrandi skotfólkið',
  'Óhemjurnar',
  'Hraðaliðið'
];

async function insertTeams() {
  for (const name of teams) {
    const slug = generateSlug(name); // Generate a slug for each team
    try {
      const team = await prisma.team.create({
        data: {
          name,
          slug, // Include the slug in the data
          // Optionally add a description or other fields here
        },
      });
      console.log(`Inserted team: ${team.name} with slug: ${team.slug}`);
    } catch (error) {
      console.error(`Failed to insert team ${name} with slug ${slug}:`, error);
    }
  }

  await prisma.$disconnect();
}

insertTeams().catch(console.error);