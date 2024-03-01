import express, { Request, Response, NextFunction } from 'express';
import { getTeams } from '../lib/teams.js';
export const teamsRouter = express.Router();



export async function indexRoute(req: Request, res:  Response) {

    const searchQS = req.query.search;

    let search =  typeof searchQS === 'string' ? searchQS :
    undefined;

    const search = req.query.search;

    const teams = getTeams();

    let foundTeams: Teams[];
    if (search)  {
        foundTeams = teams.find((team) => team.name.indexOf(search) >= 0) ??
    }



    console.log(search);

    return res.json(teams);
}

teamsRouter.get('/', indexRoute);