import express from 'express';
import  { apiRouter } from './routes/index.js';

const app = express();

app.get('/');
app.use(express.json()); // Ensure this middleware is used to parse JSON bodies.
app.use('/api', apiRouter);

const port = 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

export default app;