import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './App.css';

// Base URL for API calls - change this if your backend runs on a different port
const API_BASE_URL = 'http://localhost:4000';
const WASTE_TAGS = ['organic', 'plastic', 'paper', 'metal', 'glass'];

function App() {
  // State variables to store data from API
  const [recentReadings, setRecentReadings] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [topOffenders, setTopOffenders] = useState([]);

  // Form inputs for manual reading submission
  const [binId, setBinId] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [moistureInput, setMoistureInput] = useState('');
  const [wasteTagInput, setWasteTagInput] = useState(WASTE_TAGS[0]);

  // Score lookup state
  const [scoreData, setScoreData] = useState(null);
  const [scoreBinId, setScoreBinId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch recent readings when component loads
  useEffect(() => {
    fetchRecentReadings();
    fetchDailyData();
    fetchTopData();
  }, []);

  // Function to fetch recent 50 waste readings
  const fetchRecentReadings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/waste/recent`);
      setRecentReadings(response.data);
    } catch (err) {
      setError('Failed to fetch recent readings');
      console.error(err);
    }
  };

  // Function to fetch daily aggregated data
  const fetchDailyData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/waste/daily?days=7`);
      setDailyData(response.data);
    } catch (err) {
      setError('Failed to fetch daily data');
      console.error(err);
    }
  };

  // Function to fetch top performers and offenders
  const fetchTopData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/top`);
      setTopPerformers(response.data.performers);
      setTopOffenders(response.data.offenders);
    } catch (err) {
      setError('Failed to fetch top data');
      console.error(err);
    }
  };

  // Prefill the form with demo values (helpful for testing)
  const fillRandomValues = () => {
    setBinId((prev) => prev || `BIN-${Math.floor(Math.random() * 900 + 100)}`);
    setWeightInput((Math.random() * 5).toFixed(2));
    setMoistureInput(String(Math.floor(Math.random() * 1000)));
    setWasteTagInput(WASTE_TAGS[Math.floor(Math.random() * WASTE_TAGS.length)]);
    setError('');
  };

  // Function to push a manual waste reading
  const submitReading = async () => {
    if (!binId.trim() || !weightInput.trim() || !moistureInput.trim()) {
      setError('Please fill Bin ID, weight, and moisture before saving.');
      return;
    }

    const weight = parseFloat(weightInput);
    const moisture = parseFloat(moistureInput);

    if (!Number.isFinite(weight) || !Number.isFinite(moisture)) {
      setError('Weight and moisture must be valid numbers.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/api/waste`, {
        binId: binId.trim(),
        weightKg: Number(weight.toFixed(2)),
        moistureRaw: Math.round(moisture),
        wasteTag: wasteTagInput,
      });

      // Refresh data after adding new reading
      fetchRecentReadings();
      fetchDailyData();
      fetchTopData();
      setBinId('');
      setWeightInput('');
      setMoistureInput('');
      setWasteTagInput(WASTE_TAGS[0]);
    } catch (err) {
      setError('Failed to save reading: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Function to get segregation score for a bin
  const getScore = async () => {
    if (!scoreBinId.trim()) {
      setError('Please enter a Bin ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/bins/score/${scoreBinId.trim()}`);
      setScoreData(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No readings found for that Bin ID');
      } else {
        setError('Failed to get score: ' + (err.response?.data?.error || err.message));
      }
      setScoreData(null);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🗑️ Binlytics</h1>
        <p className="tagline">Analytics at the Source</p>
      </header>

      <div className="container">
        {/* Error message display */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Section 1: Manual waste reading submission */}
        <section className="card">
          <h2>📝 Submit Waste Reading</h2>
          <p className="section-subtitle">
            Enter the actual measurements below. Use the auto-fill button if you just want demo data.
          </p>
          <div className="form-grid">
            <label>
              <span>Bin ID</span>
              <input
                type="text"
                placeholder="BIN-001"
                value={binId}
                onChange={(e) => setBinId(e.target.value)}
                disabled={loading}
              />
            </label>
            <label>
              <span>Weight (kg)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 2.35"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                disabled={loading}
              />
            </label>
            <label>
              <span>Moisture (raw)</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g., 650"
                value={moistureInput}
                onChange={(e) => setMoistureInput(e.target.value)}
                disabled={loading}
              />
            </label>
            <label>
              <span>Waste Tag</span>
              <select
                value={wasteTagInput}
                onChange={(e) => setWasteTagInput(e.target.value)}
                disabled={loading}
              >
                {WASTE_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={fillRandomValues}
              disabled={loading}
            >
              Auto-fill random sample
            </button>
            <button onClick={submitReading} disabled={loading}>
              {loading ? 'Saving...' : 'Save Reading'}
            </button>
          </div>
        </section>

        {/* Section 2: Get Segregation Score */}
        <section className="card">
          <h2>📊 Get Segregation Score</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter Bin ID to check score"
              value={scoreBinId}
              onChange={(e) => setScoreBinId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && getScore()}
              disabled={loading}
            />
            <button onClick={getScore} disabled={loading || !scoreBinId.trim()}>
              {loading ? 'Loading...' : 'Get Score'}
            </button>
          </div>

          {scoreData && (
            <div className="score-display">
              <div className="score-circle">
                <span className="score-value">{scoreData.score}</span>
                <span className="score-label">/ 100</span>
              </div>
              <div className="score-details">
                <p><strong>Bin ID:</strong> {scoreData.binId}</p>
                <p><strong>Total Weight:</strong> {scoreData.totalKg.toFixed(2)} kg</p>
                <p><strong>Average Weight:</strong> {scoreData.avgWeight.toFixed(2)} kg</p>
                <p><strong>Average Moisture:</strong> {scoreData.avgMoisture.toFixed(2)}</p>
                <p><strong>Total Entries:</strong> {scoreData.entries}</p>
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Daily Waste Chart */}
        <section className="card">
          <h2>📈 Daily Waste Overview (Last 7 Days)</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalKg" fill="#8884d8" name="Total Weight (kg)" />
                <Bar dataKey="avgMoisture" fill="#82ca9d" name="Avg Moisture" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No data available. Save some readings first!</p>
          )}
        </section>

        {/* Section 4: Recent Readings Table */}
        <section className="card">
          <h2>📋 Recent Waste Readings (Latest 50)</h2>
          {recentReadings.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Bin ID</th>
                    <th>Weight (kg)</th>
                    <th>Moisture</th>
                    <th>Waste Tag</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReadings.map((reading) => (
                    <tr key={reading.id}>
                      <td>{reading.binId}</td>
                      <td>{reading.weightKg.toFixed(2)}</td>
                      <td>{reading.moistureRaw}</td>
                      <td><span className="tag">{reading.wasteTag}</span></td>
                      <td>{formatTimestamp(reading.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No readings yet. Save some readings to see them here!</p>
          )}
        </section>

        {/* Section 5: Top Performers and Offenders */}
        <div className="two-columns">
          <section className="card">
            <h2>🏆 Top 10 Performers</h2>
            {topPerformers.length > 0 ? (
              <div className="list-container">
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th>Bin ID</th>
                      <th>Score</th>
                      <th>Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((bin, index) => (
                      <tr key={bin.binId}>
                        <td>{bin.binId}</td>
                        <td><span className="score-badge high">{bin.score}</span></td>
                        <td>{bin.entries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No data available</p>
            )}
          </section>

          <section className="card">
            <h2>⚠️ Top 10 Offenders</h2>
            {topOffenders.length > 0 ? (
              <div className="list-container">
                <table className="compact-table">
                  <thead>
                    <tr>
                      <th>Bin ID</th>
                      <th>Score</th>
                      <th>Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topOffenders.map((bin, index) => (
                      <tr key={bin.binId}>
                        <td>{bin.binId}</td>
                        <td><span className="score-badge low">{bin.score}</span></td>
                        <td>{bin.entries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No data available</p>
            )}
          </section>
        </div>
      </div>

      <footer className="app-footer">
        <p>Binlytics - Analytics at the Source | Built for Hackathon</p>
      </footer>
    </div>
  );
}

export default App;
