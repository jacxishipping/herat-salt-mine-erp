import {
  AttendanceRecord,
  ExtractionLog,
  HseIncident,
  WeighbridgeTicket,
} from "@/types/erp";

const DB_NAME = "herat_salt_erp_v2";
const DB_VERSION = 2;
const STORE_TICKETS = "pending_tickets";
const STORE_EXTRACTIONS = "pending_extractions";
const STORE_ATTENDANCE = "pending_attendance";
const STORE_HSE = "pending_hse";

function openErpDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      [STORE_TICKETS, STORE_EXTRACTIONS, STORE_ATTENDANCE, STORE_HSE].forEach(
        (store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "clientSyncId" });
          }
        }
      );
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putRecord(storeName: string, record: unknown): Promise<void> {
  const db = await openErpDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllRecords<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function queueOfflineTicket(ticket: WeighbridgeTicket) {
  return putRecord(STORE_TICKETS, ticket);
}

export async function queueOfflineExtraction(log: ExtractionLog) {
  return putRecord(STORE_EXTRACTIONS, log);
}

export async function queueOfflineAttendance(rec: AttendanceRecord) {
  return putRecord(STORE_ATTENDANCE, rec);
}

export async function queueOfflineHse(inc: HseIncident) {
  return putRecord(STORE_HSE, inc);
}

export async function getPendingQueue(): Promise<{
  tickets: WeighbridgeTicket[];
  extractions: ExtractionLog[];
  attendance: AttendanceRecord[];
  hse: HseIncident[];
}> {
  try {
    const db = await openErpDb();
    const [tickets, extractions, attendance, hse] = await Promise.all([
      getAllRecords<WeighbridgeTicket>(db, STORE_TICKETS),
      getAllRecords<ExtractionLog>(db, STORE_EXTRACTIONS),
      getAllRecords<AttendanceRecord>(db, STORE_ATTENDANCE),
      getAllRecords<HseIncident>(db, STORE_HSE),
    ]);
    return { tickets, extractions, attendance, hse };
  } catch {
    return { tickets: [], extractions: [], attendance: [], hse: [] };
  }
}

export async function clearSyncedQueue(
  syncedTicketSyncIds: string[],
  syncedExtractionSyncIds: string[],
  syncedAttendanceSyncIds: string[] = [],
  syncedHseSyncIds: string[] = []
): Promise<void> {
  const db = await openErpDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [STORE_TICKETS, STORE_EXTRACTIONS, STORE_ATTENDANCE, STORE_HSE],
      "readwrite"
    );
    syncedTicketSyncIds.forEach((id) => tx.objectStore(STORE_TICKETS).delete(id));
    syncedExtractionSyncIds.forEach((id) =>
      tx.objectStore(STORE_EXTRACTIONS).delete(id)
    );
    syncedAttendanceSyncIds.forEach((id) =>
      tx.objectStore(STORE_ATTENDANCE).delete(id)
    );
    syncedHseSyncIds.forEach((id) => tx.objectStore(STORE_HSE).delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
