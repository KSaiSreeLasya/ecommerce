export type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

const KEY = "demo_addresses";

export function readAddresses(): Address[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as Address[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAddresses(addrs: Address[]) {
  localStorage.setItem(KEY, JSON.stringify(addrs));
}

export function upsertAddress(addr: Address) {
  const arr = readAddresses();
  const idx = arr.findIndex((a) => a.id === addr.id);
  if (idx >= 0) arr[idx] = addr; else arr.unshift(addr);
  saveAddresses(arr);
}

export function removeAddress(id: string) {
  const arr = readAddresses().filter((a) => a.id !== id);
  saveAddresses(arr);
}
