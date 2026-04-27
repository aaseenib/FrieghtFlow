// BE-19: Referral code system for user registration

interface User {
  id: string;
  email: string;
  referralCode: string;
  referredById: string | null;
}

const users: User[] = [];

function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function registerUser(
  email: string,
  referralCode?: string
): User | { error: string } {
  const referrer = referralCode
    ? users.find((u) => u.referralCode === referralCode)
    : null;

  if (referralCode && !referrer) {
    return { error: "Invalid referral code" };
  }

  const newUser: User = {
    id: generateId(),
    email,
    referralCode: generateReferralCode(),
    referredById: referrer?.id ?? null,
  };

  users.push(newUser);
  return newUser;
}

export function getUserReferrals(userId: string): User[] {
  return users.filter((u) => u.referredById === userId);
}

export function getUserByReferralCode(code: string): User | undefined {
  return users.find((u) => u.referralCode === code);
}

export function getAllUsers(): User[] {
  return [...users];
}
