/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Eye, 
  Trash2, 
  LogOut, 
  Home, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Users, 
  Mail,
  Palette,
  Type,
  Image as ImageIcon,
  Save,
  ChevronRight,
  Menu,
  X,
  Droplets,
  Thermometer,
  Sun,
  Wind,
  Zap,
  Cloud,
  Waves,
  Sprout,
  Leaf,
  Bug,
  Gauge,
  Brain,
  Lock,
  Unlock,
  RefreshCw,
  Database as DbIcon,
  Settings2,
  LineChart,
  FlaskConical,
  Power,
  ArrowLeft,
  Download,
  Link as LinkIcon,
  Play,
  FileText,
  Moon,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface SensorConfig {
  id: string;
  name: string;
  icon: string;
  tag: string;
  unit: string;
}

interface ActuatorConfig {
  id: string;
  name: string;
  tag: string;
  icon: string;
}

interface CalibrationData {
  sensorId: string;
  method: string;
  curve: string;
  data: string;
}

interface DatabaseEntry {
  id: string;
  type: 'plant' | 'fish';
  name: string;
  idealTemp: string;
  idealHumidity?: string;
  idealPh?: string;
  idealOxygen?: string;
}

interface TeamConfig {
  theme: {
    primaryColor: string;
    fontFamily: string;
    mode: 'light' | 'dark' | 'glass';
    preset?: string;
    geminiKey?: string;
  };
  content: {
    logo?: string;
    home: { 
      title: string; 
      description: string; 
      heroImage?: string;
      videoLink?: string;
      portfolioLink?: string;
      posterLink?: string;
    };
    about: { text: string; image?: string };
    problem: { text: string; image?: string };
    solution: { text: string; image?: string };
    monitoring: { 
      text: string; 
      sensors: SensorConfig[];
      actuators: ActuatorConfig[];
      calibration: CalibrationData[];
      database: DatabaseEntry[];
      connectionType: 'wifi' | 'cable';
      arduinoIp?: string;
    };
    team: { name: string; role: string; image?: string }[];
    contact: { email: string; social: string; address?: string };
  };
}

interface User {
  id: number;
  name: string;
  config: TeamConfig;
}

// --- Constants ---

const THEME_PRESETS = [
  { id: 'emerald', name: 'Emerald Nature', color: '#10b981', font: 'Inter' },
  { id: 'forest', name: 'Deep Forest', color: '#064e3b', font: 'Playfair Display' },
  { id: 'ocean', name: 'Deep Ocean', color: '#0369a1', font: 'Montserrat' },
  { id: 'sky', name: 'Sky Blue', color: '#0ea5e9', font: 'Inter' },
  { id: 'desert', name: 'Golden Desert', color: '#d97706', font: 'Playfair Display' },
  { id: 'sunset', name: 'Sunset Orange', color: '#ea580c', font: 'Montserrat' },
  { id: 'rose', name: 'Rose Garden', color: '#e11d48', font: 'Inter' },
  { id: 'violet', name: 'Violet Tech', color: '#7c3aed', font: 'Space Grotesk' },
  { id: 'indigo', name: 'Indigo Night', color: '#4f46e5', font: 'JetBrains Mono' },
  { id: 'slate', name: 'Modern Slate', color: '#475569', font: 'Inter' },
  { id: 'zinc', name: 'Industrial Zinc', color: '#52525b', font: 'JetBrains Mono' },
  { id: 'lime', name: 'Lime Fresh', color: '#84cc16', font: 'Inter' },
  { id: 'teal', name: 'Teal Lagoon', color: '#0d9488', font: 'Montserrat' },
  { id: 'cyan', name: 'Cyan Cyber', color: '#0891b2', font: 'Space Grotesk' },
  { id: 'fuchsia', name: 'Fuchsia Pop', color: '#c026d3', font: 'Montserrat' },
  { id: 'pink', name: 'Pink Soft', color: '#db2777', font: 'Inter' },
  { id: 'red', name: 'Red Alert', color: '#dc2626', font: 'Space Grotesk' },
  { id: 'orange', name: 'Vibrant Orange', color: '#f97316', font: 'Inter' },
  { id: 'amber', name: 'Amber Glow', color: '#f59e0b', font: 'Playfair Display' },
  { id: 'yellow', name: 'Sunny Yellow', color: '#eab308', font: 'Inter' },
  { id: 'mint', name: 'Mint Cool', color: '#2dd4bf', font: 'Montserrat' },
  { id: 'lavender', name: 'Lavender Mist', color: '#a78bfa', font: 'Inter' },
  { id: 'coffee', name: 'Coffee Brown', color: '#78350f', font: 'Playfair Display' },
  { id: 'stone', name: 'Stone Grey', color: '#78716c', font: 'JetBrains Mono' },
  { id: 'neutral', name: 'Neutral Beige', color: '#a3a3a3', font: 'Inter' },
  { id: 'crimson', name: 'Crimson Royal', color: '#991b1b', font: 'Playfair Display' },
  { id: 'navy', name: 'Navy Classic', color: '#1e3a8a', font: 'Montserrat' },
  { id: 'gold', name: 'Luxury Gold', color: '#b45309', font: 'Playfair Display' },
  { id: 'silver', name: 'Sleek Silver', color: '#94a3b8', font: 'Space Grotesk' },
  { id: 'bronze', name: 'Antique Bronze', color: '#92400e', font: 'Playfair Display' },
  { id: 'midnight', name: 'Midnight Black', color: '#09090b', font: 'JetBrains Mono' },
  { id: 'ghost', name: 'Ghost White', color: '#f8fafc', font: 'Inter' },
];

// --- Icons Mapping ---
const SensorIcons: Record<string, any> = {
  Droplets,
  Thermometer,
  Sun,
  Wind,
  Zap,
  Activity,
  Cloud,
  Waves,
  Sprout,
  Leaf,
  Bug,
  Gauge,
  Power,
  FlaskConical,
  DbIcon
};

// --- Components ---

