import express from "express";
import http from "http";
import WebSocket from "ws";
import websocketConnection from "./lib/ws";

const main = async () => {
  const app = express();
  const server = http.createServer(app);
  const websocket = new WebSocket.Server({ server });

  await websocketConnection(websocket);

  const port = 3000;
  server.listen(port, () => {
    console.log(`Server started on port ${port}`);
  })
}

export default main;