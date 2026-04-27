// BE-18: User activity log endpoint

type ActivityAction =
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "SHIPMENT_STATE_CHANGE";

interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

interface PaginationOptions {
  page: number;
  pageSize: number;
}

const logs: ActivityLog[] = [];

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function logActivity(
  userId: string,
  action: ActivityAction,
  ipAddress: string,
  userAgent: string
): ActivityLog {
  const entry: ActivityLog = {
    id: generateId(),
    userId,
    action,
    ipAddress,
    userAgent,
    createdAt: new Date(),
  };
  logs.push(entry);
  return entry;
}

export function getUserActivity(
  userId: string,
  { page, pageSize }: PaginationOptions
): { data: ActivityLog[]; total: number } {
  const userLogs = logs
    .filter((l) => l.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const start = (page - 1) * pageSize;
  return {
    data: userLogs.slice(start, start + pageSize),
    total: userLogs.length,
  };
}
