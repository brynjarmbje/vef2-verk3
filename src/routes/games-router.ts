import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const gamesRouter = express.Router();

// Middleware to parse request body as JSON
gamesRouter.use(express.json());

// GET /games - Retrieve a list of games
gamesRouter.get('/', async (req, res) => {
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
gamesRouter.get('/:id', async (req, res) => {
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
gamesRouter.post('/', async (req, res) => {
  const { date, home, away, home_score, away_score } = req.body;
  try {
    const newGame = await prisma.game.create({
      data: { date, home, away, home_score, away_score },
    });
    res.status(200).json(newGame);
  } catch (error) {
    console.error('Failed to create a new game:', error);
    res.status(400).json({ error: 'Bad Request - Invalid game data' });
  }
});

// PATCH /games/:id - Update a game
gamesRouter.patch('/:id', async (req, res) => {
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
gamesRouter.delete('/:id', async (req, res) => {
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