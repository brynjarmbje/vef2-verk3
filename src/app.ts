import express from 'express';
import { catchErrors } from './lib/catch-errors.js';
import { router, bye, hello, error } from './routes/api.js';
import  { apiRouter } from './routes/index.js';

const app = express();

app.get('/', catchErrors(hello), catchErrors(error), catchErrors(bye));
app.use(express.json()); // Ensure this middleware is used to parse JSON bodies.
app.use('/api', apiRouter);
app.use(router);

const port = 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
