// db.ts
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Check if database configuration exists
const usePostgres = !!(process.env.DATABASE_URL || process.env.PGHOST);
let pool: pg.Pool | null = null;

if (usePostgres) {
  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'intellmeet',
        port: parseInt(process.env.PGPORT || '5432'),
      };

  pool = new Pool({
    ...config,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

// In-Memory Database Fallback for smooth local execution
class InMemoryDatabase {
  users: any[] = [];
  meetings: any[] = [];
  meeting_participants: any[] = [];
  meeting_messages: any[] = [];
  transcripts: any[] = [];
  meeting_analytics: any[] = [];
  tasks: any[] = [];
  documents: any[] = [];
  workspace_channels: any[] = [];
  workspace_messages: any[] = [];
  workspace_assets: any[] = [];
  notifications: any[] = [];
  activity_logs: any[] = [];
  sentiment_scores: any[] = [];
  meeting_insights: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // Seed general settings
    this.workspace_channels = [
      { id: 'ch-1', name: 'ux-design', unread: true },
      { id: 'ch-2', name: 'ai-summaries', unread: false },
      { id: 'ch-3', name: 'engineering-logs', unread: false },
      { id: 'ch-4', name: 'general-sync', unread: false }
    ];

    this.workspace_assets = [
      { id: 'f-1', name: 'ux-guidelines.pdf', size: '1.2 MB', type: 'PDF', timestamp: '2 hours ago' },
      { id: 'f-2', name: 'meeting-dna-sync.json', size: '45 KB', type: 'JSON', timestamp: '4 hours ago' },
      { id: 'f-3', name: 'orb-system-spec.sketch', size: '18.4 MB', type: 'SKETCH', timestamp: 'Yesterday' }
    ];

    this.documents = [
      {
        id: 'doc-1',
        title: 'Design System Guidelines',
        last_updated: '2 hours ago',
        author: 'Sarah Connor',
        content: `## Design System & Theme Directives

IntellMeet integrates the design language of Apple Vision Pro and Linear:
- **Background**: Deep Space Space (#070B14)
- **Surfaces**: Glass Panels with backdrop filters (blur: 20px, border: 1px white/8)
- **Accent Palette**: 
  - Primary Violet (#6D5DFC)
  - Secondary Cyan (#00D4FF)
  - Accent Mint (#00FFA3)

### Components Checklist
- [x] Integrate Recharts in DNA page
- [x] Configure Tailwind CSS v4 variables
- [ ] Implement hover spotlights on feature cards`
      },
      {
        id: 'doc-2',
        title: 'Sprint 3 Retrospective notes',
        last_updated: '5 hours ago',
        author: 'Julian Carter',
        content: `## Retrospective: Sprint 3 Retrospective

### What went well:
- Initializing the Vite TS build was seamless.
- Setting up the Zustand store allowed cross-page data linking.

### Challenges:
- Strict TypeScript locals blocked production bundling during unused import evaluations.

### Actions:
- [x] Set verbatim module syntax directives.
- [ ] Refactor Kanban dragging with Framer Motion.`
      }
    ];

    this.tasks = [
      {
        id: 'task-1',
        title: 'Finalize UX specifications for Arc-based sidebar',
        description: 'Ensure layout is glassmorphic with proper visual padding and fits Apple Vision Pro aesthetic.',
        assignee_name: 'Sarah Connor',
        assignee_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80',
        priority: 'high',
        deadline: 'June 8, 2026',
        status: 'todo'
      },
      {
        id: 'task-2',
        title: 'Integrate Recharts components into Meeting DNA',
        description: 'Verify radar chart configurations and alignment with HSL color tokens.',
        assignee_name: 'Alex Rivera',
        assignee_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
        priority: 'medium',
        deadline: 'June 10, 2026',
        status: 'in-progress'
      },
      {
        id: 'task-3',
        title: 'Debug Framer Motion layout shift on Auth screens',
        description: 'Resolve split screen animations snapping during transitions.',
        assignee_name: 'Elena Rostova',
        assignee_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80',
        priority: 'low',
        deadline: 'June 6, 2026',
        status: 'review'
      },
      {
        id: 'task-4',
        title: 'Configure Tailwind v4 theme variables',
        description: 'Bind color hex codes for Deep Space Background and Neon Accent colors.',
        assignee_name: 'Vercel Architect',
        assignee_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&q=80',
        priority: 'high',
        deadline: 'June 4, 2026',
        status: 'done'
      }
    ];

    this.activity_logs = [
      { id: 'act-1', user_name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80', action: 'created design guidelines document', time: '2 hours ago' },
      { id: 'act-2', user_name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80', action: 'updated meeting-dna-sync.json file', time: '4 hours ago' },
      { id: 'act-3', user_name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80', action: 'completed UX layout code review', time: '5 hours ago' }
    ];
  }
}

export const dbMemory = new InMemoryDatabase();

// Execute a SQL query either in PostgreSQL or InMemory simulation
export const query = async (text: string, params: any[] = []): Promise<{ rows: any[] }> => {
  if (pool) {
    try {
      const result = await pool.query(text, params);
      return { rows: result.rows };
    } catch (err) {
      console.error('Postgres Query Error. Falling back to InMemory engine...', err);
    }
  }

  // Basic SQL simulation engine for in-memory data
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
  
  if (normalizedText.includes('insert into users')) {
    // INSERT INTO users(id, email, name, avatar, role, company) VALUES(...)
    const id = params[0];
    const email = params[1];
    const name = params[2];
    const avatar = params[3];
    const role = params[4];
    const company = params[5];
    const newUser = { id, email, name, avatar, role, company, created_at: new Date() };
    dbMemory.users = dbMemory.users.filter(u => u.id !== id);
    dbMemory.users.push(newUser);
    return { rows: [newUser] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from users')) {
    if (normalizedText.includes('where id =') || normalizedText.includes('where id = $1')) {
      const id = params[0];
      const match = dbMemory.users.find(u => u.id === id);
      return { rows: match ? [match] : [] };
    }
    return { rows: dbMemory.users };
  }

  if (normalizedText.includes('insert into tasks')) {
    const [id, meeting_id, title, description, assignee_name, assignee_avatar, priority, deadline, status] = params;
    const newTask = { id, meeting_id, title, description, assignee_name, assignee_avatar, priority, deadline, status, created_at: new Date() };
    dbMemory.tasks.push(newTask);
    return { rows: [newTask] };
  }

  if (normalizedText.includes('update tasks set status =')) {
    const [newStatus, id] = params;
    const task = dbMemory.tasks.find(t => t.id === id);
    if (task) task.status = newStatus;
    return { rows: task ? [task] : [] };
  }

  if (normalizedText.includes('delete from tasks')) {
    const id = params[0];
    dbMemory.tasks = dbMemory.tasks.filter(t => t.id !== id);
    return { rows: [] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from tasks')) {
    return { rows: dbMemory.tasks };
  }

  if (normalizedText.includes('insert into documents')) {
    const [id, title, content, author, last_updated] = params;
    const newDoc = { id, title, content, author, last_updated, created_at: new Date() };
    dbMemory.documents.push(newDoc);
    return { rows: [newDoc] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from documents')) {
    return { rows: dbMemory.documents };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from workspace_channels')) {
    return { rows: dbMemory.workspace_channels };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from activity_logs')) {
    return { rows: dbMemory.activity_logs };
  }

  if (normalizedText.includes('insert into meetings')) {
    const [id, title, status] = params;
    const newMeeting = { id, title, status, created_at: new Date(), duration: 0 };
    dbMemory.meetings.push(newMeeting);
    return { rows: [newMeeting] };
  }

  if (normalizedText.includes('update meetings set status =') || normalizedText.includes('update meetings set duration =')) {
    // Simple update simulation
    const meeting = dbMemory.meetings.find(m => m.id === params[1] || m.id === params[0]);
    if (meeting) {
      if (normalizedText.includes('status')) meeting.status = params[0];
      if (normalizedText.includes('duration')) meeting.duration = params[0];
    }
    return { rows: meeting ? [meeting] : [] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from meetings')) {
    if (normalizedText.includes('where id =')) {
      const id = params[0];
      const match = dbMemory.meetings.find(m => m.id === id);
      return { rows: match ? [match] : [] };
    }
    return { rows: dbMemory.meetings };
  }

  if (normalizedText.includes('insert into transcripts')) {
    const [id, meeting_id, speaker_name, text] = params;
    const newT = { id, meeting_id, speaker_name, text, timestamp: new Date() };
    dbMemory.transcripts.push(newT);
    return { rows: [newT] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from transcripts')) {
    const meeting_id = params[0];
    const matches = dbMemory.transcripts.filter(t => t.meeting_id === meeting_id);
    return { rows: matches };
  }

  if (normalizedText.includes('insert into meeting_analytics')) {
    const [meeting_id, pos, neu, neg, str, eng, col, dec, foc, ene, bal, act] = params;
    const newAna = { 
      meeting_id, 
      positive_percent: pos, 
      neutral_percent: neu, 
      negative_percent: neg, 
      stress_percent: str, 
      engagement_percent: eng, 
      collaboration_percent: col, 
      decision_quality: dec, 
      focus_score: foc, 
      energy_score: ene,
      participation_balance: bal,
      actionability: act
    };
    dbMemory.meeting_analytics = dbMemory.meeting_analytics.filter(a => a.meeting_id !== meeting_id);
    dbMemory.meeting_analytics.push(newAna);
    return { rows: [newAna] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from meeting_analytics')) {
    const meeting_id = params[0];
    const match = dbMemory.meeting_analytics.find(a => a.meeting_id === meeting_id);
    return { rows: match ? [match] : [] };
  }

  if (normalizedText.includes('insert into meeting_insights')) {
    const [id, meeting_id, text] = params;
    const newInsight = { id, meeting_id, text, timestamp: new Date() };
    dbMemory.meeting_insights.push(newInsight);
    return { rows: [newInsight] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from meeting_insights')) {
    const meeting_id = params[0];
    return { rows: dbMemory.meeting_insights.filter(i => i.meeting_id === meeting_id) };
  }

  if (normalizedText.includes('insert into workspace_messages')) {
    const [id, channel_id, sender, avatar, text, timestamp] = params;
    const newMsg = { id, channel_id, sender, avatar, text, timestamp };
    dbMemory.workspace_messages.push(newMsg);
    return { rows: [newMsg] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from workspace_messages')) {
    const channel_id = params[0];
    return { rows: dbMemory.workspace_messages.filter(m => m.channel_id === channel_id) };
  }

  if (normalizedText.includes('insert into notifications')) {
    const [id, user_id, type, text] = params;
    const newNotif = { id, user_id, type, text, is_read: false, timestamp: new Date() };
    dbMemory.notifications.push(newNotif);
    return { rows: [newNotif] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from notifications')) {
    return { rows: dbMemory.notifications };
  }

  if (normalizedText.includes('update notifications set is_read =')) {
    const id = params[0];
    const notif = dbMemory.notifications.find(n => n.id === id);
    if (notif) notif.is_read = true;
    return { rows: [] };
  }

  if (normalizedText.includes('select') && normalizedText.includes('from workspace_assets')) {
    return { rows: dbMemory.workspace_assets };
  }

  if (normalizedText.includes('insert into workspace_assets')) {
    const [id, name, size, type, timestamp] = params;
    const newAsset = { id, name, size, type, timestamp, created_at: new Date() };
    dbMemory.workspace_assets.push(newAsset);
    return { rows: [newAsset] };
  }

  return { rows: [] };
};

// Auto run migrations if Postgres is active
export const initDb = async () => {
  if (!pool) {
    console.log('Using in-memory database simulation.');
    return;
  }
  
  try {
    const sqlFilePath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(sqlFilePath)) {
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      await pool.query(sql);
      console.log('PostgreSQL database migration completed successfully.');
    } else {
      console.log('PostgreSQL active, but schema.sql file not found.');
    }
  } catch (err) {
    console.error('Failed to run schema migrations on Postgres:', err);
    console.log('Reverting database engine to Memory simulation.');
    pool = null;
  }
};
