import Dexie, { Table } from 'dexie';
import { Song } from '../types/song';

// Extended Song type for database storage
export interface SavedChart extends Omit<Song, 'createdAt' | 'updatedAt'> {
  createdAt: number; // Store as timestamp
  updatedAt: number; // Store as timestamp
}

export interface Setlist {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SetlistItem {
  id: string;
  setlistId: string;
  chartId: string;
  order: number;
  addedAt: number;
}

export class MusicChartDatabase extends Dexie {
  charts!: Table<SavedChart, string>;
  setlists!: Table<Setlist, string>;
  setlistItems!: Table<SetlistItem, string>;

  constructor() {
    super('MusicChartDB');

    this.version(1).stores({
      charts: 'id, updatedAt',
      setlists: 'id, name, isDefault, updatedAt',
      setlistItems: 'id, setlistId, chartId, [setlistId+chartId], order, addedAt'
    });
  }
}

export const db = new MusicChartDatabase();

// Initialize default setlist
export async function initializeDefaultSetlist() {
  const existing = await db.setlists.where('isDefault').equals(1).first();

  if (!existing) {
    await db.setlists.add({
      id: 'default-setlist',
      name: 'Default',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
}

// Initialize on import
initializeDefaultSetlist();
