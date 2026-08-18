export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  score INTEGER NOT NULL DEFAULT 250,
  current_pot_index INTEGER NOT NULL DEFAULT 0,
  shown_messages TEXT NOT NULL DEFAULT '[]',
  used_template_ids TEXT NOT NULL DEFAULT '[]',
  bottle_ratios TEXT NOT NULL DEFAULT '[0,0,0]',
  mandala_colors TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS pots (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  adj TEXT DEFAULT '',
  noun TEXT DEFAULT '',
  level INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'locked',
  type TEXT NOT NULL DEFAULT 'neutral',
  desc TEXT DEFAULT '',
  color_ratios TEXT DEFAULT '{}',
  colors TEXT DEFAULT '[]',
  template_id TEXT
);

CREATE TABLE IF NOT EXISTS diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pot_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  question TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS archived_plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  desc TEXT DEFAULT '',
  colors TEXT DEFAULT '[]',
  template_id TEXT,
  diaries TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS creatures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unlocked INTEGER NOT NULL DEFAULT 0
);
`;
