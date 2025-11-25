# 🗑️ Binlytics - Analytics at the Source

A software-only web application for simulating waste segregation, tracking waste readings, and calculating segregation scores using rule-based scoring.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [File Explanations](#file-explanations)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Binlytics is a hackathon project that helps track and analyze waste segregation data. It simulates waste readings from bins, stores them in a JSON file (using lowdb), and provides analytics through a React frontend.

**Key Features:**
- Enter waste readings manually (optional auto-fill demo button)
- View recent waste readings in a table
- See daily waste trends in bar charts
- Calculate segregation scores for bins
- View top performers and offenders

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework for building REST APIs
- **lowdb** - JSON file-based database (no MongoDB, no SQL!)
- **nanoid** - Generates unique IDs for readings
- **cors** - Enables cross-origin requests

### Frontend
- **React.js** - UI library
- **axios** - HTTP client for API calls
- **Recharts** - Charting library for visualizations
- **CSS** - Custom styling (no Tailwind)

## 📁 Project Structure

```
binlytics-demo/
│
├── backend/                    # Backend server code
│   ├── data/
│   │   └── db.json            # JSON database file (stores all waste readings)
│   ├── node_modules/          # Backend dependencies (auto-generated)
│   ├── package.json           # Backend dependencies list
│   └── server.js              # Main backend server file
│
├── frontend/                   # React frontend code
│   ├── public/                # Static files (HTML, images)
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── App.css            # Styles for the app
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Global styles
│   ├── node_modules/          # Frontend dependencies (auto-generated)
│   └── package.json           # Frontend dependencies list
│
└── README.md                  # This file!
```

## 🚀 Setup Instructions

### Prerequisites

Make sure you have these installed on your computer:
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) - Package manager
- **VS Code** (or any code editor) - [Download here](https://code.visualstudio.com/)

### Step 1: Install Backend Dependencies

1. Open VS Code
2. Open the terminal in VS Code (View → Terminal, or press `` Ctrl+` ``)
3. Navigate to the backend folder:
   ```bash
   cd backend
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
   This will install: express, lowdb, nanoid, cors, and nodemon

### Step 2: Install Frontend Dependencies

1. In the same terminal (or open a new one), navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   This will install: react, axios, recharts, and other React dependencies

### Step 3: Verify Installation

Check that these files exist:
- `backend/node_modules/` folder (should have many folders inside)
- `frontend/node_modules/` folder (should have many folders inside)
- `backend/data/db.json` (should contain `{"wasteReadings": []}`)

## ▶️ Running the Application

You need to run **two servers** at the same time:
1. **Backend server** (port 4000)
2. **Frontend server** (port 3000)

### Option A: Using Two Terminal Windows (Recommended for Beginners)

#### Terminal 1 - Backend Server:
1. Open terminal in VS Code
2. Navigate to backend:
   ```bash
   cd backend
   ```
3. Start the server:
   ```bash
   npm start
   ```
   You should see: `Binlytics backend listening on http://localhost:4000`

#### Terminal 2 - Frontend Server:
1. Open a **new terminal** in VS Code (Terminal → New Terminal)
2. Navigate to frontend:
   ```bash
   cd frontend
   ```
3. Start the React app:
   ```bash
   npm start
   ```
   This will automatically open your browser at `http://localhost:3000`

### Option B: Using VS Code Tasks (Advanced)

You can create tasks to run both servers at once. Ask if you want this setup!

## 🌐 Accessing the Application

Once both servers are running:
- **Frontend (UI)**: Open `http://localhost:3000` in your browser
- **Backend API**: Test at `http://localhost:4000` (should show a JSON message)

## 📡 API Endpoints

All API endpoints are prefixed with `/api`. Here's what each one does:

### 1. POST /api/waste
**Purpose**: Save a new waste reading

**Request Body**:
```json
{
  "binId": "BIN-001",
  "weightKg": 2.5,
  "moistureRaw": 650,
  "wasteTag": "organic"
}
```

**Response**: Returns the saved reading with ID and timestamp

---

### 2. GET /api/waste/recent
**Purpose**: Get the 50 most recent waste readings

**Response**: Array of readings sorted by latest first

---

### 3. GET /api/waste/daily?days=7
**Purpose**: Get daily aggregated data

**Query Parameters**:
- `days` (optional): Number of days to look back (default: 7, max: 30)

**Response**: Array of daily summaries:
```json
[
  {
    "date": "2024-01-15",
    "totalKg": 25.5,
    "avgMoisture": 620.3,
    "count": 10
  }
]
```

---

### 4. GET /api/bins/stats?days=7
**Purpose**: Get statistics grouped by bin ID

**Query Parameters**:
- `days` (optional): Number of days to look back (default: 7)

**Response**: Array of bin statistics with total weight, average moisture, etc.

---

### 5. GET /api/bins/score/:binId
**Purpose**: Calculate segregation score for a specific bin

**URL Parameters**:
- `binId`: The bin ID to calculate score for (e.g., `BIN-001`)

**Response**: Score and statistics for that bin

**Scoring Rules**:
- Starts at 100 points
- If avgMoisture > 750 → -30 points
- If avgMoisture > 600 → -15 points
- If avgWeight > 3kg → -20 points
- If avgWeight > 1.5kg → -7 points
- If samples > 15 → +5 points
- Final score is clamped between 0 and 100

---

### 6. GET /api/admin/top
**Purpose**: Get top 10 performers (high score) and top 10 offenders (low score)

**Response**:
```json
{
  "performers": [...],
  "offenders": [...]
}
```

## 📄 File Explanations

### Backend Files

#### `backend/server.js`
**What it does**: This is the main backend server file. It:
- Sets up Express server
- Connects to lowdb (JSON database)
- Defines all 6 API endpoints
- Handles data processing and calculations
- Runs on port 4000

**Key parts**:
- `db.defaults({ wasteReadings: [] })` - Initializes empty database
- Each `app.get()` or `app.post()` is an API endpoint
- Helper functions like `calculateScore()` do the math

#### `backend/data/db.json`
**What it does**: This is your database! It's just a JSON file that stores:
- All waste readings
- Each reading has: id, binId, weightKg, moistureRaw, wasteTag, timestamp

**Note**: This file is automatically created and updated by lowdb. Don't edit it manually!

#### `backend/package.json`
**What it does**: Lists all backend dependencies and scripts
- `npm start` runs the server
- `npm run dev` runs with auto-restart (if nodemon is installed)

---

### Frontend Files

#### `frontend/src/App.js`
**What it does**: The main React component. It:
- Displays the UI
- Makes API calls using axios
- Manages state (data storage)
- Handles user interactions (button clicks, form inputs)

**Key concepts**:
- `useState` - Stores data that changes (like recent readings)
- `useEffect` - Runs code when page loads (fetches data)
- `axios.get()` - Fetches data from backend
- `axios.post()` - Sends data to backend

#### `frontend/src/App.css`
**What it does**: All the styling for the app
- Colors, fonts, layouts
- Responsive design (works on mobile too)
- Card styles, button styles, table styles

#### `frontend/src/index.js`
**What it does**: Entry point for React
- Renders the App component into the HTML page

#### `frontend/public/index.html`
**What it does**: The HTML page that React renders into
- Contains the root `<div>` where React attaches

---

## ✨ Features

### 1. Submit Waste Reading
- Enter Bin ID, weight (kg), moisture value, and choose a waste tag
- Click "Save Reading"
- Data is saved exactly as entered (use the auto-fill button if you just want demo data)
- All charts, tables, and rankings refresh automatically

### 2. Get Segregation Score
- Enter a Bin ID
- Click "Get Score"
- Shows score (0-100) and statistics
- Score is calculated based on moisture, weight, and sample count

### 3. Daily Waste Chart
- Bar chart showing daily waste trends
- Displays total weight and average moisture
- Updates automatically when new readings are added

### 4. Recent Readings Table
- Shows the 50 most recent readings
- Displays: Bin ID, Weight, Moisture, Waste Tag, Timestamp
- Sorted by latest first

### 5. Top Performers & Offenders
- Two side-by-side lists
- Top 10 bins with highest scores (performers)
- Top 10 bins with lowest scores (offenders)

## 🐛 Troubleshooting

### Problem: "Cannot find module 'express'"
**Solution**: Run `npm install` in the backend folder

### Problem: "Cannot find module 'axios'"
**Solution**: Run `npm install` in the frontend folder

### Problem: Backend won't start
**Solution**: 
- Check if port 4000 is already in use
- Make sure you're in the `backend` folder when running `npm start`
- Check `backend/data/db.json` exists (create it manually if needed: `{"wasteReadings": []}`)

### Problem: Frontend can't connect to backend
**Solution**:
- Make sure backend is running on port 4000
- Check `frontend/src/App.js` - the `API_BASE_URL` should be `http://localhost:4000`
- Check browser console for errors (F12 → Console tab)

### Problem: "No readings found"
**Solution**: Add a few readings manually (or click "Auto-fill random sample" and then "Save Reading")

### Problem: Charts not showing
**Solution**: 
- Make sure you have data (push some readings)
- Check browser console for errors
- Verify recharts is installed: `npm list recharts` in frontend folder

## 📦 Creating a Zip File (For Submission)

1. **Exclude node_modules** (they're too large):
   - Delete `backend/node_modules` folder
   - Delete `frontend/node_modules` folder
   - (You can regenerate them with `npm install`)

2. **Create zip**:
   - Right-click the `binlytics-demo` folder
   - Select "Compress" or "Send to → Compressed folder"
   - Name it `binlytics-submission.zip`

3. **Include in README**:
   - Instructions to run `npm install` in both folders
   - This README file

## 🎓 Learning Resources

- **Express**: [expressjs.com](https://expressjs.com/)
- **React**: [react.dev](https://react.dev/)
- **lowdb**: [github.com/typicode/lowdb](https://github.com/typicode/lowdb)
- **Recharts**: [recharts.org](https://recharts.org/)

## 📝 Notes

- **No Database Required**: All data is stored in `backend/data/db.json`
- **Beginner Friendly**: Code has comments explaining what each part does
- **Local Only**: Runs entirely on your computer (localhost)
- **No Authentication**: This is a demo/hackathon project

## 🎉 You're All Set!

Follow the setup instructions above, run both servers, and start exploring Binlytics!

If you encounter any issues, check the Troubleshooting section or review the code comments.

---

**Built with ❤️ for Hackathon**

