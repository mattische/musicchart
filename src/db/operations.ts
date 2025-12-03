import { db, SavedChart, Setlist, SetlistItem } from './database';
import { Song } from '../types/song';

// ============================================
// CHART OPERATIONS
// ============================================

export async function saveChart(song: Song): Promise<string> {
  const chart: SavedChart = {
    ...song,
    createdAt: song.createdAt.getTime(),
    updatedAt: Date.now()
  };

  await db.charts.put(chart);
  return chart.id;
}

export async function getChart(id: string): Promise<Song | undefined> {
  const chart = await db.charts.get(id);
  if (!chart) return undefined;

  return {
    ...chart,
    createdAt: new Date(chart.createdAt),
    updatedAt: new Date(chart.updatedAt)
  };
}

export async function deleteChart(id: string): Promise<void> {
  // Delete chart
  await db.charts.delete(id);

  // Delete all setlist items referencing this chart
  await db.setlistItems.where('chartId').equals(id).delete();
}

export async function getAllCharts(): Promise<Song[]> {
  const charts = await db.charts.orderBy('updatedAt').reverse().toArray();

  return charts.map(chart => ({
    ...chart,
    createdAt: new Date(chart.createdAt),
    updatedAt: new Date(chart.updatedAt)
  }));
}

export async function searchCharts(query: string): Promise<Song[]> {
  const allCharts = await getAllCharts();

  if (!query.trim()) return allCharts;

  const lowerQuery = query.toLowerCase();
  return allCharts.filter(chart =>
    chart.metadata.title.toLowerCase().includes(lowerQuery) ||
    chart.metadata.key.toLowerCase().includes(lowerQuery) ||
    chart.metadata.style?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// SETLIST OPERATIONS
// ============================================

export async function createSetlist(name: string): Promise<string> {
  const id = `setlist-${Date.now()}`;
  await db.setlists.add({
    id,
    name,
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return id;
}

export async function updateSetlist(id: string, name: string): Promise<void> {
  await db.setlists.update(id, {
    name,
    updatedAt: Date.now()
  });
}

export async function deleteSetlist(id: string): Promise<void> {
  const setlist = await db.setlists.get(id);

  // Don't allow deleting default setlist
  if (setlist?.isDefault) {
    throw new Error('Cannot delete default setlist');
  }

  // Delete setlist
  await db.setlists.delete(id);

  // Delete all items in this setlist
  await db.setlistItems.where('setlistId').equals(id).delete();
}

export async function getAllSetlists(): Promise<Setlist[]> {
  return db.setlists.orderBy('name').toArray();
}

export async function getDefaultSetlist(): Promise<Setlist | undefined> {
  return db.setlists.where('isDefault').equals(1).first();
}

// ============================================
// SETLIST ITEM OPERATIONS
// ============================================

export async function addChartToSetlist(
  chartId: string,
  setlistId: string
): Promise<void> {
  // Check if already in setlist
  const existing = await db.setlistItems
    .where('[setlistId+chartId]')
    .equals([setlistId, chartId])
    .first();

  if (existing) return; // Already in setlist

  // Get max order for this setlist
  const items = await db.setlistItems.where('setlistId').equals(setlistId).toArray();
  const maxOrder = items.reduce((max, item) => Math.max(max, item.order), 0);

  await db.setlistItems.add({
    id: `item-${Date.now()}-${Math.random()}`,
    setlistId,
    chartId,
    order: maxOrder + 1,
    addedAt: Date.now()
  });
}

export async function removeChartFromSetlist(
  chartId: string,
  setlistId: string
): Promise<void> {
  await db.setlistItems
    .where('[setlistId+chartId]')
    .equals([setlistId, chartId])
    .delete();
}

export async function getChartsInSetlist(setlistId: string): Promise<Song[]> {
  const items = await db.setlistItems
    .where('setlistId')
    .equals(setlistId)
    .sortBy('order');

  const charts: Song[] = [];
  for (const item of items) {
    const chart = await getChart(item.chartId);
    if (chart) charts.push(chart);
  }

  return charts;
}

export async function updateSetlistItemOrder(
  setlistId: string,
  chartIds: string[]
): Promise<void> {
  const items = await db.setlistItems.where('setlistId').equals(setlistId).toArray();

  for (let i = 0; i < chartIds.length; i++) {
    const item = items.find(it => it.chartId === chartIds[i]);
    if (item) {
      await db.setlistItems.update(item.id, { order: i });
    }
  }
}

export async function getSetlistsForChart(chartId: string): Promise<Setlist[]> {
  const items = await db.setlistItems.where('chartId').equals(chartId).toArray();
  const setlistIds = items.map(item => item.setlistId);

  const setlists: Setlist[] = [];
  for (const id of setlistIds) {
    const setlist = await db.setlists.get(id);
    if (setlist) setlists.push(setlist);
  }

  return setlists;
}

// ============================================
// EXPORT / IMPORT
// ============================================

export interface ExportData {
  version: number;
  exportedAt: number;
  charts: SavedChart[];
  setlists: Setlist[];
  setlistItems: SetlistItem[];
}

export async function exportAllData(): Promise<ExportData> {
  const charts = await db.charts.toArray();
  const setlists = await db.setlists.toArray();
  const setlistItems = await db.setlistItems.toArray();

  return {
    version: 1,
    exportedAt: Date.now(),
    charts,
    setlists,
    setlistItems
  };
}

export async function importData(data: ExportData): Promise<void> {
  // Import charts (merge by ID)
  for (const chart of data.charts) {
    await db.charts.put(chart);
  }

  // Import setlists (skip default if already exists, merge others)
  for (const setlist of data.setlists) {
    if (setlist.isDefault) {
      const existing = await getDefaultSetlist();
      if (existing) continue; // Skip default if already exists
    }
    await db.setlists.put(setlist);
  }

  // Import setlist items
  for (const item of data.setlistItems) {
    await db.setlistItems.put(item);
  }
}
