import { createHash } from "crypto";

type DocId = string;
type Hash = string;

interface DocumentRecord {
  docId: DocId;
  hash: Hash;
  owner: string;
  registeredAt: number;
}

const docStore = new Map<DocId, DocumentRecord>();
const hashIndex = new Map<Hash, DocId>();

export class AlreadyRegisteredError extends Error {
  existingDocId: DocId;
  constructor(existingDocId: DocId) {
    super(`AlreadyRegistered(${existingDocId})`);
    this.existingDocId = existingDocId;
  }
}

export function sha256(content: string): Hash {
  return createHash("sha256").update(content).digest("hex");
}

export function registerDocument(docId: DocId, content: string, owner: string): DocumentRecord {
  const hash = sha256(content);

  const existing = hashIndex.get(hash);
  if (existing) throw new AlreadyRegisteredError(existing);

  const record: DocumentRecord = { docId, hash, owner, registeredAt: Date.now() };
  docStore.set(docId, record);
  hashIndex.set(hash, docId);
  return record;
}

export function findDocumentByHash(hash: Hash): DocumentRecord | undefined {
  const docId = hashIndex.get(hash);
  return docId ? docStore.get(docId) : undefined;
}

// --- tests ---
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const doc = registerDocument("doc-1", "freight manifest A", "shipper-1");
assert(doc.docId === "doc-1", "doc registered");

const found = findDocumentByHash(sha256("freight manifest A"));
assert(found?.docId === "doc-1", "find by hash works");

try {
  registerDocument("doc-2", "freight manifest A", "shipper-2");
  assert(false, "should have thrown");
} catch (e: unknown) {
  assert(e instanceof AlreadyRegisteredError, "duplicate rejected");
  assert((e as AlreadyRegisteredError).existingDocId === "doc-1", "returns existing id");
}

console.log("CT-17: all tests passed");
