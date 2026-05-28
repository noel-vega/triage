import express from 'express'
import cors from 'cors'
import { zodBadRequest } from './middlewares.js';
import { pollsRouter } from './modules/polls/polls.routes.js';
export const app = express();
const port = 3000;

app.use(cors());
app.use(express.json())

app.use("/polls", pollsRouter)

app.use(zodBadRequest)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
