import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

async function main() {

  // Read all files from the data directory
  const files = await fs.readdir(dataDir);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

      // Determine the type of data and import accordingly
      if (file.startsWith('team')) {
        // Assuming each file contains an array of teams
        for (const item of data) {
          await prisma.team.create({
            data: item,
          });
        }
      } else if (file.startsWith('game')) {
        // Assuming each file contains an array of games
        for (const item of data) {
          await prisma.game.create({
            data: item,
          });
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });