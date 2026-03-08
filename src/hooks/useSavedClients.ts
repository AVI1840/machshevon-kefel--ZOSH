import { useState, useCallback } from 'react';
import { CalculatorInput } from '@/lib/calculations';

const STORAGE_KEY = 'choice_wizard_saved_clients';
const MAX_CLIENTS = 5;

export interface SavedClient {
  id: string;
  timestamp: number;
  label: string;
  input: CalculatorInput;
}

function generateLabel(input: CalculatorInput): string {
  const parts: string[] = [];
  if (input.widow.age !== null) parts.push(`גיל ${input.widow.age}`);
  if (input.deceased.seniorityYears !== null) parts.push(`ותק ${input.deceased.seniorityYears}`);
  if (input.widow.incapacity !== null) parts.push(`אי-כושר ${input.widow.incapacity}%`);
  if (input.children.length > 0) parts.push(`${input.children.length} ילדים`);
  return parts.length > 0 ? parts.join(', ') : 'לקוח ללא נתונים';
}

function loadClients(): SavedClient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedClient[];
  } catch {
    return [];
  }
}

function persistClients(clients: SavedClient[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

export function useSavedClients() {
  const [clients, setClients] = useState<SavedClient[]>(loadClients);

  const saveClient = useCallback((input: CalculatorInput) => {
    const newClient: SavedClient = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      label: generateLabel(input),
      input,
    };

    setClients(prev => {
      const updated = [newClient, ...prev].slice(0, MAX_CLIENTS);
      persistClients(updated);
      return updated;
    });
  }, []);

  const loadClient = useCallback((id: string): CalculatorInput | null => {
    const client = clients.find(c => c.id === id);
    return client?.input ?? null;
  }, [clients]);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      persistClients(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setClients([]);
    persistClients([]);
  }, []);

  return { clients, saveClient, loadClient, deleteClient, clearAll };
}
