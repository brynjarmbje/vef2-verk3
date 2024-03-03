import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// Convert the URL of the current module to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the path to the JSON file
const jsonFilePath = path.join(__dirname, '../data/gameday-z48d.json');

// Dynamically import the JSON file
const importGameData = async () => {
    const gameData = await import(jsonFilePath, { assert: { type: 'json' } });
    return gameData.default;
  };

const insertGames = async () => {
    const gameData = await importGameData();
  
    for (const game of gameData.games) {
      // Assuming you have a function or method to resolve team names to IDs
      const homeTeamId = await resolveTeamId(game.home.name);
      const awayTeamId = await resolveTeamId(game.away.name);
  
      if (!homeTeamId || !awayTeamId) {
        console.error(`Failed to resolve team IDs for game: ${game.home.name} vs ${game.away.name}`);
        continue;
      }
  
      await prisma.game.create({
        data: {
          date: new Date(gameData.date), // Use the date from the game data
          home: homeTeamId,
          away: awayTeamId,
          home_score: game.home.score,
          away_score: game.away.score,
        },
      });
    }
  
    console.log('All valid games inserted.');
  };
  
  // Dummy function for resolving team names to IDs - implement according to your logic
  async function resolveTeamId(teamName: any) {
    const team = await prisma.team.findUnique({
      where: {
        name: teamName,
      },
    });
    return team?.id;
  }
  
  insertGames()
    .catch((e) => {
      console.error('Error inserting games:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });