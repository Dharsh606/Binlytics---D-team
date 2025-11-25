# 🚀 Binlytics - Quick Start Guide

## ⚡ Fast Setup (5 minutes)

### Step 1: Install Dependencies

**Open Terminal 1 (Backend):**
```bash
cd backend
npm install
```

**Open Terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

### Step 2: Start Servers

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```
✅ You should see: `Binlytics backend listening on http://localhost:4000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
```
✅ Browser will open automatically at `http://localhost:3000`

### Step 3: Use the App!

1. **Save a Reading**: Enter Bin ID, weight (kg), moisture value, choose waste tag, then click "Save Reading" (use the auto-fill button if you just want demo data)
2. **Get Score**: Enter any Bin ID that has readings and click "Get Score"
3. **View Charts**: Scroll down to see daily waste chart
4. **See Rankings**: Check Top Performers and Top Offenders

## 🎯 What Each Button Does

| Button | What It Does |
|--------|-------------|
| **Save Reading** | Stores exactly what you typed into Binlytics |
| **Auto-fill random sample** | Fills the form with demo values (optional) |
| **Get Score** | Calculates segregation score (0-100) for a bin |
| **Auto-refresh** | All data updates automatically after saving readings |

## 📊 Understanding the Score

- **100 points** = Perfect segregation
- **80-99 points** = Good
- **50-79 points** = Needs improvement
- **0-49 points** = Poor segregation

**Score is calculated based on:**
- Moisture levels (lower is better)
- Weight per reading (lighter is better)
- Number of samples (more is better)

## 🐛 Common Issues

**"Cannot connect to backend"**
→ Make sure backend is running on port 4000

**"No data available"**
→ Add a few readings manually (or click "Auto-fill random sample" and then "Save Reading")

**Port already in use**
→ Close other applications using ports 3000 or 4000

## 📝 Next Steps

- Read the full README.md for detailed explanations
- Check the code comments in `backend/server.js` and `frontend/src/App.js`
- Experiment with different Bin IDs
- Push multiple readings to see trends

---

**Happy Hacking! 🎉**

