import express from 'express'
import cors from 'cors'
import { zodBadRequest } from './middlewares.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { pollRouter } from './modules/poll/poll.routes.js';
export const app = express();
const port = 3000;

app.use(cors());
app.use(express.json())

app.use("/admin", adminRouter)
app.use("/polls", pollRouter)

app.use(zodBadRequest)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
