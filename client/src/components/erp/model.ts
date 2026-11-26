import api from "@/lib/axios";
import axios from "axios";
export type Company = {
  id: string;
  name: string;
  address: string;
  state: string;
  gstin: string;
  contact: string;
  year_start: string;
  role: string;
};
export type Details = {
  address?: string;
  state?: string;
  gstin?: string;
  contact?: string;
  sku?: string;
  hsn?: string;
  unit?: string;
  group?: string;
  buy?: number;
  sell?: number;
  gst?: number;
  reorder?: number;
};
export type Master = {
  id: string;
  name: string;
  kind: string;
  category: string;
  details: Details;
  system_key: string | null;
};
export type Voucher = {
  id: string;
  number: string;
  date: string;
  kind: string;
  total: string;
  party: string;
};
export type Row = Record<string, string | number | null>;
export type Workspace = {
  company: Company;
  masters: Master[];
  vouchers: Voucher[];
  stock: Row[];
  customers: Row[];
  suppliers: Row[];
  reports: string[];
};
export const labels: Record<string, string> = {
  customer: "Customer",
  supplier: "Supplier",
  item: "Stock item",
  bank: "Bank",
  cash: "Cash",
  income: "Income",
  expense: "Expense",
  asset: "Asset",
  liability: "Liability",
  group: "Ledger group",
  stockGroup: "Stock group",
  unit: "Unit",
  sale: "Sales invoice",
  purchase: "Purchase voucher",
  creditNote: "Credit note",
  debitNote: "Debit note",
  proforma: "Proforma invoice",
  quotation: "Quotation",
  estimate: "Estimate",
  receipt: "Receipt",
  payment: "Payment",
  contra: "Contra transfer",
  journal: "Journal",
  reversingJournal: "Reversing journal",
  payroll: "Salary payment",
  stockIn: "Stock in",
  stockOut: "Stock out",
  transfer: "Stock transfer",
  damage: "Mark damaged",
  reserve: "Reserve stock",
  release: "Release reserved stock",
  opening: "Opening balance",
};
export const label = (v: string) => labels[v] || v;
export const masterKinds = [
  "customer",
  "supplier",
  "item",
  "group",
  "stockGroup",
  "unit",
  "bank",
  "cash",
  "income",
  "expense",
  "asset",
  "liability",
];
export const trade = [
  "sale",
  "purchase",
  "creditNote",
  "debitNote",
  "proforma",
  "estimate",
  "quotation",
];
export const stock = ["stockIn", "stockOut", "transfer", "reserve", "release", "damage"];
export const finance = ["receipt", "payment", "contra", "journal", "reversingJournal", "payroll"];
export const rupees = (v: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(v || 0));
export const today = () => new Date().toLocaleDateString("en-CA");
export function yearEnd(start: string) {
  const date = new Date(start + "T12:00:00Z");
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
export function defaultFY() {
  const d = new Date();
  return d.getFullYear() - (d.getMonth() < 3 ? 1 : 0) + "-04-01";
}
export const message = (e: unknown) =>
  axios.isAxiosError(e)
    ? e.response?.data?.message || e.message
    : e instanceof Error
      ? e.message
      : "Request failed";
export async function download(url: string, name: string, params?: Record<string, string>) {
  const { data } = await api.get(url, { params, responseType: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(data);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
