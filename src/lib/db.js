import pg from 'pg';
import { environment } from '../lib/environment.js';
import { logger as loggerSingleton } from '../lib/logger.js';

const MAX_GAMES = 100;

/**
 * Database class.
 */
export class Database {
  /**
   * Create a new database connection.
   * @param {string} connectionString
   * @param {import('../lib/logger.js').Logger} logger
   */
  constructor(connectionString, logger) {
    this.connectionString = connectionString;
    this.logger = logger;
  }

  /** @type {pg.Pool | null} */
  pool = null;

  open() {
    this.pool = new pg.Pool({ connectionString: this.connectionString });

    this.pool.on('error', (err) => {
      this.logger.error('error in database pool', err);
      this.close();
    });
  }

  /**
   * Close the database connection.
   * @returns {Promise<boolean>}
   */
  async close() {
    if (!this.pool) {
      this.logger.error('unable to close database connection that is not open');
      return false;
    }

    try {
      await this.pool.end();
      return true;
    } catch (e) {
      this.logger.error('error closing database pool', { error: e });
      return false;
    } finally {
      this.pool = null;
    }
  }

  /**
   * Connect to the database via the pool.
   * @returns {Promise<pg.PoolClient | null>}
   */
  async connect() {
    if (!this.pool) {
      this.logger.error('Reynt að nota gagnagrunn sem er ekki opinn');
      return null;
    }

    try {
      const client = await this.pool.connect();
      return client;
    } catch (e) {
      this.logger.error('error connecting to db', { error: e });
      return null;
    }
  }

  /**
   * Run a query on the database.
   * @param {string} query SQL query.
   * @param {Array<string>} values Parameters for the query.
   * @returns {Promise<pg.QueryResult | null>} Result of the query.
   */
  async query(query, values = []) {
    const client = await this.connect();

    if (!client) {
      return null;
    }

    try {
      const result = await client.query(query, values);
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
  async getTeams() {
    const q = 'SELECT id, name FROM teams';
    const result = await this.query(q);

    /** @type Array<import('../types.js').DatabaseTeam> */
    const teams = [];
    if (result && (result.rows?.length ?? 0) > 0) {
      for (const row of result.rows) {
        const team = {
          id: row.id,
          name: row.name,
        };
        teams.push(team);
      }

      return teams;
    }

    return null;
  }

  /**
   * Get games from the database.
   * @param {number} [limit=MAX_GAMES] Number of games to get.
   * @returns {Promise<import('../types.js').Game[] | null>}
   */
  async getGames(limit = MAX_GAMES) {
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

    // Ensure we don't get too many games and that we get at least one
    const usedLimit = Math.min(limit > 0 ? limit : MAX_GAMES, MAX_GAMES);

    const result = await this.query(q, [usedLimit.toString()]);

    /** @type Array<import('../types.js').Game> */
    const games = [];
    if (result && (result.rows?.length ?? 0) > 0) {
      for (const row of result.rows) {
        const game = {
          id: row.id,
          date: row.date,
          home: {
            name: row.home_name,
            score: row.home_score,
          },
          away: {
            name: row.away_name,
            score: row.away_score,
          },
        };
        games.push(game);
      }

      return games;
    }

    return null;
  }

  /**
   * Insert a team into the database.
   * @param {string} team Team to insert.
   * @returns {Promise<import('../types.js').DatabaseTeam | null>}
   */
  async insertTeam(team) {
    const result = await this.query(
      'INSERT INTO teams (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id, name',
      [team],
    );
    if (result) {
      /** @type import('../types.js').DatabaseTeam */
      const resultTeam = {
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
  async insertTeams(teams) {
    /** @type Array<import('../types.js').DatabaseTeam> */
    const inserted = [];
    for await (const team of teams) {
      const result = await this.insertTeam(team);
      if (result) {
        inserted.push(result);
      } else {
        this.logger.warn('unable to insert team', { team });
      }
    }
    return inserted;
  }

  /**
   * Insert a game into the database.
   * @param {import('../types.js').DatabaseGame} game
   * @returns {Promise<boolean>}
   */
  async insertGame(game) {
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
      game.home_score,
      game.away_score,
    ]);

    if (!result || result.rowCount !== 1) {
      this.logger.warn('unable to insert game', { result, game });
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
  async insertGamedays(gamedays, dbTeams) {
    if (gamedays.length === 0) {
      this.logger.warn('no gamedays to insert');
      return false;
    }

    if (dbTeams.length === 0) {
      this.logger.warn('no teams to insert');
      return false;
    }

    for await (const gameday of gamedays) {
      for await (const game of gameday.games) {
        const homeId = dbTeams.find((t) => t.name === game.home.name)?.id;
        const awayId = dbTeams.find((t) => t.name === game.away.name)?.id;

        if (!homeId || !awayId) {
          this.logger.warn('unable to find team id', { homeId, awayId });
          continue;
        }

        const result = await this.insertGame({
          date: gameday.date.toISOString(),
          home_id: homeId,
          away_id: awayId,
          home_score: game.home.score.toString(),
          away_score: game.away.score.toString(),
        });

        if (!result) {
          this.logger.warn('unable to insert gameday', { result, gameday });
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
  async deleteGame(id) {
    const result = await this.query('DELETE FROM games WHERE id = $1', [id]);

    if (!result || result.rowCount !== 1) {
      this.logger.warn('unable to delete game', { result, id });
      return false;
    }
    return true;
  }
}

/** @type {Database | null} */
let db = null;

/**
 * Return a singleton database instance.
 * @returns {Database | null}
 */
export function getDatabase() {
  if (db) {
    return db;
  }

  const env = environment(process.env, loggerSingleton);

  if (!env) {
    return null;
  }
  db = new Database(env.connectionString, loggerSingleton);
  db.open();

  return db;
}
