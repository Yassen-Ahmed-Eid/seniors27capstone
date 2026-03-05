import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. تحديد المسارات بشكل يضمن العمل على Vercel وجهازك
const dbPath = path.join(process.cwd(), "seniors27.db");
const SITES_DIR = path.join(process.cwd(), "sites");

// 2. محاولة إنشاء الفولدر فقط في حالة اللوكال لتجنب الانهيار أونلاين
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(SITES_DIR)) {
  fs.mkdirSync(SITES_DIR);
}

// 3. فتح قاعدة البيانات (للقراءة فقط أونلاين لتجنب الـ Error)
const db = new Database(dbPath, { 
  readonly: process.env.NODE_ENV === 'production' 
});

// Initialize database (فقط لو لوكال)
if (process.env.NODE_ENV !== 'production') {
    db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        config_path TEXT
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        team_id INTEGER,
        tag TEXT,
        value REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(team_id) REFERENCES teams(id)
      )
    `);
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// --- Helpers ---
const saveConfigToFile = (teamName: string, config: any) => {
    const safeName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filePath = path.join(SITES_DIR, `${safeName}.json`);
    // الكتابة مسموحة فقط لوكال
    if (process.env.NODE_ENV !== 'production') {
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    }
    return filePath;
};

const loadConfigFromFile = (filePath: string) => {
    if (filePath && fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return null;
};

// --- API Routes ---

app.get("/api/test", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
});

app.post("/api/register", (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: "Registration disabled online" });
    const { name, password } = req.body;
    const existing = db.prepare("SELECT id FROM teams WHERE name = ?").get(name);
    if (existing) return res.status(400).json({ error: "Team name already exists" });

    try {
        const defaultConfig = {
            theme: { primaryColor: "#10b981", fontFamily: "Inter", mode: "dark", preset: "nature" },
            content: {
                home: { title: `${name} Project`, description: "A smart agriculture initiative." },
                monitoring: { sensors: [{ id: "1", name: "Moisture", tag: "moisture", unit: "%" }] }
            }
        };
        const configPath = saveConfigToFile(name, defaultConfig);
        const stmt = db.prepare("INSERT INTO teams (name, password, config_path) VALUES (?, ?, ?)");
        const result = stmt.run(name, password, configPath);
        res.json({ id: result.lastInsertRowid, name, config: defaultConfig });
    } catch (e) { res.status(400).json({ error: "Registration failed" }); }
});

app.post("/api/login", (req, res) => {
    const { name, password } = req.body;
    const team = db.prepare("SELECT * FROM teams WHERE name = ? AND password = ?").get(name, password) as any;
    if (team) {
        const config = loadConfigFromFile(team.config_path);
        res.json({ id: team.id, name: team.name, config });
    } else { res.status(401).json({ error: "Invalid credentials" }); }
});

app.get("/api/sites", (req, res) => {
    const sites = db.prepare("SELECT id, name FROM teams").all();
    res.json(sites);
});

app.get("/api/sensor-data/:teamId", (req, res) => {
    const data = db.prepare("SELECT tag, value, timestamp FROM sensor_data WHERE team_id = ? ORDER BY timestamp DESC LIMIT 50").all(req.params.teamId);
    res.json(data);
});

// --- Middleware & Start ---

if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    app.listen(3000, () => console.log("Server running on http://localhost:3000"));
} else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
}

export default app;
