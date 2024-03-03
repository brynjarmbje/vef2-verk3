import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../src/utils/slugify.js';

const prisma = new PrismaClient();

async function updateTeamSlugs() {
  // Fetch all teams from the database
  const existingTeams = await prisma.team.findMany();

  for (const team of existingTeams) {
    const newSlug = generateSlug(team.name); // Generate a new slug based on the team's name

    try {
      const updatedTeam = await prisma.team.update({
        where: {
          id: team.id, // Use the team's ID to identify which team to update
        },
        data: {
          slug: newSlug, // Update the team's slug
        },
      });
      console.log(`Updated team: ${updatedTeam.name} with new slug: ${updatedTeam.slug}`);
    } catch (error) {
      console.error(`Failed to update team ${team.name} with new slug ${newSlug}:`, error);
    }
  }

  await prisma.$disconnect();
}

updateTeamSlugs().catch(console.error);