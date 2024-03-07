import express, {Request, Response} from 'express';
import { PrismaClient } from '@prisma/client';
import { createGameValidationMiddleware, sanitizationMiddleware, xssSanitizationMiddleware } from '../lib/validation.js';

const prisma = new PrismaClient();
const gamesRouter = express.Router();

// Middleware to parse request body as JSON
gamesRouter.use(express.json());

// GET /games - Retrieve a list of games
gamesRouter.get('/', xssSanitizationMiddleware(),async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
    res.json(games);
  } catch (error) {
    console.error('Failed to retrieve games:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// GET /games/:id - Retrieve a single game by ID
gamesRouter.get('/:id', xssSanitizationMiddleware(), async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const game = await prisma.game.findUnique({
      where: { id: Number(id) },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
    if (game) {
      res.json(game);
    } else {
      res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    console.error(`Failed to retrieve game ${id}:`, error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// POST /games - Create a new game
gamesRouter.post('/', createGameValidationMiddleware(), xssSanitizationMiddleware(), sanitizationMiddleware(), async (req: Request, res: Response) => {
  // Destructuring directly from req.body based on validation and original field names
  const { date, home, away, home_score, away_score } = req.body;

  try {
    // Assuming your Prisma schema expects `home` and `away` as foreign keys, ensure they are integers
    const newGame = await prisma.game.create({
      data: { 
        date: new Date(date), // Convert string to Date object if necessary
        home: parseInt(home), // Convert to integer if not already
        away: parseInt(away), // Convert to integer if not already
        home_score: parseInt(home_score), // Ensure score is an integer
        away_score: parseInt(away_score), // Ensure score is an integer
      },
    });
    res.status(200).json(newGame); // Use HTTP 201 for successful creation
  } catch (error) {
    console.error('Failed to create a new game:', error);
    res.status(400).json({ error: 'Bad Request - Invalid game data' });
  }
});

// PATCH /games/:id - Update a game
gamesRouter.patch('/:id', createGameValidationMiddleware(), xssSanitizationMiddleware(), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date, home, away, home_score, away_score } = req.body;
  try {
    const updatedGame = await prisma.game.update({
      where: { id: Number(id) },
      data: { date, home, away, home_score, away_score },
    });
    res.json(updatedGame);
  } catch (error) {
    console.error('Failed to update game:', error);

    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// DELETE /games/:id - Delete a game
gamesRouter.delete('/:id', xssSanitizationMiddleware(),async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.game.delete({
      where: { id: Number(id) },
    });
    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete game:', error);

    res.status(500).json({ error: 'An unexpected error occurred' });
}
});

export default gamesRouter;