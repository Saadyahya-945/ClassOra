import { db, SyncQueueItem } from '../db/dexie';
import { createClient } from '../supabase/client';

export type SyncState = 'synced' | 'pending' | 'syncing' | 'offline';

type SyncListener = (state: SyncState, pendingCount: number) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private isProcessing = false;
  private currentStatus: SyncState = 'synced';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        this.notify('offline', 0);
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.updatePendingCount();
    return () => this.listeners.delete(listener);
  }

  private notify(state: SyncState, count: number) {
    this.currentStatus = state;
    this.listeners.forEach((fn) => fn(state, count));
  }

  public async updatePendingCount() {
    try {
      const count = await db.syncQueue.where('status').equals('pending').count();
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.notify('offline', count);
      } else if (count > 0) {
        this.notify('pending', count);
      } else {
        this.notify('synced', 0);
      }
    } catch {
      // IndexedDB might not be initialized yet
    }
  }

  public async queueMutation(
    table: string,
    operation: 'upsert' | 'delete',
    payload: Record<string, unknown>
  ): Promise<string> {
    const client_mutation_id = crypto.randomUUID ? crypto.randomUUID() : `mut_${Date.now()}_${Math.random()}`;

    const queueItem: SyncQueueItem = {
      table,
      operation,
      payload: { ...payload, client_mutation_id },
      client_mutation_id,
      status: 'pending',
      createdAt: Date.now(),
    };

    await db.syncQueue.add(queueItem);
    await this.updatePendingCount();

    // Trigger sync in background if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.triggerSync();
    }

    return client_mutation_id;
  }

  public async triggerSync() {
    if (this.isProcessing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const count = await db.syncQueue.where('status').equals('pending').count();
      this.notify('offline', count);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      // Supabase env is not configured, remain locally synced
      const count = await db.syncQueue.where('status').equals('pending').count();
      if (count > 0) {
        // Mark as synced locally
        await db.syncQueue.clear();
      }
      this.notify('synced', 0);
      return;
    }

    this.isProcessing = true;
    try {
      const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
      if (pendingItems.length === 0) {
        this.notify('synced', 0);
        this.isProcessing = false;
        return;
      }

      this.notify('syncing', pendingItems.length);

      for (const item of pendingItems) {
        try {
          if (item.operation === 'upsert') {
            let conflictTarget = 'id';
            if (item.table === 'attendance_records') {
              conflictTarget = 'session_id,enrollment_id';
            } else if (item.table === 'assessment_scores') {
              conflictTarget = 'assessment_id,enrollment_id';
            }

            const { error } = await supabase
              .from(item.table)
              .upsert(item.payload, { onConflict: conflictTarget });

            if (error) throw error;
          } else if (item.operation === 'delete') {
            const { error } = await supabase
              .from(item.table)
              .delete()
              .eq('id', item.payload.id as string);

            if (error) throw error;
          }

          if (item.id) {
            await db.syncQueue.delete(item.id);
          }
        } catch {
          if (item.id) {
            await db.syncQueue.update(item.id, { status: 'failed' });
          }
        }
      }

      await this.updatePendingCount();
    } finally {
      this.isProcessing = false;
    }
  }
}

export const syncEngine = new SyncEngine();
