import express, { Request, Response, NextFunction } from 'express';
import { getTeams } from '../lib/teams.js';
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

teamsRouter.get('/', indexRoute);