/**
 * Binlytics Backend Server
 * 
 * This file creates a REST API server using Express.js
 * It stores data in a JSON file (db.json) using lowdb
 * No MongoDB, no SQL - just a simple JSON file!
 */

// Import required libraries
const express = require('express');        // Web framework for building APIs
const cors = require('cors');              // Allows frontend to call this API
const path = require('path');              // Helps with file paths
const { nanoid } = require('nanoid');     // Generates unique IDs
const low = require('lowdb');             // JSON file database
const FileSync = require('lowdb/adapters/FileSync'); // File adapter for lowdb

// Set up the database file path
// This points to backend/data/db.json
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Initialize database with empty array if it doesn't exist
// This creates the structure: { wasteReadings: [] }
db.defaults({ wasteReadings: [] }).write();

// Create Express app
const app = express();

// Middleware - these run before every request
app.use(cors());              // Allow cross-origin requests (frontend can call backend)
app.use(express.json());     // Parse JSON request bodies

// Server will run on port 4000 (or whatever PORT environment variable says)
const PORT = process.env.PORT || 4000;

/**
 * Helper function: Convert a value to a number
 * Returns null if it's not a valid number
 */
const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Helper function: Parse days parameter from query string
 * Defaults to 7 days, max 30 days
 */
const parseDays = (value, defaultDays = 7) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return defaultDays;
  }
  return Math.min(parsed, 30); // Cap at 30 days
};

/**
 * Helper function: Filter readings by number of days
 * Returns only readings from the last N days
 */
const filterReadingsByDays = (days) => {
  const all = db.get('wasteReadings').value();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000; // Calculate cutoff timestamp
  return all.filter((entry) => new Date(entry.timestamp).getTime() >= cutoff);
};

/**
 * Helper function: Group readings by date and calculate daily totals
 * Returns array of daily summaries: { date, totalKg, avgMoisture, count }
 */
