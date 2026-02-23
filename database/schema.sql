-- FluentAI Database Schema Reference
-- MongoDB collections represented as relational schema for documentation

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  _id VARCHAR(24) PRIMARY KEY,        -- MongoDB ObjectId
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  anonymous_name VARCHAR(50),          -- Used in community
  age INTEGER,
  stammering_level ENUM('Mild','Moderate','Severe','Prefer not to say'),
  primary_goals JSON,                  -- Array of strings
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  last_practice_date DATETIME,
  badges JSON,                         -- Array of badge IDs
  total_sessions INTEGER DEFAULT 0,
  baseline_confidence FLOAT,
  current_confidence FLOAT DEFAULT 0,
  total_practice_minutes INTEGER DEFAULT 0,
  accessibility JSON,                  -- dark_mode, large_text, etc.
  created_at DATETIME,
  updated_at DATETIME
);

-- ============================================================
-- SPEECH ANALYSES
-- ============================================================
CREATE TABLE speech_analyses (
  _id VARCHAR(24) PRIMARY KEY,
  user_id VARCHAR(24) NOT NULL REFERENCES users(_id),
  session_type ENUM('analysis','coaching','roleplay') DEFAULT 'analysis',
  transcript TEXT,
  expected_text TEXT,
  duration_seconds INTEGER,
  audio_url VARCHAR(500),
  confidence_score FLOAT,
  fluency_rate FLOAT,
  speech_rate_wpm INTEGER,
  blocks INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  prolongations INTEGER DEFAULT 0,
  filler_words INTEGER DEFAULT 0,
  voice_tremor FLOAT DEFAULT 0,
  radar_data JSON,                     -- [{metric, score}, ...]
  situation VARCHAR(200),
  emotional_state VARCHAR(100),
  anxiety_level INTEGER,               -- 1-10
  suggestions JSON,                    -- Array of strings
  recommended_exercises JSON,          -- Array of strings
  created_at DATETIME
);
CREATE INDEX idx_analyses_user_date ON speech_analyses(user_id, created_at DESC);

-- ============================================================
-- THERAPY SESSIONS
-- ============================================================
CREATE TABLE therapy_sessions (
  _id VARCHAR(24) PRIMARY KEY,
  user_id VARCHAR(24) NOT NULL REFERENCES users(_id),
  exercise_id VARCHAR(100),
  exercise_name VARCHAR(200),
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  xp_earned INTEGER DEFAULT 0,
  created_at DATETIME
);

-- ============================================================
-- ROLEPLAY SESSIONS
-- ============================================================
CREATE TABLE roleplay_sessions (
  _id VARCHAR(24) PRIMARY KEY,
  user_id VARCHAR(24) NOT NULL REFERENCES users(_id),
  scenario VARCHAR(100),
  exchanges INTEGER DEFAULT 0,
  avg_fluency FLOAT,
  duration_seconds INTEGER,
  messages JSON,                       -- [{role, content, timestamp}]
  feedback JSON,                       -- Array of feedback strings
  xp_earned INTEGER DEFAULT 0,
  created_at DATETIME
);

-- ============================================================
-- SITUATION LOGS (Anxiety Intelligence)
-- ============================================================
CREATE TABLE situation_logs (
  _id VARCHAR(24) PRIMARY KEY,
  user_id VARCHAR(24) NOT NULL REFERENCES users(_id),
  situation VARCHAR(300),
  emotional_state VARCHAR(100),
  anxiety_level INTEGER,
  fluency_felt INTEGER,                -- 1-5 scale
  notes TEXT,
  created_at DATETIME
);
CREATE INDEX idx_logs_user_date ON situation_logs(user_id, created_at DESC);

-- ============================================================
-- COMMUNITY POSTS
-- ============================================================
CREATE TABLE community_posts (
  _id VARCHAR(24) PRIMARY KEY,
  author_id VARCHAR(24) NOT NULL REFERENCES users(_id),
  anonymous_name VARCHAR(50),          -- Display name
  room VARCHAR(100),
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  moderated BOOLEAN DEFAULT FALSE,
  toxicity_score FLOAT DEFAULT 0,
  created_at DATETIME
);

-- ============================================================
-- WEEKLY REPORTS
-- ============================================================
CREATE TABLE weekly_reports (
  _id VARCHAR(24) PRIMARY KEY,
  user_id VARCHAR(24) NOT NULL REFERENCES users(_id),
  week_start DATE,
  week_end DATE,
  avg_confidence FLOAT,
  fluency_improvement FLOAT,
  anxiety_reduction FLOAT,
  sessions_completed INTEGER,
  exercises_completed INTEGER,
  ai_recommendations JSON,
  generated_at DATETIME
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user ON therapy_sessions(user_id, created_at);
CREATE INDEX idx_posts_room ON community_posts(room, created_at DESC);
CREATE INDEX idx_logs_situation ON situation_logs(user_id, situation);
