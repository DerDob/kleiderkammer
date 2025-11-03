export interface User {
  email: string;
  name: string;
  groups: string[];
}

export interface Clothing {
  id: string;
  clothing: string;
  size: string;
  count: number;
  lent: number;
}

export interface Lending {
  id: string;
  clothingId: string;
  userEmail: string;
  clothing: string;
  size: string;
  count: number;
  issuedAt: string;
  returnedAt?: string;
}