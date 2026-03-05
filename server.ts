import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("seniors27.db");
const SITES_DIR = path.join(__dirname, "sites");

if (!fs.existsSync(SITES_DIR)) {
  fs.mkdirSync(SITES_DIR);
}

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    config_path TEXT
  )
`);

// Migration: Add config_path if it doesn't exist
try {
  const columns = db.prepare("PRAGMA table_info(teams)").all() as any[];
  const hasConfigPath = columns.some(col => col.name === 'config_path');
  if (!hasConfigPath) {
    db.exec("ALTER TABLE teams ADD COLUMN config_path TEXT");
  }
} catch (e) {
  console.error("Migration failed:", e);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS sensor_data (
    team_id INTEGER,
    tag TEXT,
    value REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(team_id) REFERENCES teams(id)
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const saveConfigToFile = (teamName: string, config: any) => {
    const safeName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filePath = path.join(SITES_DIR, `${safeName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    return filePath;
  };

  const loadConfigFromFile = (filePath: string) => {
    if (filePath && fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return null;
  };

  // API Routes
  app.post("/api/register", (req, res) => {
    const { name, password } = req.body;

    // Check if team already exists to avoid SqliteError: UNIQUE constraint failed
    const existing = db.prepare("SELECT id FROM teams WHERE name = ?").get(name);
    if (existing) {
      return res.status(400).json({ error: "Team name already exists" });
    }

    try {
      const defaultConfig = {
        theme: {
          primaryColor: "#10b981",
          fontFamily: "Inter",
          mode: "dark",
          preset: "nature"
        },
        content: {
          logo: "",
          home: { title: `${name} Project`, description: "A smart agriculture initiative." },
          about: { text: "Our project focuses on sustainable farming practices using modern technology." },
          problem: { text: "Water scarcity and soil degradation are major challenges in modern agriculture." },
          solution: { text: "We provide real-time monitoring and automated irrigation systems." },
          monitoring: { 
            text: "Real-time sensor data from our Arduino system.",
            sensors: [
              { id: "1", name: "Soil Moisture", icon: "Droplets", tag: "moisture", unit: "%" },
              { id: "2", name: "Temperature", icon: "Thermometer", tag: "temp", unit: "°C" }
            ],
            actuators: [],
            calibration: [],
            database: [],
            connectionType: "wifi"
          },
          team: [],
          contact: { email: "", social: "" }
        }
      };
      
      const configPath = saveConfigToFile(name, defaultConfig);
      const stmt = db.prepare("INSERT INTO teams (name, password, config_path) VALUES (?, ?, ?)");
      const result = stmt.run(name, password, configPath);
      res.json({ id: result.lastInsertRowid, name, config: defaultConfig });
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: "Team name already exists" });
    }
  });

  // Arduino Data Endpoint
  app.post("/api/sensor-update", (req, res) => {
    const { teamId, password, data } = req.body;
    const team = db.prepare("SELECT id FROM teams WHERE id = ? AND password = ?").get(teamId, password);
    if (!team) return res.status(401).json({ error: "Unauthorized" });

    const insert = db.prepare("INSERT INTO sensor_data (team_id, tag, value) VALUES (?, ?, ?)");
    const transaction = db.transaction((updates) => {
      for (const [tag, value] of Object.entries(updates)) {
        insert.run(teamId, tag, value);
      }
    });
    transaction(data);
    res.json({ success: true });
  });

  app.get("/api/sensor-data/:teamId", (req, res) => {
    const data = db.prepare(`
      SELECT tag, value, timestamp 
      FROM sensor_data 
      WHERE team_id = ? 
      AND timestamp >= datetime('now', '-7 days')
      ORDER BY timestamp DESC
    `).all(req.params.teamId);
    res.json(data);
  });

  app.post("/api/ai-analyze", async (req, res) => {
    const { sensorData, config } = req.body;
    // This will be called from the frontend using the Gemini SDK directly as per guidelines
    // But I'll provide a helper if they want server-side, though guidelines say "Always call Gemini API from the frontend"
    // Wait, the guidelines say: "Always call Gemini API from the frontend code of the application. NEVER call Gemini API from the backend."
    // So I will implement the AI logic in the frontend App.tsx.
    res.status(400).json({ error: "Gemini API should be called from the frontend per guidelines." });
  });

  app.post("/api/login", (req, res) => {
    const { name, password } = req.body;
    const team = db.prepare("SELECT * FROM teams WHERE name = ? AND password = ?").get(name, password) as any;
    if (team) {
      const config = loadConfigFromFile(team.config_path);
      res.json({ id: team.id, name: team.name, config });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/sites", (req, res) => {
    const sites = db.prepare("SELECT id, name FROM teams").all();
    res.json(sites);
  });

  app.get("/api/site/:name", (req, res) => {
    const team = db.prepare("SELECT * FROM teams WHERE name = ?").get(req.params.name) as any;
    if (team) {
      const config = loadConfigFromFile(team.config_path);
      res.json({ id: team.id, name: team.name, config });
    } else {
      res.status(404).json({ error: "Site not found" });
    }
  });

  app.put("/api/site/:id", (req, res) => {
    const { config } = req.body;
    const team = db.prepare("SELECT name FROM teams WHERE id = ?").get(req.params.id) as any;
    if (team) {
      const configPath = saveConfigToFile(team.name, config);
      const stmt = db.prepare("UPDATE teams SET config_path = ? WHERE id = ?");
      stmt.run(configPath, req.params.id);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  });

  app.delete("/api/site/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const team = db.prepare("SELECT name, config_path FROM teams WHERE id = ?").get(id) as any;
    if (team) {
      if (team.config_path && fs.existsSync(team.config_path)) {
        try {
          fs.unlinkSync(team.config_path);
        } catch (e) {
          console.error("Failed to delete config file:", e);
        }
      }
      db.prepare("DELETE FROM sensor_data WHERE team_id = ?").run(id);
      db.prepare("DELETE FROM teams WHERE id = ?").run(id);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Team not found" });
    }
  });

  // API 404 Handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
const app = express();
app.use(express.json({ limit: '10mb' }));

// ... حط هنا كل الـ Routes بتاعتك (app.get, app.post) ...

// السطر ده هو "السحر" اللي بيخليه يشتغل لوكال وأونلاين
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Server ready on port 3000'));
}

export default app; // ده اللي Vercel بيحتاجه عشان يشغل الباك اند
