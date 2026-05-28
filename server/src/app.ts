import express from 'express'
import { zodBadRequest } from './middlewares.js';
import { authRouter } from './modules/auth/auth.routes.js';
export const app = express();
const port = 3000;

app.use(express.json())

app.use("/auth", authRouter)

app.use(zodBadRequest)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
