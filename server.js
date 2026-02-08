import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("public"));

let users = {}; 
let coinflipQueue = [];

wss.on("connection", ws => {
  ws.on("message", msg => {
    const data = JSON.parse(msg);

    if(data.type === "login"){
      users[data.username] = users[data.username] || { balance: 0 };
      ws.username = data.username;
      ws.send(JSON.stringify({ type: "loginSuccess", balance: users[data.username].balance }));
    }

    if(data.type === "joinCoinflip"){
      coinflipQueue.push({ username: ws.username, bet: data.betAmount, ws });
      broadcastQueue();

      if(coinflipQueue.length >= 2) runCoinflip();
    }

    if(data.type === "chat"){
      broadcast({ type: "chat", username: ws.username, message: data.message });
    }
  });

  ws.on("close", () => {
    coinflipQueue = coinflipQueue.filter(p => p.ws !== ws);
    broadcastQueue();
  });
});

function broadcast(msg){
  wss.clients.forEach(c => {
    if(c.readyState === 1) c.send(JSON.stringify(msg));
  });
}

function broadcastQueue(){
  broadcast({ type: "queueUpdate", queue: coinflipQueue.map(p=>({ username:p.username, bet:p.bet })) });
}

function runCoinflip(){
  const [p1,p2] = coinflipQueue.splice(0,2);
  const winner = Math.random()<0.5?p1:p2;
  const loser = winner===p1?p2:p1;

  users[winner.username].balance += loser.bet;
  users[loser.username].balance -= loser.bet;

  winner.ws.send(JSON.stringify({ type:"coinflipResult", result:"Winner", newBalance: users[winner.username].balance }));
  loser.ws.send(JSON.stringify({ type:"coinflipResult", result:"Loser", newBalance: users[loser.username].balance }));

  broadcastQueue();
}

server.listen(process.env.PORT || 3000, ()=>console.log("Server running"));
