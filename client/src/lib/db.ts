import { openDB, type IDBPDatabase } from 'idb';
import type { EntityName, Peserta, Ujian } from '../types';

export interface OutboxOp {
  opId?: number;
  entity: EntityName;
  type: 'upsert' | 'delete';
  id: string;
  data?: Peserta | Ujian;
  ts: number;
}

const DB_NAME = 'e-ujian-cbt';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore('peserta', { keyPath: 'id' });
        database.createObjectStore('ujian', { keyPath: 'id' });
        database.createObjectStore('outbox', { keyPath: 'opId', autoIncrement: true });
      },
    });
  }
  return dbPromise;
}

export async function getAll<T>(store: EntityName): Promise<T[]> {
  const db = await getDb();
  return (await db.getAll(store)) as T[];
}

export async function put(store: EntityName, record: Peserta | Ujian): Promise<void> {
  const db = await getDb();
  await db.put(store, record);
}

export async function remove(store: EntityName, id: string): Promise<void> {
  const db = await getDb();
  await db.delete(store, id);
}

export async function replaceAll(store: EntityName, records: (Peserta | Ujian)[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(store, 'readwrite');
  await tx.store.clear();
  for (const record of records) {
    void tx.store.put(record);
  }
  await tx.done;
}

export async function queueOp(op: OutboxOp): Promise<void> {
  const db = await getDb();
  await db.add('outbox', op);
}

export async function readOutbox(): Promise<OutboxOp[]> {
  const db = await getDb();
  const ops = (await db.getAll('outbox')) as OutboxOp[];
  return ops.sort((a, b) => (a.opId ?? 0) - (b.opId ?? 0));
}

export async function removeOps(ids: number[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('outbox', 'readwrite');
  for (const id of ids) {
    void tx.store.delete(id);
  }
  await tx.done;
}