const Navbar = ({ user, onLogout, isAdmin, onAdminLogin, onAdminLogout, darkMode, onToggleDarkMode }: { user: User | null; onLogout: () => void; isAdmin: boolean; onAdminLogin: () => void; onAdminLogout: () => void; darkMode: boolean; onToggleDarkMode: () => void }) => {
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === 'Admin1234') {
      onAdminLogin();
      setShowAdminInput(false);
      setAdminPass('');
    } else {
      alert('Incorrect password');
    }
  };

  return (
    <nav className={cn("border-b backdrop-blur-md sticky top-0 z-50 transition-colors duration-300", darkMode ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-emerald-900/10")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Sprout size={18} />
            </div>
            <span className={cn("font-bold text-xl tracking-tight", darkMode ? "text-white" : "text-slate-900")}>Seniors 27 Cap</span>
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleDarkMode}
              className={cn("p-2 rounded-full transition-colors", darkMode ? "text-yellow-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100")}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {isAdmin ? (
              <button 
                onClick={onAdminLogout}
                className={cn("text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full border transition-colors", darkMode ? "text-red-400 bg-red-950/30 border-red-900/50 hover:bg-red-950/50" : "text-red-600 bg-red-50 border-red-100 hover:bg-red-100")}
              >
                <Lock size={12} /> Admin Mode
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {showAdminInput ? (
                  <form onSubmit={handleAdminSubmit} className="flex items-center gap-2">
                    <input 
                      type="password"
                      placeholder="Admin Pass"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className={cn("text-xs px-2 py-1 rounded border outline-none w-24", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                      autoFocus
                    />
                    <button type="submit" className="text-xs font-bold text-emerald-600">Go</button>
                    <button type="button" onClick={() => setShowAdminInput(false)} className="text-xs text-slate-400">X</button>
                  </form>
                ) : (
                  <button 
                    onClick={() => setShowAdminInput(true)}
                    className={cn("text-xs font-bold transition-colors", darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")}
                  >
                    Admin
                  </button>
                )}
              </div>
            )}
            {user ? (
              <>
                <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border transition-colors", darkMode ? "bg-emerald-950/30 border-emerald-900/50" : "bg-emerald-50 border-emerald-100")}>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className={cn("text-xs font-bold uppercase tracking-wider", darkMode ? "text-emerald-400" : "text-emerald-700")}>Team {user.name}</span>
                </div>
                <button 
                  onClick={onLogout}
                  className={cn("p-2 rounded-full transition-colors", darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <Link to="/auth" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Login / Register</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Auth = ({ onLogin, darkMode }: { onLogin: (user: User) => void; darkMode: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          onLogin(data);
          navigate('/dashboard');
        } else {
          setError('Invalid server response. Expected JSON.');
        }
      } else {
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            setError(data.error || 'Login failed');
          } else {
            setError('Server error. Please try again later.');
          }
        } catch (e) {
          setError('Server error. Please try again later.');
        }
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  return (
    <div className={cn("min-h-[calc(100vh-64px)] flex items-center justify-center p-4 transition-colors duration-300", darkMode ? "bg-slate-950" : "bg-slate-50")}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("p-8 rounded-2xl shadow-xl w-full max-w-md border transition-colors duration-300", darkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-100")}
      >
        <h2 className={cn("text-3xl font-bold mb-2", darkMode ? "text-white" : "text-slate-900")}>{isLogin ? 'Welcome Back' : 'Create Team'}</h2>
        <p className="text-slate-500 mb-8">{isLogin ? 'Enter your team credentials' : 'Start your project journey today'}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>Team Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
              placeholder="e.g. Team Alpha"
            />
          </div>
          <div>
            <label className={cn("block text-sm font-medium mb-1", darkMode ? "text-slate-300" : "text-slate-700")}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            {isLogin ? 'Login' : 'Register Team'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-indigo-600 hover:underline"
          >
            {isLogin ? "Don't have a team? Register here" : "Already have a team? Login here"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user, onUpdateUser, darkMode }: { user: User; onUpdateUser: (user: User) => void; darkMode: boolean }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your site? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/site/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("min-h-[calc(100vh-64px)] transition-colors duration-300", darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className={cn("text-4xl font-bold tracking-tight", darkMode ? "text-white" : "text-slate-900")}>Dashboard</h1>
            <p className="text-slate-500 mt-2">Manage your project's digital presence</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/site/${user.name}`)}
              className={cn("flex items-center gap-2 px-6 py-3 border rounded-xl font-medium transition-all shadow-sm", darkMode ? "bg-slate-900 border-white/10 text-white hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}
            >
              <Eye size={18} />
              View Site
            </button>
            <button 
              onClick={() => navigate('/editor')}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Settings size={18} />
              Edit Content
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className={cn("p-8 rounded-2xl border shadow-sm", darkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-100")}>
              <h3 className={cn("text-xl font-bold mb-6 flex items-center gap-2", darkMode ? "text-white" : "text-slate-900")}>
                <Activity size={20} className="text-indigo-600" />
                Site Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={cn("p-4 rounded-xl border", darkMode ? "bg-emerald-950/20 border-emerald-900/50" : "bg-emerald-50 border-emerald-100")}>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Status</p>
                  <p className={cn("text-lg font-bold", darkMode ? "text-emerald-400" : "text-emerald-900")}>Live & Public</p>
                </div>
                <div className={cn("p-4 rounded-xl border", darkMode ? "bg-indigo-950/20 border-indigo-900/50" : "bg-indigo-50 border-indigo-100")}>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Theme</p>
                  <p className={cn("text-lg font-bold", darkMode ? "text-indigo-400" : "text-indigo-900")}>
                    {user.config.theme.mode} Mode
                  </p>
                </div>
              </div>
            </div>

            <div className={cn("p-8 rounded-2xl border shadow-sm", darkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-100")}>
              <h3 className={cn("text-xl font-bold mb-6 flex items-center gap-2", darkMode ? "text-white" : "text-slate-900")}>
                <LayoutDashboard size={20} className="text-indigo-600" />
                Quick Preview
              </h3>
              <div className={cn("aspect-video rounded-xl overflow-hidden relative group", darkMode ? "bg-slate-800" : "bg-slate-100")}>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 z-10">
                  <button 
                    onClick={() => navigate(`/site/${user.name}`)}
                    className="px-6 py-2 bg-white rounded-full font-bold text-slate-900"
                  >
                    Open Full Site
                  </button>
                </div>
                <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                  <h4 className="text-2xl font-bold mb-2">{user.config.content.home.title}</h4>
                  <p className="opacity-60 max-w-md line-clamp-2">{user.config.content.home.description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className={cn("p-8 rounded-2xl border shadow-sm", darkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-100")}>
              <h3 className={cn("text-xl font-bold mb-6", darkMode ? "text-white" : "text-slate-900")}>Settings</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/editor')}
                  className={cn("w-full flex items-center justify-between p-4 rounded-xl border border-transparent transition-all group", darkMode ? "hover:bg-slate-800 hover:border-white/5" : "hover:bg-slate-50 hover:border-slate-100")}
                >
                  <div className="flex items-center gap-3">
                    <Palette size={20} className="text-slate-400 group-hover:text-indigo-600" />
                    <span className="font-medium">Appearance</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
                <button 
                  onClick={() => navigate('/editor')}
                  className={cn("w-full flex items-center justify-between p-4 rounded-xl border border-transparent transition-all group", darkMode ? "hover:bg-slate-800 hover:border-white/5" : "hover:bg-slate-50 hover:border-slate-100")}
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon size={20} className="text-slate-400 group-hover:text-indigo-600" />
                    <span className="font-medium">Media Assets</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
                <div className={cn("pt-4 mt-4 border-t", darkMode ? "border-white/10" : "border-slate-100")}>
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-3 p-4 rounded-xl text-red-600 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={20} />
                    <span className="font-medium">{isDeleting ? 'Deleting...' : 'Delete Site'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Editor = ({ user, onUpdateUser, darkMode, onToggleDarkMode }: { user: User; onUpdateUser: (user: User) => void; darkMode: boolean; onToggleDarkMode: (val: boolean) => void }) => {
  const [config, setConfig] = useState<TeamConfig>(user.config);
  const [activeTab, setActiveTab] = useState('home');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/site/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      if (res.ok) {
        onUpdateUser({ ...user, config });
        alert('Site updated successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateContent = (section: keyof TeamConfig['content'], field: string, value: any) => {
    setConfig(prev => {
      const sectionData = prev.content[section] || {};
      return {
        ...prev,
        content: {
          ...prev.content,
          [section]: typeof sectionData === 'object' && !Array.isArray(sectionData)
            ? { ...sectionData, [field]: value }
            : value
        }
      };
    });
  };

  const addTeamMember = () => {
    setConfig(prev => ({
      ...prev,
      content: {
        ...prev.content,
        team: [...prev.content.team, { name: 'New Member', role: 'Role', image: '' }]
      }
    }));
  };

  const removeTeamMember = (index: number) => {
    setConfig(prev => ({
      ...prev,
      content: {
        ...prev.content,
        team: prev.content.team.filter((_, i) => i !== index)
      }
    }));
  };

  const updateTeamMember = (index: number, field: string, value: string) => {
    setConfig(prev => {
      const newTeam = [...prev.content.team];
      newTeam[index] = { ...newTeam[index], [field]: value };
      return {
        ...prev,
        content: { ...prev.content, team: newTeam }
      };
    });
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'about', label: 'About', icon: Info },
    { id: 'problem', label: 'Problem', icon: AlertCircle },
    { id: 'solution', label: 'Solution', icon: CheckCircle2 },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={cn("min-h-screen transition-colors duration-300", darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => navigate('/dashboard')} className={cn("text-sm mb-2 flex items-center gap-1 transition-colors", darkMode ? "text-slate-400 hover:text-emerald-400" : "text-slate-500 hover:text-indigo-600")}>
              ← Back to Dashboard
            </button>
            <h1 className={cn("text-3xl font-bold", darkMode ? "text-white" : "text-slate-900")}>Site Editor</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onToggleDarkMode(!darkMode)}
              className={cn("p-3 rounded-xl transition-all border", darkMode ? "bg-slate-900 border-white/10 text-white hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className={cn("rounded-2xl border shadow-sm overflow-hidden", darkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-100")}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all border-l-4",
                    activeTab === tab.id 
                      ? darkMode ? "bg-emerald-950/30 border-emerald-500 text-emerald-400" : "bg-indigo-50 border-indigo-600 text-indigo-600" 
                      : darkMode ? "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={cn("flex-grow rounded-2xl border shadow-sm p-8", darkMode ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {activeTab === 'home' && (
                  <>
                    <h2 className="text-xl font-bold">Home Page Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium opacity-70 mb-1">Project Logo URL</label>
                        <input 
                          type="text" 
                          value={config.content.logo || ''}
                          onChange={e => setConfig(prev => ({ ...prev, content: { ...prev.content, logo: e.target.value } }))}
                          className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium opacity-70 mb-1">Project Title</label>
                        <input 
                          type="text" 
                          value={config.content.home?.title || ''}
                          onChange={e => updateContent('home', 'title', e.target.value)}
                          className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium opacity-70 mb-1">Hero Description</label>
                        <textarea 
                          rows={4}
                          value={config.content.home?.description || ''}
                          onChange={e => updateContent('home', 'description', e.target.value)}
                          className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium opacity-70 mb-1">Hero Image URL</label>
                        <input 
                          type="text" 
                          value={config.content.home?.heroImage || ''}
                          onChange={e => updateContent('home', 'heroImage', e.target.value)}
                          className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                          placeholder="https://picsum.photos/1920/1080"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-inherit">
                        <div>
                          <label className="block text-sm font-medium opacity-70 mb-1">Test Video Link</label>
                          <input 
                            type="text" 
                            value={config.content.home?.videoLink || ''}
                            onChange={e => updateContent('home', 'videoLink', e.target.value)}
                            className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                            placeholder="YouTube URL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium opacity-70 mb-1">Portfolio Link</label>
                          <input 
                            type="text" 
                            value={config.content.home?.portfolioLink || ''}
                            onChange={e => updateContent('home', 'portfolioLink', e.target.value)}
                            className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                            placeholder="PDF Link"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium opacity-70 mb-1">Poster Link</label>
                          <input 
                            type="text" 
                            value={config.content.home?.posterLink || ''}
                            onChange={e => updateContent('home', 'posterLink', e.target.value)}
                            className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                            placeholder="Poster Link"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

              {activeTab === 'about' && (
                <>
                  <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-900")}>About Section</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-1">About Content</label>
                      <textarea 
                        rows={6}
                        value={config.content.about?.text || ''}
                        onChange={e => updateContent('about', 'text', e.target.value)}
                        className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-1">Section Image URL</label>
                      <input 
                        type="text" 
                        value={config.content.about?.image || ''}
                        onChange={e => updateContent('about', 'image', e.target.value)}
                        className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'problem' && (
                <>
                  <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-900")}>Problem Statement</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-1">The Problem</label>
                      <textarea 
                        rows={6}
                        value={config.content.problem?.text || ''}
                        onChange={e => updateContent('problem', 'text', e.target.value)}
                        className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'solution' && (
                <>
                  <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-900")}>Our Solution</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-1">The Solution</label>
                      <textarea 
                        rows={6}
                        value={config.content.solution?.text || ''}
                        onChange={e => updateContent('solution', 'text', e.target.value)}
                        className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'monitoring' && (
                <>
                  <h2 className="text-xl font-bold mb-6">Arduino Monitoring Setup</h2>
                  <div className="space-y-8">
                    <div className={cn("p-6 rounded-2xl border", darkMode ? "bg-emerald-950/20 border-emerald-900/50" : "bg-emerald-50 border-emerald-100")}>
                      <h3 className={cn("text-lg font-bold mb-4 flex items-center gap-2", darkMode ? "text-emerald-400" : "text-emerald-900")}>
                        <Activity size={20} /> Live Monitoring Preview
                      </h3>
                      <SensorGrid 
                        teamId={user.name} 
                        sensors={config.content.monitoring.sensors} 
                        actuators={config.content.monitoring.actuators}
                        calibration={[]}
                        database={[]}
                        primaryColor={config.theme.primaryColor} 
                        mode={darkMode ? 'dark' : 'light'} 
                        geminiKey={config.theme.geminiKey}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Connection Type</label>
                        <select 
                          value={config.content.monitoring.connectionType}
                          onChange={e => updateContent('monitoring', 'connectionType', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none"
                        >
                          <option value="wifi">Wi-Fi (HTTP/IP)</option>
                          <option value="cable">Cable (Web Serial)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium opacity-70 mb-1">Arduino IP Address</label>
                        <input 
                          type="text" 
                          value={config.content.monitoring.arduinoIp || ''}
                          onChange={e => updateContent('monitoring', 'arduinoIp', e.target.value)}
                          className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      {config.content.monitoring.connectionType === 'cable' && (
                        <div>
                          <label className="block text-sm font-medium opacity-70 mb-1">Serial Connection</label>
                          <button 
                            onClick={async () => {
                              try {
                                // @ts-ignore
                                const port = await navigator.serial.requestPort();
                                await port.open({ baudRate: 9600 });
                                alert('Connected to Arduino via Serial!');
                              } catch (err) {
                                alert('Serial connection failed: ' + err);
                              }
                            }}
                            className={cn("w-full px-4 py-2 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-colors", darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-100 border-slate-200 hover:bg-slate-200")}
                          >
                            <Zap size={16} /> Connect via Serial
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={cn("font-bold", darkMode ? "text-white" : "text-slate-900")}>Sensors Configuration</h3>
                        <button 
                          onClick={() => {
                            const currentSensors = config.content.monitoring?.sensors || [];
                            const newSensor = { id: Date.now().toString(), name: 'New Sensor', icon: 'Droplets', tag: 'sensor1', unit: '' };
                            updateContent('monitoring', 'sensors', [...currentSensors, newSensor]);
                          }}
                          className="text-sm text-emerald-600 font-bold flex items-center gap-1"
                        >
                          <Plus size={16} /> Add Sensor
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {(config.content.monitoring?.sensors || []).map((sensor, idx) => (
                          <div key={sensor.id} className={cn("p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100")}>
                            <div>
                              <label className="text-[10px] font-bold opacity-50 uppercase">Name</label>
                              <input 
                                value={sensor.name}
                                onChange={e => {
                                  const newSensors = (config.content.monitoring?.sensors || []).map((s, i) => 
                                    i === idx ? { ...s, name: e.target.value } : s
                                  );
                                  updateContent('monitoring', 'sensors', newSensors);
                                }}
                                className={cn("w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold opacity-50 uppercase">Tag (Arduino Code)</label>
                              <input 
                                value={sensor.tag}
                                onChange={e => {
                                  const newSensors = (config.content.monitoring?.sensors || []).map((s, i) => 
                                    i === idx ? { ...s, tag: e.target.value } : s
                                  );
                                  updateContent('monitoring', 'sensors', newSensors);
                                }}
                                className={cn("w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold opacity-50 uppercase">Icon</label>
                              <select 
                                value={sensor.icon}
                                onChange={e => {
                                  const newSensors = (config.content.monitoring?.sensors || []).map((s, i) => 
                                    i === idx ? { ...s, icon: e.target.value } : s
                                  );
                                  updateContent('monitoring', 'sensors', newSensors);
                                }}
                                className={cn("w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                              >
                                {Object.keys(SensorIcons).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                              </select>
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex-grow">
                                <label className="text-[10px] font-bold opacity-50 uppercase">Unit</label>
                                <input 
                                  value={sensor.unit}
                                  onChange={e => {
                                    const newSensors = (config.content.monitoring?.sensors || []).map((s, i) => 
                                      i === idx ? { ...s, unit: e.target.value } : s
                                    );
                                    updateContent('monitoring', 'sensors', newSensors);
                                  }}
                                  className={cn("w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                                  placeholder="e.g. %, °C"
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  updateContent('monitoring', 'sensors', (config.content.monitoring?.sensors || []).filter((_, i) => i !== idx));
                                }}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                      <div className="pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={cn("font-bold", darkMode ? "text-white" : "text-slate-900")}>Actuators Configuration</h3>
                          <button 
                            onClick={() => {
                              const newActuator = { id: Date.now().toString(), name: 'New Actuator', icon: 'Power', tag: 'actuator1' };
                              updateContent('monitoring', 'actuators', [...(config.content.monitoring.actuators || []), newActuator]);
                            }}
                            className={cn("text-sm font-bold flex items-center gap-1", darkMode ? "text-emerald-400" : "text-emerald-600")}
                          >
                            <Plus size={16} /> Add Actuator
                          </button>
                        </div>
                        <div className="space-y-4">
                          {(config.content.monitoring.actuators || []).map((actuator, idx) => (
                            <div key={actuator.id} className={cn("p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100")}>
                              <div>
                                <label className="text-[10px] font-bold opacity-50 uppercase">Name</label>
                                <input 
                                  value={actuator.name}
                                  onChange={e => {
                                    const newActuators = config.content.monitoring.actuators.map((a, i) => 
                                      i === idx ? { ...a, name: e.target.value } : a
                                    );
                                    updateContent('monitoring', 'actuators', newActuators);
                                  }}
                                  className={cn("w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold opacity-50 uppercase">Tag</label>
                                <input 
                                  value={actuator.tag}
                                  onChange={e => {
                                    const newActuators = config.content.monitoring.actuators.map((a, i) => 
                                      i === idx ? { ...a, tag: e.target.value } : a
                                    );
                                    updateContent('monitoring', 'actuators', newActuators);
                                  }}
                                  className={cn("w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                  <label className="text-[10px] font-bold opacity-50 uppercase">Icon</label>
                                  <select 
                                    value={actuator.icon}
                                    onChange={e => {
                                      const newActuators = config.content.monitoring.actuators.map((a, i) => 
                                        i === idx ? { ...a, icon: e.target.value } : a
                                      );
                                      updateContent('monitoring', 'actuators', newActuators);
                                    }}
                                    className={cn("w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                                  >
                                    {Object.keys(SensorIcons).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                  </select>
                                </div>
                                <button 
                                  onClick={() => {
                                    updateContent('monitoring', 'actuators', config.content.monitoring.actuators.filter((_, i) => i !== idx));
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                  </div>
                </>
              )}

              {activeTab === 'team' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-900")}>Team Members</h2>
                    <button 
                      onClick={addTeamMember}
                      className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all", darkMode ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100")}
                    >
                      <Plus size={16} />
                      Add Member
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {(config.content.team || []).map((member, idx) => (
                      <div key={idx} className={cn("p-4 border rounded-xl space-y-3", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100")}>
                        <div className="flex justify-between items-start">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-grow">
                            <input 
                              placeholder="Name"
                              value={member.name}
                              onChange={e => updateTeamMember(idx, 'name', e.target.value)}
                              className={cn("px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                            />
                            <input 
                              placeholder="Role"
                              value={member.role}
                              onChange={e => updateTeamMember(idx, 'role', e.target.value)}
                              className={cn("px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                            />
                          </div>
                          <button onClick={() => removeTeamMember(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <input 
                          placeholder="Image URL"
                          value={member.image}
                          onChange={e => updateTeamMember(idx, 'image', e.target.value)}
                          className={cn("w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'contact' && (
                <>
                  <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-900")}>Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        value={config.content.contact?.email || ''}
                        onChange={e => updateContent('contact', 'email', e.target.value)}
                        className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-1">Social Links / Website</label>
                      <input 
                        type="text" 
                        value={config.content.contact?.social || ''}
                        onChange={e => updateContent('contact', 'social', e.target.value)}
                        className={cn("w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'theme' && (
                <>
                  <h2 className={cn("text-xl font-bold", darkMode ? "text-white" : "text-slate-900")}>Theme & Style</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-3">Theme Presets</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        {THEME_PRESETS.map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => setConfig(prev => ({ 
                              ...prev, 
                              theme: { ...prev.theme, preset: preset.id, primaryColor: preset.color, fontFamily: preset.font } 
                            }))}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                              config.theme.preset === preset.id 
                                ? (darkMode ? "bg-emerald-950 border-emerald-500" : "bg-emerald-50 border-emerald-500") 
                                : (darkMode ? "bg-slate-800 border-slate-700 hover:border-slate-500" : "bg-white border-slate-100 hover:border-slate-300")
                            )}
                          >
                            <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: preset.color }} />
                            <span className={cn("text-[10px] font-bold text-center leading-tight", darkMode ? "text-slate-300" : "text-slate-700")}>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-3">Primary Color</label>
                      <div className="flex flex-wrap gap-3">
                        {['#10b981', '#059669', '#15803d', '#4f46e5', '#0ea5e9', '#f59e0b', '#ef4444', '#141414'].map(color => (
                          <button
                            key={color}
                            onClick={() => setConfig(prev => ({ ...prev, theme: { ...prev.theme, primaryColor: color } }))}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all",
                              config.theme.primaryColor === color 
                                ? (darkMode ? "border-white scale-110" : "border-slate-900 scale-110") 
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-3">Font Family</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {['Inter', 'Playfair Display', 'Space Grotesk', 'JetBrains Mono', 'Georgia', 'Montserrat'].map(font => (
                          <button
                            key={font}
                            onClick={() => setConfig(prev => ({ ...prev, theme: { ...prev.theme, fontFamily: font } }))}
                            className={cn(
                              "px-4 py-2 rounded-lg border text-sm transition-all",
                              config.theme.fontFamily === font 
                                ? "bg-indigo-600 border-indigo-600 text-white" 
                                : (darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-600")
                            )}
                            style={{ fontFamily: font }}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-3">Theme Mode</label>
                      <div className="flex gap-3">
                        {['light', 'dark', 'glass'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => setConfig(prev => ({ ...prev, theme: { ...prev.theme, mode: mode as any } }))}
                            className={cn(
                              "px-6 py-2 rounded-lg border text-sm font-medium capitalize transition-all",
                              config.theme.mode === mode 
                                ? "bg-indigo-600 border-indigo-600 text-white" 
                                : (darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-600" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-600")
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'settings' && (
                <>
                  <h2 className="text-xl font-bold">Advanced Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium opacity-70 mb-1">Gemini API Key</label>
                      <div className="flex gap-2">
                        <input 
                          type="password" 
                          value={config.theme.geminiKey || ''}
                          onChange={e => setConfig(prev => ({ ...prev, theme: { ...prev.theme, geminiKey: e.target.value } }))}
                          className={cn("flex-grow px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500", darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
                          placeholder="Enter your Gemini API Key"
                        />
                      </div>
                      <p className="mt-2 text-xs opacity-50">
                        Each team can use their own Gemini API key for AI analysis. If left empty, the system default will be used.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  </div>
  );
};

const PasswordGate = ({ teamName, mode, primaryColor, onAuthenticated }: { 
  teamName: string; 
  mode: string;
  primaryColor: string;
  onAuthenticated: (password: string) => void 
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const darkMode = mode === 'dark' || mode === 'glass';

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName, password })
    });
    if (res.ok) {
      onAuthenticated(password);
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 transition-colors duration-500", darkMode ? "bg-slate-950" : "bg-slate-50")}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("p-8 rounded-3xl shadow-xl border w-full max-w-md text-center", darkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-100")}
      >
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Lock size={32} />
        </div>
        <h2 className={cn("text-2xl font-bold mb-2", darkMode ? "text-white" : "text-slate-900")}>Protected Site</h2>
        <p className="text-slate-500 mb-8">Enter the team password to access this project dashboard.</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className={cn("w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 transition-all", 
              darkMode ? "bg-slate-800 border-slate-700 text-white focus:ring-emerald-500" : "bg-white border-slate-200 text-slate-900 focus:ring-emerald-500"
            )}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            className="w-full text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:opacity-90 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            Access Site
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const SENSOR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const SensorGrid = ({ teamId, sensors, actuators, calibration, database, primaryColor, mode, geminiKey, teamPassword }: { 
  teamId: string; 
  sensors: SensorConfig[]; 
  actuators: ActuatorConfig[];
  calibration: CalibrationData[];
  database: DatabaseEntry[];
  primaryColor: string; 
  mode: string;
  geminiKey?: string;
  teamPassword?: string;
}) => {
  const [data, setData] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isArduinoConnected, setIsArduinoConnected] = useState(false);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const dbIdRef = useRef<number | null>(null);

  const connectSerial = async () => {
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setIsArduinoConnected(true);

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          try {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            const parsed = JSON.parse(trimmedLine);
            
            // Update current display data
            setData(prev => ({ ...prev, ...parsed }));
            
            // Create history entries for each tag in the parsed object
            const now = new Date().toISOString();
            const newEntries = Object.entries(parsed).map(([tag, val]) => ({
              tag,
              value: Number(val),
              timestamp: now
            }));

            setHistory(prev => {
              // Keep only the last 100 points for performance
              const combined = [...prev, ...newEntries];
              return combined.slice(-100);
            });

            // Send to database if we have the ID and password
            if (dbIdRef.current && teamPassword) {
              fetch('/api/sensor-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  teamId: dbIdRef.current,
                  password: teamPassword,
                  data: parsed
                })
              }).catch(err => console.error('Failed to sync to DB:', err));
            }
          } catch (e) {
            console.error('Serial parse error:', e, 'Line:', line);
          }
        }
      }
    } catch (err) {
      console.error('Serial connection failed:', err);
      setIsArduinoConnected(false);
    }
  };

  const disconnectSerial = async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }
    if (portRef.current) {
      await portRef.current.close();
      portRef.current = null;
    }
    setIsArduinoConnected(false);
  };

  const toggleArduino = () => {
    if (isArduinoConnected) {
      disconnectSerial();
    } else {
      connectSerial();
    }
  };

  useEffect(() => {
    const fetchId = async () => {
      const res = await fetch(`/api/site/${teamId}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const site = await res.json();
          dbIdRef.current = site.id;
          return site.id;
        }
      }
    };

    let interval: any;
    fetchId().then(id => {
      if (!id) return;
      const fetchData = async () => {
        // If Arduino is connected, we rely on Serial for live updates to avoid "cutting out"
        if (isArduinoConnected) return;

        try {
          const res = await fetch(`/api/sensor-data/${id}`);
          if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const raw = await res.json();
              setHistory(raw);
              const latest: Record<string, number> = {};
              // Database returns newest first, so we process in reverse to get latest for each tag
              [...raw].reverse().forEach((item: any) => {
                latest[item.tag] = item.value;
              });
              setData(latest);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchData();
      interval = setInterval(fetchData, 5000);
    });

    return () => clearInterval(interval);
  }, [teamId, isArduinoConnected]);

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const userKey = geminiKey?.trim();
      const apiKey = (userKey && userKey !== '') ? userKey : process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey.trim() === '') {
        throw new Error("Gemini API Key is missing. Please add your API key in the 'Advanced Settings' tab in the editor and click Save.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `As an expert agricultural IoT analyst for the G11 Challenge, analyze the following sensor data for a ${teamId} project.
      
      Current Readings: ${JSON.stringify(data)}
      Recent History: ${JSON.stringify(history.slice(0, 10))}
      
      Provide:
      1. A summary of the current system health.
      2. Specific recommendations based on the G11 Challenge requirements (Closed-loop control, environmental optimization).
      3. Any potential issues detected.
      
      Keep it professional, concise, and actionable. Use bullet points for readability.`;

      // Try multiple models in case one is overloaded (503 error)
      const models = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview"];
      let lastError: any = null;
      let success = false;

      for (const modelName of models) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          
          if (result.text) {
            setAnalysis(result.text);
            success = true;
            break; 
          }
        } catch (err: any) {
          lastError = err;
          // If it's a 503 (High Demand), try the next model
          if (err.message?.includes("503") || err.message?.includes("high demand")) {
            console.warn(`Model ${modelName} is busy, trying fallback...`);
            continue;
          }
          // For other errors (like 429 Quota), don't bother trying other models with the same key
          break;
        }
      }

      if (!success && lastError) {
        throw lastError;
      }
      
    } catch (err: any) {
      console.error('AI Analysis Error:', err);
      let errorMessage = "AI analysis failed.";
      
      if (err.message?.includes("429") || err.message?.includes("Quota")) {
        errorMessage = "Quota exceeded (429). Please wait a minute or try a different API key.";
      } else if (err.message?.includes("503") || err.message?.includes("high demand")) {
        errorMessage = "The AI service is currently very busy (503). This is a temporary issue on Google's side. Please try again in a few seconds.";
      } else if (err.message?.includes("API Key")) {
        errorMessage = err.message;
      } else {
        errorMessage = `Error: ${err.message || "Unknown error occurred."}`;
      }
      
      setAnalysis(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToExcel = () => {
    const wsData = history.map(item => ({
      Timestamp: new Date(item.timestamp).toLocaleString(),
      Sensor: sensors.find(s => s.tag === item.tag)?.name || item.tag,
      Value: item.value,
      Unit: sensors.find(s => s.tag === item.tag)?.unit || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sensor Data");
    XLSX.writeFile(wb, `${teamId}_sensor_data.xlsx`);
  };

  const chartData = useMemo(() => {
    const grouped: Record<string, any> = {};
    // Process history to group by time for the chart
    // Database data is DESC, so we reverse it to process chronologically
    [...history].reverse().forEach(item => {
      if (!item.timestamp) return;
      const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (!grouped[time]) grouped[time] = { time };
      grouped[time][item.tag] = item.value;
    });
    return Object.values(grouped);
  }, [history]);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {(sensors || []).map(sensor => {
          const Icon = SensorIcons[sensor.icon] || Droplets;
          const value = data[sensor.tag];
          return (
            <motion.div 
              key={sensor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-8 rounded-3xl border flex flex-col items-center text-center transition-all",
                mode === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-black/5 shadow-sm"
              )}
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <Icon size={32} />
              </div>
              <div className="text-4xl font-bold mb-2">
                {value !== undefined ? `${value}${sensor.unit}` : '--'}
              </div>
              <div className="text-sm font-bold uppercase tracking-widest opacity-50">{sensor.name}</div>
              <div 
                className="mt-4 px-3 py-1 rounded-full text-[10px] font-mono font-bold"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                TAG: {sensor.tag}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* System Status & Arduino Toggle */}
      <div className={cn("p-8 rounded-3xl border", mode === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-black/5 shadow-sm")}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isArduinoConnected ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
              <RefreshCw className={cn(isArduinoConnected && "animate-spin")} />
            </div>
            <div>
              <h4 className="font-bold text-lg">System Status</h4>
              <p className="text-sm opacity-60">Real-time sensor data from our Arduino system.</p>
            </div>
          </div>
          <button 
            onClick={toggleArduino}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg",
              isArduinoConnected 
                ? "bg-red-500 text-white shadow-red-200 hover:bg-red-600" 
                : "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
            )}
          >
            <LinkIcon size={18} />
            {isArduinoConnected ? 'Disconnect Arduino' : 'Connect Arduino'}
          </button>
        </div>
      </div>

      {/* Actuators Section */}
      {actuators && actuators.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Power className="text-emerald-600" /> Actuators Control
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {actuators.map(actuator => {
              const Icon = SensorIcons[actuator.icon] || Power;
              return (
                <div key={actuator.id} className={cn("p-6 rounded-2xl border flex items-center justify-between", mode === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-black/5")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", mode === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600")}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <div className={cn("font-bold", mode === 'dark' ? "text-white" : "text-slate-900")}>{actuator.name}</div>
                      <div className="text-xs opacity-50 font-mono">{actuator.tag}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase opacity-50">Manual</span>
                    <div className={cn("w-12 h-6 rounded-full relative cursor-pointer transition-colors", mode === 'dark' ? "bg-slate-800" : "bg-slate-200")}>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("p-8 rounded-3xl border", mode === 'dark' ? "bg-slate-900 border-white/10" : "bg-emerald-50 border-emerald-100 shadow-sm")}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Brain size={24} />
              </div>
              <div>
                <h3 className={cn("text-xl font-bold", mode === 'dark' ? "text-white" : "text-emerald-900")}>Gemini AI Insights</h3>
                <p className="text-xs opacity-60">Smart recommendations for your agricultural system</p>
              </div>
            </div>
            <button 
              onClick={() => setAnalysis(null)}
              className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              Dismiss
            </button>
          </div>
          <div className={cn("text-sm leading-relaxed whitespace-pre-wrap p-6 rounded-2xl border", mode === 'dark' ? "bg-slate-950 border-white/5 text-slate-300" : "bg-white border-emerald-200 text-emerald-900 shadow-inner")}>
            {analysis}
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className={cn("p-8 rounded-3xl border overflow-hidden flex flex-col", mode === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-black/5 shadow-sm")}>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <LineChart className="text-emerald-600" /> Analytics & Trends
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={exportToExcel}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all", mode === 'dark' ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
            >
              <Download size={18} />
              Export Excel
            </button>
            <button 
              onClick={handleAIAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <Brain size={18} />
              {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[800px] pr-4 space-y-12 custom-scrollbar">
          <div className="h-[400px] w-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold opacity-50 uppercase tracking-widest">Combined Overview</h4>
              <div className="flex flex-wrap gap-4">
                {(sensors || []).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SENSOR_COLORS[i % SENSOR_COLORS.length] }} />
                    <span className="text-[10px] font-bold opacity-60 uppercase">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={mode === 'dark' ? '#ffffff10' : '#00000010'} />
                <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: mode === 'dark' ? '#0f172a' : '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                {(sensors || []).map((s, i) => (
                  <Line 
                    key={s.id}
                    type="monotone" 
                    dataKey={s.tag} 
                    stroke={SENSOR_COLORS[i % SENSOR_COLORS.length]} 
                    strokeWidth={3}
                    dot={false}
                    connectNulls={true}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </ReLineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {sensors.map(sensor => (
              <div key={sensor.id} className="h-[250px] w-full">
                <h4 className="text-sm font-bold mb-4 opacity-50 uppercase tracking-widest">{sensor.name} History</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`color-${sensor.tag}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={mode === 'dark' ? '#ffffff10' : '#00000010'} />
                    <XAxis dataKey="time" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: mode === 'dark' ? '#0f172a' : '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={sensor.tag} 
                      stroke={primaryColor} 
                      fillOpacity={1} 
                      fill={`url(#color-${sensor.tag})`} 
                      strokeWidth={2}
                      connectNulls={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamSite = () => {
  const navigate = useNavigate();
  const { teamName } = useParams();
  const [site, setSite] = useState<{ name: string; config: TeamConfig } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teamPassword, setTeamPassword] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);

  useEffect(() => {
    // Mock weather for smart agriculture feel
    setWeather({ temp: 24, condition: 'Sunny' });
  }, []);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/site/${teamName}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            setSite(data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSite();
  }, [teamName]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading site...</div>;
  if (!site) return <div className="min-h-screen flex items-center justify-center">Site not found</div>;
  if (!isAuthenticated) return (
    <PasswordGate 
      teamName={site.name} 
      mode={site.config.theme.mode} 
      primaryColor={site.config.theme.primaryColor} 
      onAuthenticated={(pass) => { setIsAuthenticated(true); setTeamPassword(pass); }} 
    />
  );

  const { theme, content } = site.config;

  const themeStyles = {
    fontFamily: theme.fontFamily,
    '--primary': theme.primaryColor,
  } as React.CSSProperties;

  const modeClasses = cn(
    theme.mode === 'dark' ? "bg-slate-950 text-white" : "bg-white text-slate-900",
    theme.mode === 'glass' && "bg-slate-50 text-slate-900"
  );

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'problem', label: 'Problem' },
    { id: 'solution', label: 'Solution' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'team', label: 'Team' },
    { id: 'contact', label: 'Contact' },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500", modeClasses)} style={themeStyles}>
      {/* Dynamic Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(' ', '+')}:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 w-full z-50 border-b transition-all",
        theme.mode === 'dark' ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-black/5",
        "backdrop-blur-md"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              {content.logo ? (
                <img src={content.logo} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {site.name[0]}
                </div>
              )}
              <span className="font-bold text-2xl tracking-tight">{site.name}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <button 
                  key={link.id} 
                  onClick={() => scrollTo(link.id)}
                  className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/dashboard')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-current opacity-70 hover:opacity-100 transition-all"
              >
                <ArrowLeft size={16} />
                Back to Editor
              </button>
              <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed inset-0 z-40 md:hidden pt-24 px-6",
              theme.mode === 'dark' ? "bg-slate-950" : "bg-white"
            )}
          >
            <div className="flex flex-col gap-6">
              {navLinks.map(link => (
                <button 
                  key={link.id} 
                  onClick={() => scrollTo(link.id)}
                  className="text-2xl font-bold text-left"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {weather && (
          <div className="absolute top-24 right-8 z-20 hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn("p-4 rounded-2xl border backdrop-blur-md flex items-center gap-4", theme.mode === 'dark' ? "bg-slate-900/50 border-white/10" : "bg-white/50 border-slate-200")}
            >
              <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <Sun size={20} />
              </div>
              <div>
                <div className="text-xs opacity-50 font-bold uppercase">Local Weather</div>
                <div className="text-xl font-black">{weather.temp}°C • {weather.condition}</div>
              </div>
            </motion.div>
          </div>
        )}
        <div className="absolute inset-0 z-0">
          <img 
            src={content.home.heroImage || "https://picsum.photos/seed/hero/1920/1080"} 
            className="w-full h-full object-cover opacity-20"
            alt="Hero Background"
            referrerPolicy="no-referrer"
          />
          <div className={cn(
            "absolute inset-0",
            theme.mode === 'dark' ? "bg-gradient-to-b from-slate-950/50 to-slate-950" : "bg-gradient-to-b from-white/50 to-white"
          )} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 leading-[0.9]">
              {content.home.title}
            </h1>
            <p className="text-xl md:text-2xl opacity-80 mb-10 leading-relaxed max-w-2xl">
              {content.home.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href={content.home.videoLink || '#'}
                target={content.home.videoLink ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={cn(
                  "px-8 py-4 rounded-full text-white font-bold text-lg shadow-xl transition-transform hover:scale-105 flex items-center gap-2",
                  !content.home.videoLink && "opacity-50 cursor-not-allowed"
                )}
                style={{ backgroundColor: theme.primaryColor }}
                onClick={e => !content.home.videoLink && e.preventDefault()}
              >
                <Play size={20} /> Test Video
              </a>
              <a 
                href={content.home.portfolioLink || '#'}
                target={content.home.portfolioLink ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={cn(
                  "px-8 py-4 rounded-full text-white font-bold text-lg shadow-xl transition-transform hover:scale-105 flex items-center gap-2",
                  !content.home.portfolioLink && "opacity-50 cursor-not-allowed"
                )}
                style={{ backgroundColor: theme.primaryColor }}
                onClick={e => !content.home.portfolioLink && e.preventDefault()}
              >
                <FileText size={20} /> Portfolio
              </a>
              <a 
                href={content.home.posterLink || '#'}
                target={content.home.posterLink ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={cn(
                  "px-8 py-4 rounded-full text-white font-bold text-lg shadow-xl transition-transform hover:scale-105 flex items-center gap-2",
                  !content.home.posterLink && "opacity-50 cursor-not-allowed"
                )}
                style={{ backgroundColor: theme.primaryColor }}
                onClick={e => !content.home.posterLink && e.preventDefault()}
              >
                <ImageIcon size={20} /> Poster
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8">About the Project</h2>
              <div className="prose prose-lg dark:prose-invert opacity-80">
                <p className="whitespace-pre-wrap">{content.about.text}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-3xl overflow-hidden shadow-2xl"
            >
              <img 
                src={content.about.image || "https://picsum.photos/seed/about/800/800"} 
                className="w-full h-full object-cover"
                alt="About"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className={cn("py-24", theme.mode === 'dark' ? "bg-white/5" : "bg-slate-50")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              id="problem"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={cn("p-10 rounded-3xl border", theme.mode === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-black/5")}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-red-500 bg-red-500/10">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4">The Problem</h3>
              <p className="opacity-70 leading-relaxed whitespace-pre-wrap">{content.problem.text}</p>
            </motion.div>
            <motion.div 
              id="solution"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={cn("p-10 rounded-3xl border", theme.mode === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-black/5")}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 bg-emerald-500/10">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Solution</h3>
              <p className="opacity-70 leading-relaxed whitespace-pre-wrap">{content.solution.text}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Monitoring Section */}
      <section id="monitoring" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-red-100">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Live Monitoring
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">System Status</h2>
            <p className="opacity-70 text-lg">{content.monitoring.text}</p>
          </div>
          
          <SensorGrid 
            teamId={site.name} 
            sensors={content.monitoring.sensors} 
            actuators={content.monitoring.actuators}
            calibration={content.monitoring.calibration}
            database={content.monitoring.database}
            primaryColor={theme.primaryColor} 
            mode={theme.mode} 
            geminiKey={theme.geminiKey}
            teamPassword={teamPassword || undefined}
          />
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className={cn("py-24", theme.mode === 'dark' ? "bg-white/5" : "bg-slate-50")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(content.team || []).map((member, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="aspect-[4/5] rounded-3xl overflow-hidden mb-6 relative">
                  <img 
                    src={member.image || `https://picsum.photos/seed/member${idx}/400/500`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={member.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="text-xl font-bold">{member.name}</h4>
                <p className="opacity-60">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "rounded-[3rem] p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12",
            theme.mode === 'dark' ? "bg-white text-slate-950" : "bg-slate-950 text-white"
          )}>
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Get in touch with us</h2>
              <p className="text-xl opacity-70 mb-10">Have questions about our project? We'd love to hear from you.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mail size={24} />
                  <span className="text-xl font-medium">{content.contact.email || "contact@project.com"}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Activity size={24} />
                  <span className="text-xl font-medium">{content.contact.social || "@project_handle"}</span>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md">
              <form className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border outline-none focus:ring-2",
                    theme.mode === 'dark' ? "bg-slate-50 border-slate-200 focus:ring-slate-900" : "bg-slate-900 border-white/10 focus:ring-white"
                  )}
                />
                <textarea 
                  placeholder="Your Message" 
                  rows={4}
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border outline-none focus:ring-2",
                    theme.mode === 'dark' ? "bg-slate-50 border-slate-200 focus:ring-slate-900" : "bg-slate-900 border-white/10 focus:ring-white"
                  )}
                />
                <button 
                  className="w-full py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: theme.primaryColor, color: 'white' }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-black/5 opacity-50 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
          © 2026 {site.name} • Built on Seniors 27 Cap
        </div>
      </footer>
    </div>
  );
};

const LandingPage = ({ isAdmin, darkMode, onToggleDarkMode }: { isAdmin: boolean; darkMode: boolean; onToggleDarkMode: () => void }) => {
  const [sites, setSites] = useState<{ id: number; name: string }[]>([]);
  const navigate = useNavigate();

  const fetchSites = async () => {
    const res = await fetch('/api/sites');
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setSites(data);
      }
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDeleteSite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Admin: Are you sure you want to delete this team?')) return;
    try {
      const res = await fetch(`/api/site/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSites();
        alert('Site deleted successfully');
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.error || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting');
    }
  };

  return (
    <div className={cn("min-h-screen relative overflow-hidden transition-colors duration-300", darkMode ? "bg-slate-950" : "bg-slate-50")}>
      {/* Agricultural Pattern Background */}
      <div className={cn("absolute inset-0 pointer-events-none z-0 transition-opacity duration-300", darkMode ? "opacity-[0.05]" : "opacity-[0.03]")}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="leaf-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M50 20c-10 0-20 10-20 20s10 20 20 20 20-10 20-20-10-20-20-20zm0 35c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" fill="currentColor" />
              <path d="M50 60v20" stroke="currentColor" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaf-pattern)" className={darkMode ? "text-emerald-500" : "text-slate-900"} />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-6 border transition-colors", darkMode ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-50 text-emerald-600 border-emerald-100")}
          >
            Seniors 27 Cap: Smart Agriculture Edition
          </motion.div>
          <h1 className={cn("text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.85] transition-colors", darkMode ? "text-white" : "text-slate-900")}>
            Cultivate Your <br /> <span className="text-emerald-600">Digital Harvest.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12">
            The professional IoT dashboard for agricultural teams. Each project is isolated in its own dedicated configuration file for maximum reliability.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/auth" 
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              Get Started Now
            </Link>
            <a 
              href="#sites" 
              className={cn("px-10 py-4 border rounded-2xl font-bold text-lg transition-all", darkMode ? "bg-slate-900 text-white border-white/10 hover:bg-slate-800" : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50")}
            >
              Explore Teams
            </a>
          </div>
        </div>

        <div id="sites" className={cn("pt-24 border-t transition-colors", darkMode ? "border-white/10" : "border-slate-200")}>
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <h2 className={cn("text-3xl font-bold", darkMode ? "text-white" : "text-slate-900")}>Featured Projects</h2>
              <button 
                onClick={onToggleDarkMode}
                className={cn("p-2 rounded-full transition-colors", darkMode ? "text-yellow-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100")}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            <span className="text-slate-500">{sites.length} Teams Live</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sites.map(site => (
              <motion.div 
                key={site.id}
                whileHover={{ y: -5 }}
                className={cn("p-8 rounded-3xl border transition-all cursor-pointer group", darkMode ? "bg-slate-900 border-white/10 hover:border-emerald-500/50 shadow-2xl shadow-black/20" : "bg-white border-slate-100 shadow-sm hover:shadow-xl")}
                onClick={() => navigate(`/site/${site.name}`)}
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 transition-colors border", darkMode ? "bg-slate-800 text-emerald-400 border-slate-700 group-hover:bg-emerald-600 group-hover:text-white" : "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white")}>
                  {site.name[0]}
                </div>
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-2xl font-bold mb-2 group-hover:text-emerald-600 transition-colors", darkMode ? "text-white" : "text-slate-900")}>{site.name}</h3>
                  {isAdmin && (
                    <button 
                      onClick={(e) => handleDeleteSite(site.id, e)}
                      className={cn("p-2 rounded-lg transition-colors", darkMode ? "text-red-400 hover:bg-red-950/50" : "text-red-500 hover:bg-red-50")}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
                  <Settings size={12} />
                  {site.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json
                </div>
                <div className="flex items-center text-emerald-600 font-bold gap-2">
                  Launch Site <ChevronRight size={18} />
                </div>
              </motion.div>
            ))}
            {sites.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No projects created yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('seniors_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [dashboardDarkMode, setDashboardDarkMode] = useState(() => {
    const saved = localStorage.getItem('dashboardDarkMode');
    return saved === null ? true : saved === 'true';
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('seniors_admin') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('dashboardDarkMode', dashboardDarkMode.toString());
  }, [dashboardDarkMode]);

  useEffect(() => {
    localStorage.setItem('seniors_admin', isAdmin.toString());
  }, [isAdmin]);

  const handleAdminLogin = () => {
    setIsAdmin(true);
    alert('Admin access granted!');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    alert('Admin access revoked');
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('seniors_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('seniors_user');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('seniors_user', JSON.stringify(updatedUser));
  };

  return (
    <BrowserRouter>
      <div className={cn("min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-300", dashboardDarkMode ? "bg-slate-950" : "bg-white")}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar user={user} onLogout={handleLogout} isAdmin={isAdmin} onAdminLogin={handleAdminLogin} onAdminLogout={handleAdminLogout} darkMode={dashboardDarkMode} onToggleDarkMode={() => setDashboardDarkMode(!dashboardDarkMode)} /><LandingPage isAdmin={isAdmin} darkMode={dashboardDarkMode} onToggleDarkMode={() => setDashboardDarkMode(!dashboardDarkMode)} /></>} />
          <Route path="/auth" element={<><Navbar user={user} onLogout={handleLogout} isAdmin={isAdmin} onAdminLogin={handleAdminLogin} onAdminLogout={handleAdminLogout} darkMode={dashboardDarkMode} onToggleDarkMode={() => setDashboardDarkMode(!dashboardDarkMode)} /><Auth onLogin={handleLogin} darkMode={dashboardDarkMode} /></>} />
          <Route path="/site/:teamName" element={<TeamSite />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <><Navbar user={user} onLogout={handleLogout} isAdmin={isAdmin} onAdminLogin={handleAdminLogin} onAdminLogout={handleAdminLogout} darkMode={dashboardDarkMode} onToggleDarkMode={() => setDashboardDarkMode(!dashboardDarkMode)} /><Dashboard user={user} onUpdateUser={handleUpdateUser} darkMode={dashboardDarkMode} /></>
              ) : (
                <Auth onLogin={handleLogin} darkMode={dashboardDarkMode} />
              )
            } 
          />
          <Route 
            path="/editor" 
            element={
              user ? (
                <><Navbar user={user} onLogout={handleLogout} isAdmin={isAdmin} onAdminLogin={handleAdminLogin} onAdminLogout={handleAdminLogout} darkMode={dashboardDarkMode} onToggleDarkMode={() => setDashboardDarkMode(!dashboardDarkMode)} /><Editor user={user} onUpdateUser={handleUpdateUser} darkMode={dashboardDarkMode} onToggleDarkMode={setDashboardDarkMode} /></>
              ) : (
                <Auth onLogin={handleLogin} darkMode={dashboardDarkMode} />
              )
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
