import "dotenv/config";
import { createServer } from "http";
import { createApp } from "./app.js";
import { initSockets } from "./sockets/index.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = createApp();
const httpServer = createServer(app);
initSockets(httpServer);

httpServer.listen(PORT, () => {
  console.log(`InterviewLoop backend listening on http://localhost:${PORT}`);
});
