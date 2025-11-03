import fs from 'fs/promises';
import path from 'path';

export interface User {
  name: string;
  email: string;
  groups: string[];
}

export interface Clothing {
  id: string;
  clothing: string;
  size: string;
  count: number;
}

export interface Lending {
  id: string;
  clothingId: string;
  userEmail: string;
  issuedAt: string; // ISO date
  returnedAt?: string; // ISO date or undefined
}

const DATA_DIR = path.resolve(__dirname, '..', 'data');

const ADMIN_GROUP = process.env.ADMIN_GROUP || 'kleiderkammer-admin';
const CLOTHING_FILE = process.env.CLOTHING_FILE || path.join(DATA_DIR, 'clothing.json');
const LENDINGS_FILE = process.env.LENDINGS_FILE || path.join(DATA_DIR, 'lendings.json');

let users: User[] = [];
let clothing: Clothing[] = [];
let lendings: Lending[] = [];

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // ignore
  }
}

async function loadJson<T>(file: string, defaultValue: T): Promise<T> {
  try {
    const txt = await fs.readFile(file, 'utf8');
    return JSON.parse(txt) as T;
  } catch (err) {
    await fs.writeFile(file, JSON.stringify(defaultValue, null, 2), 'utf8');
    return defaultValue;
  }
}

async function saveJson(file: string, data: any) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

export async function initStore() {
  await ensureDataDir();
  clothing = await loadJson<Clothing[]>(CLOTHING_FILE, []);
  lendings = await loadJson<Lending[]>(LENDINGS_FILE, []);

  // Try to fetch users at startup
  try {
    await refreshUsersFromIdP();
  } catch (err) {
    console.warn('Could not refresh users at startup:', err);
  }

  // Schedule daily refresh (24h)
  const msPerDay = 24 * 60 * 60 * 1000;
  setInterval(() => {
    refreshUsersFromIdP().catch((err) => console.warn('Daily user refresh failed:', err));
  }, msPerDay);
}

export function getUsers(): User[] {
  return users;
}

export function setUsers(newUsers: User[]) {
  users = newUsers;
}

export function getClothing(): Clothing[] {
  return clothing;
}

export function isAdmin(user: User): boolean {
  return user.groups?.includes(ADMIN_GROUP) || false;
}

export function canManageClothing(user: User): boolean {
  return isAdmin(user);
}

export function canViewAllLendings(user: User): boolean {
  return isAdmin(user);
}

export function getUserLendings(userEmail: string): Lending[] {
  return lendings.filter(l => l.userEmail === userEmail);
}

export function canManageLending(user: User, lending: Lending): boolean {
  return isAdmin(user) || lending.userEmail === user.email;
}

export function getCurrentUser(req: Express.Request): User | undefined {
  return (req.user as User | undefined);
}

export async function addClothing(item: Omit<Clothing, 'id'>) {
  const id = cryptoId();
  const newItem: Clothing = { id, ...item };
  clothing.push(newItem);
  await saveJson(CLOTHING_FILE, clothing);
  return newItem;
}

export async function updateClothingCount(id: string, delta: number) {
  const it = clothing.find((c) => c.id === id);
  if (!it) throw new Error('clothing not found');
  it.count += delta;
  if (it.count < 0) it.count = 0;
  await saveJson(CLOTHING_FILE, clothing);
}

export function getLendings(): Lending[] {
  return lendings;
}

export async function addLending(clothingId: string, userEmail: string) {
  const cloth = clothing.find((c) => c.id === clothingId);
  if (!cloth) throw new Error('clothing not found');
  if (cloth.count <= 0) throw new Error('no items available');
  cloth.count -= 1;
  const lending: Lending = {
    id: cryptoId(),
    clothingId,
    userEmail,
    issuedAt: new Date().toISOString()
  };
  lendings.push(lending);
  await saveJson(CLOTHING_FILE, clothing);
  await saveJson(LENDINGS_FILE, lendings);
  return lending;
}

export async function returnLending(lendingId: string) {
  const ln = lendings.find((l) => l.id === lendingId);
  if (!ln) throw new Error('lending not found');
  if (ln.returnedAt) throw new Error('already returned');
  ln.returnedAt = new Date().toISOString();
  const cloth = clothing.find((c) => c.id === ln.clothingId);
  if (cloth) cloth.count += 1;
  await saveJson(CLOTHING_FILE, clothing);
  await saveJson(LENDINGS_FILE, lendings);
  return ln;
}

async function refreshUsersFromIdP() {
  const apiUrl = process.env.AUTHENTIK_USER_API;
  const token = process.env.AUTHENTIK_API_TOKEN;
  if (!apiUrl) {
    console.warn('AUTHENTIK_USER_API not set; skipping user refresh');
    return;
  }
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Use global fetch (Node 18+). If not available, caller must polyfill.
  // Expecting an array of users with properties: name, email, groups
  // Map them into our User shape.
  // Example Authentik API: /api/users/?format=json (adjust via AUTHENTIK_USER_API)
  const res = await fetch(apiUrl, { headers });
  if (!res.ok) throw new Error(`User API returned ${res.status}`);
  const data = await res.json();
  const mapped: User[] = (Array.isArray(data) ? data : data.results || []).map((u: any) => ({
    name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
    email: u.email || u.username || '',
    groups: Array.isArray(u.groups) ? u.groups.map((g: any) => (typeof g === 'string' ? g : g.name || String(g))) : []
  }));
  users = mapped;
  console.log(`Refreshed ${users.length} users from ${apiUrl}`);
}

function cryptoId() {
  // simple id generator
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Export for use in server
export default {
  initStore,
  getUsers,
  getClothing,
  getLendings,
  addClothing,
  addLending,
  returnLending,
  setUsers,
  // Access control
  isAdmin,
  canManageClothing,
  canViewAllLendings,
  getUserLendings,
  canManageLending,
  getCurrentUser
};
