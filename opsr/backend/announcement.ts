// BE-17: Platform-wide announcement system for admins

interface Announcement {
  id: string;
  title: string;
  body: string;
  isActive: boolean;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

const store: Announcement[] = [];

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createAnnouncement(
  title: string,
  body: string,
  createdBy: string,
  expiresAt?: Date
): Announcement {
  const announcement: Announcement = {
    id: generateId(),
    title,
    body,
    isActive: true,
    expiresAt: expiresAt ?? null,
    createdBy,
    createdAt: new Date(),
  };
  store.push(announcement);
  return announcement;
}

export function getActiveAnnouncements(): Announcement[] {
  const now = new Date();
  return store.filter(
    (a) => a.isActive && (a.expiresAt === null || a.expiresAt > now)
  );
}

export function updateAnnouncement(
  id: string,
  patch: Partial<Pick<Announcement, "title" | "body" | "isActive" | "expiresAt">>
): Announcement | null {
  const item = store.find((a) => a.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  return item;
}

export function deleteAnnouncement(id: string): boolean {
  const idx = store.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}

export function getAllAnnouncements(): Announcement[] {
  return [...store];
}
