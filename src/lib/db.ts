import * as pg from 'pg';
import { environment, Environment } from './environment.js';
import { Logger, logger as loggerSingleton } from './logger.js';
import { DatabaseTeam, Game, Gameday, DatabaseGame } from '../types.js'; // Adjust the import path

const MAX_GAMES = 100;

/**
 * Database class.
 */
export class Database {
  private connectionString: string;
  private logger: Logger;
  private pool: pg.Pool | null = null;

  constructor(connectionString: string, logger: Logger) {
    this.connectionString = connectionString;
    this.logger = logger;
  }

  open(): void {
    if (!this.pool) {
      this.pool = new pg.Pool({ connectionString: this.connectionString });

      this.pool.on('error', (err: Error) => {
        this.logger.error('Error in database pool', err);
        // No need to explicitly call this.close() here unless you want to force closing the pool on every error
        // Consider logging and potentially alerting, but let the pool handle reconnection as configured
      });
    }
  }

  async close(): Promise<boolean> {
    if (!this.pool) {
      this.logger.error('Unable to close database connection that is not open');
      return false;
    }

    try {
      await this.pool.end();
      this.pool = null;
      return true;
    } catch (e) {
      this.logger.error('Error closing database pool', { error: e });
      this.pool = null;
      return false;
    }
  }

  /**
   * Connect to the database via the pool.
   * @returns {Promise<pg.PoolClient | null>}
   */
  async connect(): Promise<pg.PoolClient | null> {
    if (!this.pool) {
      this.logger.error('Attempted to use database that is not open');
      return null;
    }
  
    try {
      const client: pg.PoolClient = await this.pool.connect();
      return client;
    } catch (e) {
      this.logger.error('Error connecting to db', { error: e });
      return null;
    }
  }

  /**
   * Run a query on the database.
   * @param {string} query SQL query.
   * @param {Array<string>} values Parameters for the query.
   * @returns {Promise<pg.QueryResult | null>} Result of the query.
   */
  async query(query: string, values: Array<string> = []): Promise<pg.QueryResult | null> {
    const client: pg.PoolClient | null = await this.connect();
  
    if (!client) {
      return null;
    }
  
    try {
      const result: pg.QueryResult = await client.query(query, values);
      return result;
    } catch (e) {
      this.logger.error('Error running query', e);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Get teams from the database.
   * @returns {Promise<Array<import('../types.js').DatabaseTeam> | null>}
   */
  async getTeams(): Promise<DatabaseTeam[] | null> {
    const q = 'SELECT id, name FROM teams';
    const result = await this.query(q);
  
    if (result && result.rows.length > 0) {
      const teams: DatabaseTeam[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
      }));
  
      return teams;
    }
  
    return null;
  }

  /**
   * Get games from the database.
   * @param {number} [limit=MAX_GAMES] Number of games to get.
   * @returns {Promise<import('../types.js').Game[] | null>}
   */
  async getGames(limit: number = MAX_GAMES): Promise<Game[] | null> {
    const q = `
      SELECT
        games.id as id,
        date,
        home_team.name AS home_name,
        home_score,
        away_team.name AS away_name,
        away_score
      FROM
        games
      LEFT JOIN
        teams AS home_team ON home_team.id = games.home
      LEFT JOIN
        teams AS away_team ON away_team.id = games.away
      ORDER BY
        date DESC
      LIMIT $1
    `;
  
    const usedLimit = Math.min(limit, MAX_GAMES);
    const result = await this.query(q, [usedLimit.toString()]);
  
    if (result && result.rows.length > 0) {
      const games: Game[] = result.rows.map(row => ({
        id: row.id,
        date: new Date(row.date),
        home: { name: row.home_name, score: parseInt(row.home_score) },
        away: { name: row.away_name, score: parseInt(row.away_score) },
      }));
  
      return games;
    }
  
    return null;
  }

  /**
   * Insert a team into the database.
   * @param {string} team Team to insert.
   * @returns {Promise<import('../types.js').DatabaseTeam | null>}
   */
  async insertTeam(team: string): Promise<DatabaseTeam | null> {
    const result = await this.query(
      'INSERT INTO teams (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id, name',
      [team],
    );
  
    if (result && result.rows.length > 0) {
      const resultTeam: DatabaseTeam = {
        id: result.rows[0].id,
        name: result.rows[0].name,
      };
      return resultTeam;
    }
  
    return null;
  }

  /**
   * Insert teams into the database.
   * @param {string[]} teams List of teams to insert.
   * @returns {Promise<Array<import('../types.js').DatabaseTeam>>} List of teams inserted.
   */
  async insertTeams(teams: string[]): Promise<DatabaseTeam[]> {
    const inserted: DatabaseTeam[] = [];
    for (const team of teams) {
      const result = await this.insertTeam(team);
      if (result) {
        inserted.push(result);
      } else {
        this.logger.warn('Unable to insert team', { team });
      }
    }
    return inserted;
  }

  /**
   * Insert a game into the database.
   * @param {import('../types.js').DatabaseGame} game
   * @returns {Promise<boolean>}
   */
  async insertGame(game: DatabaseGame): Promise<boolean> {
    const q = `
      INSERT INTO
        games (date, home, away, home_score, away_score)
      VALUES
        ($1, $2, $3, $4, $5)
    `;
  
    const result = await this.query(q, [
      game.date,
      game.home_id,
      game.away_id,
      game.home_score.toString(),
      game.away_score.toString(),
    ]);
  
    if (!result || result.rowCount !== 1) {
      this.logger.warn('Unable to insert game', { result, game });
      return false;
    }
    return true;
  }

  /**
   * Insert gamedays into the database.
   * @param {Array<import('../types.js').Gameday>} gamedays
   * @param {Array<import('../types.js').DatabaseTeam>} dbTeams
   * @returns {Promise<boolean>}
   */
  async insertGamedays(gamedays: Gameday[], dbTeams: DatabaseTeam[]): Promise<boolean> {
    if (gamedays.length === 0) {
      this.logger.warn('No gamedays to insert');
      return false;
    }
  
    if (dbTeams.length === 0) {
      this.logger.warn('No teams to insert');
      return false;
    }
  
    for (const gameday of gamedays) {
      for (const game of gameday.games) {
        const homeId = dbTeams.find(t => t.name === game.home.name)?.id;
        const awayId = dbTeams.find(t => t.name === game.away.name)?.id;
  
        if (!homeId || !awayId) {
          this.logger.warn('Unable to find team id', { homeId, awayId });
          continue;
        }
  
        const success = await this.insertGame({
          date: gameday.date.toISOString(),
          home_id: homeId,
          away_id: awayId,
          home_score: game.home.score.toString(),
          away_score: game.away.score.toString(),
        });
  
        if (!success) {
          this.logger.warn('Unable to insert gameday', { gameday });
        }
      }
    }
  
    return true;
  }

  /**
   * Delete a game from the database.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteGame(id: string): Promise<boolean> {
    const result = await this.query('DELETE FROM games WHERE id = $1', [id]);
  
    if (!result || result.rowCount !== 1) {
      this.logger.warn('Unable to delete game', { result, id });
      return false;
    }
    return true;
  }
}

/** @type {Database | null} */
let db: Database | null = null;

/**
 * Return a singleton database instance.
 * @returns {Database | null}
 */
export function getDatabase(): Database | null {
  if (db) {
    return db;
  }

  const env: Environment | null = environment(process.env, loggerSingleton);

  if (!env) {
    loggerSingleton.error('Environment vars not  set right');
    return null;
  }
  db = new Database(env.connectionString, loggerSingleton);
  db.open();

  return db;
}
