import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// data files
const jsonFileBases = ['z48d', '3iks', '8k38', '9xnf', '18jl', '1230','4828', '9099','llx8', 'nxl3','x4jx', 'xj39'];
const jsonFilePaths = jsonFileBases.map(base => path.join(__dirname, `../data/gameday-${base}.json`));

const importGameData = async (jsonFilePath: string) => {
    const gameData = await import(jsonFilePath, { assert: { type: 'json' } });
    return gameData.default;
};

const insertGames = async () => {
    for (const filePath of jsonFilePaths) {
        const gameData = await importGameData(filePath);

        for (const game of gameData.games) {
            const homeTeamId = await resolveTeamId(game.home.name);
            const awayTeamId = await resolveTeamId(game.away.name);

            if (!homeTeamId || !awayTeamId) {
                console.error(`Failed to resolve team IDs for game: ${game.home.name} vs ${game.away.name}`);
                continue;
            }

            await prisma.game.create({
                data: {
                    date: new Date(gameData.date),
                    home: homeTeamId,
                    away: awayTeamId,
                    home_score: game.home.score,
                    away_score: game.away.score,
                },
            });
        }

        console.log(`All valid games inserted for file: ${filePath}`);
    }
};

async function resolveTeamId(teamName: string): Promise<number | null> {
    const team = await prisma.team.findUnique({
        where: {
            name: teamName,
        },
    });
    return team?.id ?? null;
}

insertGames()
    .catch((e) => {
        console.error('Error inserting games:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });