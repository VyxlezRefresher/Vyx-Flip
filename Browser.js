const ws = new WebSocket("ws://localhost:3000");
let username = localStorage.getItem("vxUser");

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "login", username }));
};

ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);

  if (data.type === "balanceUpdate") {
    document.getElementById("user-balance").textContent = data.balance;
  }

  if (data.type === "queueUpdate") {
    // show waiting players
    console.log("Queue:", data.queue);
  }

  if (data.type === "coinflipResult") {
    alert(`Coinflip Result: ${data.result}`);
    document.getElementById("user-balance").textContent = data.newBalance;
  }

  if (data.type === "chat") {
    const chat = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = "chat-message";
    div.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
};

function joinCoinflip(betAmount) {
  ws.send(JSON.stringify({ type: "joinCoinflip", betAmount }));
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;
  ws.send(JSON.stringify({ type: "chat", message: msg }));
  input.value = "";
}
