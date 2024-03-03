import express, { Request, Response, NextFunction } from 'express';
import { getTeams } from '../lib/teams.js';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../utils/slugify.js';
export const teamsRouter = express.Router();

export async function indexRoute(req: Request, res: Response) {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    
    const teams = await getTeams(); // Assuming getTeams() is async and returns Promise<Team[]>

    let foundTeams = teams;
    if (search) {
        foundTeams = teams.filter((team) => team.name.toLowerCase().includes(search.toLowerCase()));
    }

    console.log(search);
    return res.json(foundTeams);
}

const prisma = new PrismaClient();

teamsRouter.get('/', async (req: Request, res: Response) => {
    try {
      const teams = await prisma.team.findMany();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
  
teamsRouter.get('/:slug', async (req: Request, res: Response) => {
    const { slug } = req.params;
    try {
      const team = await prisma.team.findUnique({
        where: { slug },
      });
  
      if (team) {
        res.json(team);
      } else {
        res.status(404).json({ error: 'Team not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

teamsRouter.post('/', async (req: Request, res: Response) => {
    const { name, description } = req.body;
  
    try {
      const slug = generateSlug(name); // generate a slug based on the name
      const team = await prisma.team.create({
        data: { name, slug, description },
      });
  
      res.status(200).json(team);
    } catch (error) {
      res.status(400).json({ error: 'Bad Request' });
    }
});

teamsRouter.patch('/:slug', async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { name, description } = req.body;

    try {
        const updatedTeam = await prisma.team.update({
            where: { slug },
            data: { name, description },
        });
        res.json(updatedTeam);
    } catch (error) {
        console.error('Failed to update team:', error);

        // General error response without checking Prisma error codes
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

teamsRouter.delete('/:slug', async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
        await prisma.team.delete({
            where: { slug },
        });
        // Successfully deleted
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete team:', error);

        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

teamsRouter.get('/', indexRoute);