import { ArchivedPlant, Pot } from '@/domain/pot';
import { IPotRepository } from '../interfaces/IPotRepository';
import * as SQLite from 'expo-sqlite';

export class SQLitePotRepository implements IPotRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getAllPots(): Promise<Pot[]> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM pots ORDER BY id ASC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      adj: r.adj || '',
      noun: r.noun || '',
      level: r.level,
      status: r.status,
      type: r.type,
      desc: r.desc || '',
      colorRatios: r.color_ratios ? JSON.parse(r.color_ratios) : {},
      colors: r.colors ? JSON.parse(r.colors) : [],
      templateId: r.template_id || undefined,
      stepMandalas: r.step_mandalas ? JSON.parse(r.step_mandalas) : {}
    }));
  }

  async getPotById(id: number): Promise<Pot | null> {
    const r = await this.db.getFirstAsync<any>('SELECT * FROM pots WHERE id = ?', [id]);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      adj: r.adj || '',
      noun: r.noun || '',
      level: r.level,
      status: r.status,
      type: r.type,
      desc: r.desc || '',
      colorRatios: r.color_ratios ? JSON.parse(r.color_ratios) : {},
      colors: r.colors ? JSON.parse(r.colors) : [],
      templateId: r.template_id || undefined,
      stepMandalas: r.step_mandalas ? JSON.parse(r.step_mandalas) : {}
    };
  }

  async savePot(pot: Pot): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO pots (id, name, adj, noun, level, status, type, desc, color_ratios, colors, template_id, step_mandalas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pot.id,
        pot.name,
        pot.adj || '',
        pot.noun || '',
        pot.level,
        pot.status,
        pot.type,
        pot.desc || '',
        JSON.stringify(pot.colorRatios || {}),
        JSON.stringify(pot.colors || []),
        pot.templateId || null,
        JSON.stringify(pot.stepMandalas || {})
      ]
    );
  }

  async saveAllPots(pots: Pot[]): Promise<void> {
    for (const pot of pots) {
      await this.savePot(pot);
    }
  }

  async getArchive(): Promise<ArchivedPlant[]> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM archived_plants ORDER BY id ASC');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      date: r.date,
      type: r.type,
      desc: r.desc || '',
      colors: r.colors ? JSON.parse(r.colors) : [],
      templateId: r.template_id || undefined,
      diaries: r.diaries ? JSON.parse(r.diaries) : {},
      stepMandalas: r.step_mandalas ? JSON.parse(r.step_mandalas) : {}
    }));
  }

  async addArchive(plant: ArchivedPlant): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO archived_plants (name, date, type, desc, colors, template_id, diaries, step_mandalas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plant.name,
        plant.date,
        plant.type,
        plant.desc || '',
        JSON.stringify(plant.colors || []),
        plant.templateId || null,
        JSON.stringify(plant.diaries || {}),
        JSON.stringify(plant.stepMandalas || {})
      ]
    );
  }

  async clearAllPotsAndArchive(): Promise<void> {
    await this.db.runAsync('DELETE FROM pots');
    await this.db.runAsync('DELETE FROM archived_plants');
  }
}
