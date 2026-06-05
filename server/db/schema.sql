-- schema.sql
-- Create database schema for IntellMeet SaaS platform

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  role VARCHAR(255),
  company VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active' or 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INTEGER DEFAULT 0 -- in seconds
);

CREATE TABLE IF NOT EXISTS meeting_participants (
  meeting_id VARCHAR(100) REFERENCES meetings(id) ON DELETE CASCADE,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS meeting_messages (
  id VARCHAR(100) PRIMARY KEY,
  meeting_id VARCHAR(100) REFERENCES meetings(id) ON DELETE CASCADE,
  sender_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transcripts (
  id VARCHAR(100) PRIMARY KEY,
  meeting_id VARCHAR(100) REFERENCES meetings(id) ON DELETE CASCADE,
  speaker_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meeting_analytics (
  meeting_id VARCHAR(100) REFERENCES meetings(id) ON DELETE CASCADE PRIMARY KEY,
  positive_percent INTEGER DEFAULT 0,
  neutral_percent INTEGER DEFAULT 0,
  negative_percent INTEGER DEFAULT 0,
  stress_percent INTEGER DEFAULT 0,
  engagement_percent INTEGER DEFAULT 0,
  collaboration_percent INTEGER DEFAULT 0,
  decision_quality INTEGER DEFAULT 0,
  focus_score INTEGER DEFAULT 0,
  energy_score INTEGER DEFAULT 0,
  participation_balance INTEGER DEFAULT 0,
  actionability INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(100) PRIMARY KEY,
  meeting_id VARCHAR(100) REFERENCES meetings(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assignee_name VARCHAR(255),
  assignee_avatar VARCHAR(500),
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
  deadline VARCHAR(100),
  status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in-progress', 'review', 'done'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  last_updated VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspace_channels (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unread BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS workspace_messages (
  id VARCHAR(100) PRIMARY KEY,
  channel_id VARCHAR(100) REFERENCES workspace_channels(id) ON DELETE CASCADE,
  sender VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  text TEXT NOT NULL,
  timestamp VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'info', -- 'success', 'info', 'warning'
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspace_assets (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  size VARCHAR(100),
  type VARCHAR(100),
  timestamp VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(100) PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  action TEXT NOT NULL,
  time VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS sentiment_scores (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(100) REFERENCES meetings(id) ON DELETE CASCADE,
  positive INTEGER DEFAULT 0,
  neutral INTEGER DEFAULT 0,
  negative INTEGER DEFAULT 0,
  stress INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  collaboration INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meeting_insights (
  id VARCHAR(100) PRIMARY KEY,
  meeting_id VARCHAR(100) REFERENCES meetings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
