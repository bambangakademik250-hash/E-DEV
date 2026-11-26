import { openDB, type IDBPDatabase } from 'idb';
import type { Workspace } from '../types';

const DB_NAME = 'eujian_nusantara';
const DB_VERSION = 1;
const STORE = 'workspace';
const KEY = 'main';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function readWorkspace(): Promise<Workspace | null> {
  const db = await getDb();
  const value = (await db.get(STORE, KEY)) as Workspace | undefined;
  return value ?? null;
}

export async function writeWorkspace(workspace: Workspace): Promise<void> {
  const db = await getDb();
  await db.put(STORE, workspace, KEY);
}
