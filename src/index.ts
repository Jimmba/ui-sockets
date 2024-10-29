import { config } from "dotenv";
config();
import { startServer } from "./server";
import { startApplication } from "./application";
import {
  HTTP_MESSAGES,
  SERVER_MESSAGES,
  WEBSOCKET_MESSAGES,
} from "./constants";

const APPLICATION_PORT = parseInt(process.env.APPLICATION_PORT || "8181", 10);
const SERVER_PORT = parseInt(process.env.SERVER_PORT || "3000", 10);

const wss = startServer(SERVER_PORT);
const server = startApplication(APPLICATION_PORT);

const shutdown = () => {
  console.warn(SERVER_MESSAGES.SHUTDOWN);

  wss.clients.forEach((ws) => {
    ws.terminate();
  });

  wss.close((err) => {
    if (err) {
      console.error(WEBSOCKET_MESSAGES.ERROR, err);
    } else {
      console.warn(WEBSOCKET_MESSAGES.CLOSED);
    }

    server.close((err) => {
      if (err) {
        console.error(HTTP_MESSAGES.ERROR, err);
      } else {
        console.warn(HTTP_MESSAGES.CLOSED);
      }
      process.exit(0);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
