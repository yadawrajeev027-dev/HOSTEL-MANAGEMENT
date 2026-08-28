require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auto-seed if database is empty or users empty
if (db.find('users').length === 0) {
  console.log('Database empty on startup. Running initial seed...');
  require('./seed');
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/outpasses', require('./routes/outpasses'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/callbooth', require('./routes/callbooth'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/students', require('./routes/students'));
app.use('/api/wardens', require('./routes/wardens'));
app.use('/api/hostels', require('./routes/hostels'));
app.use('/api/allotment', require('./routes/allotment'));
app.use('/api/speech', require('./routes/deepgram'));
app.use('/api/twilio', require('./routes/twilio'));
app.use('/api/agent', require('./routes/agent'));

// Reset database route for easy demo reset
app.post('/api/reset', (req, res) => {
  require('./seed');
  res.json({ success: true, message: 'Database reset to initial demo state' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    usersCount: db.find('users').length,
    outpassesCount: db.find('outpasses').length,
    complaintsCount: db.find('complaints').length,
    callRequestsCount: db.find('callRequests').length
  });
});

// Handle unhandled /api requests cleanly with JSON 404
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint '${req.method} ${req.url}' not found` });
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const http = require('http');
const { WebSocketServer } = require('ws');
const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const fs = require('fs');

wss.on('connection', (ws, req) => {
  if (req.url && req.url.startsWith('/api/speech/live')) {
    const log = (msg) => fs.appendFileSync('proxy.log', `[${new Date().toISOString()}] ${msg}\n`);
    log('New frontend connection');

    const apiKey = process.env.DEEPGRAM_API_KEY ? process.env.DEEPGRAM_API_KEY.trim() : null;
    if (!apiKey) {
      log('No API key found');
      ws.close();
      return;
    }

    const deepgram = createClient(apiKey);
    const dgLive = deepgram.listen.live({ 
      model: 'nova-2', 
      smart_format: true 
    });

    let keepAlive;
    let dgReady = false;
    const messageBuffer = [];
    let totalBytesSent = 0;

    ws.on('message', (data) => {
      if (dgReady && dgLive.getReadyState() === 1) {
        dgLive.send(data);
        totalBytesSent += data.length;
      } else {
        messageBuffer.push(data);
        log(`Buffered chunk of size ${data.length}`);
      }
    });

    dgLive.addListener(LiveTranscriptionEvents.Open, () => {
      dgReady = true;
      log('Deepgram Open. Flushing ' + messageBuffer.length + ' chunks.');
      
      messageBuffer.forEach((data) => {
        if (dgLive.getReadyState() === 1) {
          dgLive.send(data);
          totalBytesSent += data.length;
        }
      });
      messageBuffer.length = 0;

      keepAlive = setInterval(() => {
        if (dgLive.getReadyState() === 1) {
          dgLive.keepAlive();
        }
      }, 10 * 1000);
    });

    dgLive.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      const text = data.channel?.alternatives?.[0]?.transcript;
      if (text) log(`Deepgram Transcript: "${text}" (is_final: ${data.is_final})`);
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(data));
      }
    });

    dgLive.addListener(LiveTranscriptionEvents.Error, (err) => {
      log('Deepgram Error: ' + err.message);
      console.error('Deepgram Live Error:', err);
    });

    ws.on('close', () => {
      log(`Frontend WS closed. Total bytes sent to DG: ${totalBytesSent}`);
      clearInterval(keepAlive);
      dgLive.finish();
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Hostel Management API server running on http://localhost:${PORT}`);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
  server.close(() => console.log('Server terminated'));
});
