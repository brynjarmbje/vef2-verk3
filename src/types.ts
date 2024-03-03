export interface TeamStanding {
    position: number;
    name: string;
    points: number;
  }
  
  export interface Team {
    name: string;
    score: number;
  }
  
  export interface DatabaseTeam {
    id: string;
    name: string;
  }
  
  export interface Game {
    id?: string;
    date?: Date;
    home: Team;
    away: Team;
  }
  
  export interface DatabaseGame {
    date: string;
    home_id: string;
    away_id: string;
    home_score: string;
    away_score: string;
  }
  
  export interface Gameday {
    date: Date;
    games: Game[];
  }