const aggregateByDate = (readings) => {
  const dailyMap = {};
  
  // Loop through each reading and group by date
  readings.forEach((entry) => {
    const dateKey = new Date(entry.timestamp).toISOString().slice(0, 10); // Get YYYY-MM-DD
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { date: dateKey, totalKg: 0, totalMoisture: 0, count: 0 };
    }
    dailyMap[dateKey].totalKg += entry.weightKg;
    dailyMap[dateKey].totalMoisture += entry.moistureRaw;
    dailyMap[dateKey].count += 1;
  });

  // Convert object to array and calculate averages
  return Object.values(dailyMap)
    .map((item) => ({
      date: item.date,
      totalKg: Number(item.totalKg.toFixed(2)),
      avgMoisture: item.count ? Number((item.totalMoisture / item.count).toFixed(2)) : 0,
      count: item.count,
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date, newest first
};

/**
 * Helper function: Group readings by binId and calculate statistics
 * Returns array of bin stats: { binId, totalKg, avgWeight, avgMoisture, entries }
 */
const aggregateByBin = (readings) => {
  const binMap = {};
  
  // Loop through readings and group by binId
  readings.forEach((entry) => {
    if (!binMap[entry.binId]) {
      binMap[entry.binId] = {
        binId: entry.binId,
        totalKg: 0,
        totalMoisture: 0,
        entries: 0,
      };
    }
    binMap[entry.binId].totalKg += entry.weightKg;
    binMap[entry.binId].totalMoisture += entry.moistureRaw;
    binMap[entry.binId].entries += 1;
  });

  // Convert to array and calculate averages
  return Object.values(binMap).map((bin) => ({
    ...bin,
    avgWeight: bin.entries ? Number((bin.totalKg / bin.entries).toFixed(2)) : 0,
    avgMoisture: bin.entries ? Number((bin.totalMoisture / bin.entries).toFixed(2)) : 0,
  }));
};

/**
 * Helper function: Clamp score between 0 and 100
 */
const clampScore = (value) => Math.min(100, Math.max(0, Math.round(value)));

/**
 * Calculate segregation score based on rules:
 * - Start at 100 points
 * - If avgMoisture > 750 → -30 points
 * - If avgMoisture > 600 → -15 points
 * - If avgWeight > 3kg → -20 points
 * - If avgWeight > 1.5kg → -7 points
 * - If samples > 15 → +5 points
 * - Final score clamped between 0 and 100
 */
const calculateScore = ({ avgMoisture = 0, avgWeight = 0, entries = 0 }) => {
  let score = 100;

  // Penalty for high moisture
  if (avgMoisture > 750) {
    score -= 30;
  } else if (avgMoisture > 600) {
    score -= 15;
  }

  // Penalty for heavy bins
  if (avgWeight > 3) {
    score -= 20;
  } else if (avgWeight > 1.5) {
    score -= 7;
  }

  // Bonus for many samples (more data = better)
  if (entries > 15) {
    score += 5;
  }

  return clampScore(score);
};

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET / - Health check endpoint
 * Just returns a message to confirm the API is running
 */
app.get('/', (req, res) => {
  res.json({ message: 'Binlytics API is running 🚀' });
});

/**
 * POST /api/waste
 * Save a new waste reading
 * 
 * Request body: { binId, weightKg, moistureRaw, wasteTag }
 * Response: The saved reading with id and timestamp
 */
app.post('/api/waste', (req, res) => {
  const { binId, weightKg, moistureRaw, wasteTag } = req.body || {};

  // Validate required fields
  if (!binId || !wasteTag) {
    return res.status(400).json({ error: 'binId and wasteTag are required.' });
  }

  // Parse and validate numbers
  const weight = parseNumber(weightKg);
  const moisture = parseNumber(moistureRaw);

  if (weight === null || moisture === null) {
    return res.status(400).json({ error: 'weightKg and moistureRaw must be numbers.' });
  }

  // Create new entry with unique ID and timestamp
  const newEntry = {
    id: nanoid(),                              // Generate unique ID
    binId: String(binId),
    weightKg: weight,
    moistureRaw: moisture,
    wasteTag: String(wasteTag),
    timestamp: new Date().toISOString(),       // Current time in ISO format
  };

  // Save to database
  db.get('wasteReadings').push(newEntry).write();
  return res.status(201).json(newEntry);
});

/**
 * GET /api/waste/recent
 * Get the 50 most recent waste readings
 * Sorted by timestamp, newest first
 */
app.get('/api/waste/recent', (req, res) => {
  const recent = db
    .get('wasteReadings')
    .orderBy(['timestamp'], ['desc'])  // Sort by timestamp descending (newest first)
    .take(50)                          // Take only first 50
    .value();
  res.json(recent);
});

/**
 * GET /api/waste/daily?days=7
 * Get daily aggregated data
 * 
 * Query parameter: days (optional, default: 7, max: 30)
 * Returns: Array of { date, totalKg, avgMoisture, count }
 */
app.get('/api/waste/daily', (req, res) => {
  const days = parseDays(req.query.days);
  const filtered = filterReadingsByDays(days);
  const daily = aggregateByDate(filtered);
  res.json(daily);
});

/**
 * GET /api/bins/stats?days=7
 * Get statistics grouped by bin ID
 * 
 * Query parameter: days (optional, default: 7)
 * Returns: Array of bin statistics
 */
app.get('/api/bins/stats', (req, res) => {
  const days = parseDays(req.query.days);
  const filtered = filterReadingsByDays(days);
  const binStats = aggregateByBin(filtered).sort((a, b) => b.entries - a.entries);
  res.json(binStats);
});

/**
 * GET /api/bins/score/:binId
 * Calculate segregation score for a specific bin
 * 
 * URL parameter: binId (e.g., /api/bins/score/BIN-001)
 * Returns: Score and statistics for that bin
 */
app.get('/api/bins/score/:binId', (req, res) => {
  const { binId } = req.params;
  
  // Get all readings for this bin
  const all = db.get('wasteReadings').filter({ binId }).value();

  if (!all.length) {
    return res.status(404).json({ error: 'No readings found for that bin.' });
  }

  // Calculate statistics and score
  const [stats] = aggregateByBin(all);
  const score = calculateScore(stats);
  res.json({ ...stats, score });
});

/**
 * GET /api/admin/top
 * Get top 10 performers (high score) and top 10 offenders (low score)
 * 
 * Returns: { performers: [...], offenders: [...] }
 */
app.get('/api/admin/top', (req, res) => {
  // Get all bins with their scores
  const stats = aggregateByBin(db.get('wasteReadings').value()).map((bin) => ({
    ...bin,
    score: calculateScore(bin),
  }));

  // Sort by score: highest first (performers), lowest first (offenders)
  const performers = [...stats].sort((a, b) => b.score - a.score).slice(0, 10);
  const offenders = [...stats].sort((a, b) => a.score - b.score).slice(0, 10);

  res.json({ performers, offenders });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Binlytics backend listening on http://localhost:${PORT}`);
});
