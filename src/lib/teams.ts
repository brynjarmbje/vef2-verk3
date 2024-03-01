export type Team = {
    name: string;
    slug: string;
    description?: string;
}

type Game = {
    date: Date;
    home: Team;
    away: Team;
    home_score: number;
    away_score: number;
}

export  function  getTeams(): Team[] {
    const team = {
        name: 'skotlidid',
        slug: 'skotlidid',
        description: 'geggjad lid'
    }

    return [team, team, team]
}

export  function getTeam(slug: string): Team {
    return {
        name: 'temp',
        slug
    };
}