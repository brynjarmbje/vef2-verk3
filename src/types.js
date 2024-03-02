/**
 * @typedef {Object} TeamStanding
 * @property {number} position Position of team.
 * @property {string} name Name of team.
 * @property {number} points Number of points.
 */

/**
 * Team object in a game.
 * @typedef {Object} Team
 * @property {string} name Team name.
 * @property {number} score Team score.
 */

/**
 * Team object in the database.
 * @typedef {Object} DatabaseTeam
 * @property {string} id ID.
 * @property {string} name Team name.
 */

/**
 * Game object in a game day.
 * @typedef {Object} Game
 * @property {string|undefined} [id] ID of the game.
 * @property {Date|undefined} [date] Date of the game.
 * @property {Team} home Home team.
 * @property {Team} away Away team.
 */

/**
 * Game object in the database.
 * @typedef {Object} DatabaseGame
 * @property {string} date Date of the game.
 * @property {string} home_id ID of the home team.
 * @property {string} away_id ID of the away team.
 * @property {string} home_score Score of the home team.
 * @property {string} away_score Score of the away team.
 */

/**
 * Game day object with date and array of games.
 * @typedef {Object} Gameday
 * @property {Date} date Date of game day.
 * @property {Game[]} games Array of games.
 */

export {};
