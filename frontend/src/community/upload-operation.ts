// Browser-only durable operation IDs. IndexedDB serializes read/write transactions
// across tabs. No token, filename, content, bucket or object ref is persisted.
const databaseName = 'blockallisto-private-upload-operations';
const storeName = 'operations';
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('upload operation storage unavailable'));
    let abandoned = false;
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
    };
    request.onsuccess = () => {
      if (abandoned) {
        request.result.close();
        return;
      }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(new Error('upload operation storage unavailable'));
    request.onblocked = () => {
      abandoned = true;
      reject(new Error('upload operation storage unavailable'));
    };
  });
}
export async function uploadOperation(owner: string, applicationId: string, filename: string, content: string) {
  const fingerprint = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([owner, applicationId, filename, content])))),
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const db = await openDatabase();
  try {
    const id = await new Promise<string>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      let operationId = '';
      const get = store.get(fingerprint);
      get.onsuccess = () => {
        if (
          get.result !== undefined &&
          !(typeof get.result?.id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(get.result.id))
        ) {
          tx.abort();
          return;
        }
        operationId =
          typeof get.result?.id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(get.result.id)
            ? get.result.id
            : crypto.randomUUID();
        if (!get.result) store.put({ id: operationId }, fingerprint);
      };
      tx.oncomplete = () => resolve(operationId);
      tx.onerror = tx.onabort = () => reject(new Error('upload operation storage unavailable'));
    });
    return {
      id,
      complete: async (documentId: string) => {
        const next = await openDatabase();
        try {
          await new Promise<void>((resolve, reject) => {
            const tx = next.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const get = store.get(fingerprint);
            get.onsuccess = () => {
              if (get.result?.id === id) store.put({ id, documentId }, fingerprint);
            };
            tx.oncomplete = () => resolve();
            tx.onerror = tx.onabort = () => reject(new Error('upload operation storage unavailable'));
          });
        } finally {
          next.close();
        }
      },
    };
  } finally {
    db.close();
  }
}

export async function forgetUploadDocument(documentId: string) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const cursor = tx.objectStore(storeName).openCursor();
      cursor.onsuccess = () => {
        const item = cursor.result;
        if (!item) return;
        // Actual server document IDs bind the caller's operation UUID. This also
        // clears a lost-ACK mapping that has not yet recorded its document ID.
        if (item.value?.documentId === documentId || `appdoc_${item.value?.id}` === documentId) item.delete();
        item.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(new Error('upload operation storage unavailable'));
    });
  } finally {
    db.close();
  }
}
