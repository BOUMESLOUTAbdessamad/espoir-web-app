export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  title?: string;
  summary?: string;
  sections?: MessageSection[];
  pharmacies?: Pharmacy[];
  sideEffects?: string[];
}

export interface MessageSection {
  title: string;
  content: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  distance: string;
  available: boolean;
  price: string;
}

export interface Medicine {
  id: number;
  mark?: string;
  dci?: string;
  name?: string;
}

export interface PharmacyApiResponse {
  medicine_id: number;
  medicine_mark?: string;
  medicine_dci?: string;
  pharmacies_count: number;
  pharmacies: Array<{
    id: number;
    name: string;
    owner_name?: string;
    phone?: string;
    address?: string;
    wilaya?: string;
    city?: string;
    email?: string;
    open?: string;
    close?: string;
    lat?: number;
    lng?: number;
    status?: string;
  }>;
}