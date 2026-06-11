require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const tasksRouter = require('./routes/tasks');

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/health - liveness + DB connectivity check
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/tasks', tasksRouter);

const port = process.env.PORT || 3000;

async function start() {
  // RDS may not accept connections immediately on first boot; retry instead of crashing
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established');
      break;
    } catch (err) {
      console.log(`DB connection attempt ${attempt} failed (${err.message}), retrying in 5s...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  await sequelize.sync();
  app.listen(port, () => console.log(`API listening on port ${port}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
