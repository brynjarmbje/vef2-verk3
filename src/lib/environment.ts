import { Logger } from "./logger";

export interface Environment {
  port: number;
  sessionSecret: string;
  connectionString: string;
}

/** Default port if none provided. */
const DEFAULT_PORT = 3000;

/**
 * @typedef Environment
 * @property {number} port
 * @property {string} sessionSecret
 * @property {string} connectionString
 */

let parsedEnv: Environment | null = null;

/**
 * Validate the environment variables and return them as an object or `null` if
 * validation fails.
 * @param {NodeJS.ProcessEnv} env
 * @param {import('./logger').Logger} logger
 * @returns {Environment | null}
 */
export function environment(env: NodeJS.ProcessEnv, logger: Logger): Environment | null {
  if (parsedEnv) {
    return parsedEnv;
  }

  const portStr = env.PORT;
  const envSessionSecret = env.SESSION_SECRET;
  const envConnectionString = env.DATABASE_URL;

  let error = false;

  if (!envSessionSecret || envSessionSecret.length < 32) {
    logger.error('SESSION_SECRET must be defined as a string and be at least 32 characters long');
    error = true;
  }

  if (!envConnectionString) {
    logger.error('DATABASE_URL must be defined as a string');
    error = true;
  }

  let usedPort = DEFAULT_PORT;
  if (portStr) {
    const parsedPort = parseInt(portStr, 10);
    if (isNaN(parsedPort)) {
      logger.error(`PORT must be a number, received "${portStr}"`);
      error = true;
    } else {
      usedPort = parsedPort;
    }
  } else {
    logger.info(`PORT not defined, using default port: ${DEFAULT_PORT}`);
  }

  if (error) {
    return null;
  }

  parsedEnv = {
    port: usedPort,
    sessionSecret: envSessionSecret as string, // We've already checked it exists and is long enough
    connectionString: envConnectionString as string, // We've already checked it exists
  };

  return parsedEnv;
}
