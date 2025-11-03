import { Clothing, Lending, User } from './types';

const API_BASE = '/api';

export async function getClothing(): Promise<Clothing[]> {
  const res = await fetch(`${API_BASE}/clothing`);
  if (!res.ok) throw new Error('Failed to fetch clothing');
  return res.json();
}

export async function getLendings(): Promise<Lending[]> {
  const res = await fetch(`${API_BASE}/lendings`);
  if (!res.ok) throw new Error('Failed to fetch lendings');
  return res.json();
}

export async function addClothing(data: { clothing: string; size: string; count: number }): Promise<Clothing> {
  const res = await fetch(`${API_BASE}/clothing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add clothing');
  return res.json();
}

export async function addLending(data: { clothingId: string; userEmail: string }): Promise<Lending> {
  const res = await fetch(`${API_BASE}/lendings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add lending');
  return res.json();
}

export async function returnLending(id: string): Promise<Lending> {
  const res = await fetch(`${API_BASE}/lendings/${id}/return`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to return lending');
  return res.json();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/users/me`);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.warn('Failed to get current user:', err);
    return null;
  }
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getClothingById(id: string): Promise<Clothing | null> {
  try {
    const res = await fetch(`${API_BASE}/clothing/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.warn('Failed to fetch clothing:', err);
    return null;
  }
}