import { body, CustomSanitizer } from 'express-validator';
import xss from 'xss';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const xssSanitize: CustomSanitizer = (value) => {
  return xss(value);
};

export const createGameValidationMiddleware = () => [
  body('date')
    .trim()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Dagsetning verður að vera á ISO 8601 sniði')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const twoMonthsAgo = new Date(now.setMonth(now.getMonth() - 2));
      if (date > new Date() || date < twoMonthsAgo) {
        throw new Error('Dagsetning má ekki vera í framtíðinni eða meira en tvo mánuði aftur í tímann');
      }
      return true;
    }),
  body('home')
    .custom(async (value) => {
      const team = await prisma.team.findUnique({
        where: {
          id: parseInt(value),
        },
      });
      if (!team) {
        throw new Error('Heimalið verður að vera gilt');
      }
      return true;
    }),
  body('away')
    .custom(async (value, { req }) => {
      if (value === req.body.home) {
        throw new Error('Heimalið og útilið verða að vera mismunandi');
      }
      const team = await prisma.team.findUnique({
        where: {
          id: parseInt(value),
        },
      });
      if (!team) {
        throw new Error('Útilið verður að vera gilt');
      }
      return true;
    }),
  body('home_score', 'Stig heimaliðs verður að vera heiltala, 0 eða stærri, hámark 99')
    .isInt({ min: 0, max: 99 }),
  body('away_score', 'Stig útiliðs verður að vera heiltala, 0 eða stærri, hámark 99')
    .isInt({ min: 0, max: 99 }),
];

export const teamValidationMiddleware = () => [
  // Validate 'name'
  body('name')
    .trim()
    .isLength({ min: 3, max: 128 })
    .withMessage('Nafn liðs verður að vera á milli 3 og 128 stafir')
    .matches(/^[a-z0-9 -]+$/i)
    .withMessage('Nafn má aðeins innihalda enska stafi, tölustafi og bil'),

  // Validate 'description'
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 1024 })
    .withMessage('Lýsing má ekki vera lengri en 1024 stafir')
    .trim(),
];

export const xssSanitizationMiddleware = () => [
  body('date').customSanitizer(xssSanitize),
  body('home').customSanitizer(xssSanitize),
  body('away').customSanitizer(xssSanitize),
  body('home_score').customSanitizer(xssSanitize),
  body('away_score').customSanitizer(xssSanitize),
  body(['name', 'description']).customSanitizer(xssSanitize),
];

export const sanitizationMiddleware = () => [
  body(['date', 'home', 'away', 'home_score', 'away_score']).trim().escape(),
];
