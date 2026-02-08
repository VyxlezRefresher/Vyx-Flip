const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let users = {};
let games = [];
let petValues = {
    "neon dragon": 500000,
    "shadow dragon": 1200000,
    "frost dragon": 800000,
    "bat dragon": 300000,
    "owl": 100000,
    // Add more pets...
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-game', (gameId) => {
        socket.join(gameId);
        io.to(gameId).emit('player-joined', socket.id);
    });
    
    socket.on('flip-result', (data) => {
        io.to(data.gameId).emit('game-result', data);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) return res.json({ error: 'User exists' });
    users[username] = { password: btoa(password), balance: 1000, pets: [], robloxId: username.hashCode() };
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (user && user.password === btoa(password)) {
        res.json({ success: true, user });
    } else {
        res.json({ error: 'Invalid credentials' });
    }
});

app.get('/api/pet-value/:pet', (req, res) => {
    const pet = req.params.pet.toLowerCase();
    res.json({ value: petValues[pet] || 10000 });
});

app.post('/api/add-pet', (req, res) => {
    const { username, petName } = req.body;
    const value = petValues[petName.toLowerCase()] || 10000;
    if (users[username]) {
        users[username].pets.push({ name: petName, value });
        users[username].balance += value;
        res.json({ success: true, value });
    } else {
        res.json({ error: 'User not found' });
    }
});

server.listen(3000, () => {
    console.log('Vyx Flip server on port 3000');
});
