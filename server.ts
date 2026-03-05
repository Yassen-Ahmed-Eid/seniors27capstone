import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. تحديد المسارات بشكل يضمن العمل أونلاين ولوكال
const dbPath = path.join(process.cwd(), "seniors27.db");
const SITES_DIR = path.join(process.cwd(), "sites");

// 2. إنشاء الفولدر فقط لوكال (أونلاين ممنوع الكتابة)
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(SITES_DIR)) {
    fs.mkdirSync(SITES_DIR);
}

// 3. فتح قاعدة البيانات (للقراءة فقط أونلاين لتجنب الانهيار)
const db = new Database(dbPath, { 
    readonly: process.env.NODE_ENV === 'production' 
});

const app = express();
app.use(express.json({ limit: '10mb' }));

// --- Helpers ---
const saveConfigToFile = (teamName: string, config: any) => {
    const safeName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filePath = path.join(SITES_DIR, `${safeName}.json`);
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
    res.json({ status: "Backend is working!", mode: process.env.NODE_ENV });
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

app.get("/api/sensor-data/:teamId", (req, res) => {
    const data = db.prepare("SELECT tag, value, timestamp FROM sensor_data WHERE team_id = ? ORDER BY timestamp DESC LIMIT 50").all(req.params.teamId);
    res.json(data);
});

// --- Logic لتشغيل السيرفر ---

if (process.env.NODE_ENV !== "production") {
    // لوكال: بنستخدم Vite للمساعدة
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    app.listen(3000, () => console.log("Local server: http://localhost:3000"));
} else {
    // أونلاين: بنعرض الملفات اللي اتعملها Build
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
}

export default app; // السطر ده الأهم لـ Vercel
