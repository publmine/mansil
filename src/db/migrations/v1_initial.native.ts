import { CREATE_TABLES_SQL } from '../schema';
import { initialCreaturesSeed, initialPotsSeed } from '../seed/flowerSeeds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const STORAGE_KEY = '@greengrove_mandala_save_v2';

export async function runV1Migration(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_TABLES_SQL);

  const existingGame = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM game_state');
  if (existingGame && existingGame.count > 0) {
    return;
  }

  let migrated = false;
  try {
    const savedData = await AsyncStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);

      await db.runAsync(
        `INSERT OR REPLACE INTO game_state (id, score, current_pot_index, shown_messages, used_template_ids, bottle_ratios, mandala_colors)
         VALUES (1, ?, ?, ?, ?, ?, ?)`,
        [
          parsed.score ?? 250,
          parsed.currentPotIndex ?? 0,
          JSON.stringify(parsed.shownMessages || []),
          JSON.stringify(parsed.usedTemplateIds || []),
          JSON.stringify(parsed.bottleRatios || [0, 0, 0]),
          JSON.stringify(parsed.mandalaColors || {})
        ]
      );

      if (parsed.pots && Array.isArray(parsed.pots)) {
        for (const p of parsed.pots) {
          await db.runAsync(
            `INSERT OR REPLACE INTO pots (id, name, adj, noun, level, status, type, desc, color_ratios, colors, template_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.name || '',
              p.adj || '',
              p.noun || '',
              p.level || 0,
              p.status || 'locked',
              p.type || 'neutral',
              p.desc || '',
              JSON.stringify(p.colorRatios || {}),
              JSON.stringify(p.colors || []),
              p.templateId || null
            ]
          );

          if (p.diaries && typeof p.diaries === 'object') {
            for (const lvlKey of Object.keys(p.diaries)) {
              const d = p.diaries[lvlKey];
              if (d && d.content) {
                await db.runAsync(
                  `INSERT INTO diaries (pot_id, level, question, content, date) VALUES (?, ?, ?, ?, ?)`,
                  [p.id, Number(lvlKey), d.question || '', d.content || '', d.date || '']
                );
              }
            }
          }
        }
      }

      if (parsed.archive && Array.isArray(parsed.archive)) {
        for (const arch of parsed.archive) {
          await db.runAsync(
            `INSERT INTO archived_plants (name, date, type, desc, colors, template_id, diaries)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              arch.name || '',
              arch.date || '',
              arch.type || 'green',
              arch.desc || '',
              JSON.stringify(arch.colors || []),
              arch.templateId || null,
              JSON.stringify(arch.diaries || {})
            ]
          );
        }
      }

      await db.runAsync(
        `INSERT OR REPLACE INTO creatures (id, name, unlocked) VALUES ('butterfly', '나비', ?)`,
        [parsed.hasButterfly ? 1 : 0]
      );
      await db.runAsync(
        `INSERT OR REPLACE INTO creatures (id, name, unlocked) VALUES ('bee', '꿀벌', ?)`,
        [parsed.hasBee ? 1 : 0]
      );
      await db.runAsync(
        `INSERT OR REPLACE INTO creatures (id, name, unlocked) VALUES ('bird', '새', ?)`,
        [parsed.hasBird ? 1 : 0]
      );

      migrated = true;
    }
  } catch (e) {
    console.warn('AsyncStorage migration error:', e);
  }

  if (!migrated) {
    await db.runAsync(
      `INSERT OR REPLACE INTO game_state (id, score, current_pot_index, shown_messages, used_template_ids, bottle_ratios, mandala_colors)
       VALUES (1, 250, 0, '[]', '[]', '[0,0,0]', '{}')`
    );

    const initialPots = initialPotsSeed();
    for (const p of initialPots) {
      await db.runAsync(
        `INSERT OR REPLACE INTO pots (id, name, adj, noun, level, status, type, desc, color_ratios, colors, template_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.name, p.adj, p.noun, p.level, p.status, p.type, p.desc, '{}', '[]', p.templateId || null]
      );
    }

    for (const c of initialCreaturesSeed) {
      await db.runAsync(
        `INSERT OR REPLACE INTO creatures (id, name, unlocked) VALUES (?, ?, ?)`,
        [c.id, c.name, c.unlocked]
      );
    }
  }
}
