const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
process.env.PGLITE_PATH = "memory://";
if (process.env.SMARTERP_TEST_DATABASE_URL)
  process.env.DATABASE_URL = process.env.SMARTERP_TEST_DATABASE_URL;
else process.env.DATABASE_URL = "";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
const { migrate, close } = require("../src/erp/db");
const app = require("../src/app");
let server, base, token;
async function call(path, { method = "GET", body, as = token, status = 200 } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { Authorization: "Bearer " + as, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.headers.get("Content-Type")?.includes("json")) {
    assert.equal(res.status, status);
    return Buffer.from(await res.arrayBuffer());
  }
  const payload = await res.json();
  assert.equal(res.status, status, method + " " + path + " " + JSON.stringify(payload));
  return payload;
}
before(async () => {
  await migrate();
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = "http://127.0.0.1:" + server.address().port + "/api";
  token = (
    await call("/auth/register", {
      method: "POST",
      status: 201,
      body: { name: "Operator One", email: "owner@example.com", password: "test-password" },
    })
  ).data.token;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await close();
});
const companyData = {
  name: "Surat Trading",
  address: "Ring Road",
  state: "Gujarat",
  year_start: "2026-04-01",
};
test("company isolation, double-entry, stock, billing, reports and access", async () => {
  const c = (await call("/companies", { method: "POST", status: 201, body: companyData })).id;
  const path = "/companies/" + c;
  const ws = () => call(path + "/workspace");
  const first = await ws();
  const cash = first.masters.find((m) => m.system_key === "cash").id,
    bank = first.masters.find((m) => m.system_key === "bank").id;
  const create = async (kind, name, details = {}, extra = {}) =>
    (await call(path + "/masters", { method: "POST", body: { kind, name, details, ...extra } })).id;
  const customer = await create("customer", "ABC Store", { state: "Gujarat" });
  const supplier = await create("supplier", "XYZ Wholesale", { state: "Gujarat" });
  const item = await create("item", "Keyboard", {
    sku: "KEY-001",
    unit: first.masters.find((m) => m.name === "PCS").id,
    buy: 500,
    sell: 800,
  });
  const report = (type, query = "") => call(path + "/reports/" + encodeURIComponent(type) + query);
  const date = "2026-06-01";
  const submit = (d, status = 200) =>
    call(path + "/vouchers", {
      method: "POST",
      status,
      body: { date, requestId: crypto.randomUUID(), ...d },
    });
  const purchase = await submit({
    kind: "purchase",
    party: supplier,
    lines: [{ item, qty: 10, rate: 500 }],
  });
  const sale = {
    kind: "sale",
    party: customer,
    lines: [{ item, qty: 2, rate: 800 }],
    paid: 600,
    account: cash,
    requestId: crypto.randomUUID(),
  };
  const invoice = await submit(sale);
  assert.deepEqual(await submit(sale), invoice);
  await submit({ ...sale, paid: 2 }, 409);
  const stock = async () => Number((await report("Stock summary"))[0].available);
  assert.equal(await stock(), 8);
  assert.equal((await report("Customer outstanding"))[0].outstanding, 1000);
  assert.equal((await report("Supplier outstanding"))[0].outstanding, 5000);
  assert.equal((await report("Profit and loss")).at(-1).amount, 600);
  await submit({ ...sale, requestId: crypto.randomUUID(), lines: [{ item, qty: 20, rate: 800 }] }, 400);
  assert.equal(await stock(), 8);
  assert.ok(
    (await call(path + "/vouchers/" + invoice.id + "/pdf")).subarray(0, 4).equals(Buffer.from("%PDF")),
  );
  assert.ok((await report("Stock summary", "?format=xlsx")).subarray(0, 2).equals(Buffer.from("PK")));
  await submit({
    kind: "creditNote",
    reference: invoice.number,
    party: customer,
    lines: [{ item, qty: 1, rate: 800 }],
  });
  await submit(
    {
      kind: "creditNote",
      reference: invoice.number,
      party: customer,
      lines: [{ item, qty: 2, rate: 800 }],
    },
    400,
  );
  await submit({
    kind: "debitNote",
    reference: purchase.number,
    party: supplier,
    lines: [{ item, qty: 1, rate: 500 }],
  });
  await submit({ kind: "reserve", lines: [{ item, qty: 1, rate: 0 }] });
  await submit({ kind: "release", lines: [{ item, qty: 1, rate: 0 }] });
  await submit({ kind: "transfer", destination: "Store", lines: [{ item, qty: 1, rate: 0 }] });
  await submit({ kind: "damage", location: "Store", lines: [{ item, qty: 1, rate: 0 }] });
  assert.equal(await stock(), 7);
  await submit({ kind: "receipt", debit: bank, credit: customer, amount: 100, cheque: "CQ001" });
  const cheque = (await report("Cheques"))[0];
  await call(path + "/bank/" + cheque.id, { method: "PATCH", body: { cleared_on: date } });
  assert.equal((await report("Cheques"))[0].cleared_on, date);
  for (const kind of ["proforma", "quotation", "estimate"])
    await submit({ kind, party: customer, lines: [{ item, qty: 99, rate: 800 }] });
  assert.equal(await stock(), 7);
  const expense = first.masters.find((m) => m.system_key === "salary").id;
  for (const kind of ["payroll", "payment"])
    await submit({ kind, debit: expense, credit: cash, amount: 5, note: "June salary" });
  await submit({ kind: "contra", debit: bank, credit: cash, amount: 50 });
  await submit({
    kind: "reversingJournal",
    debit: expense,
    credit: supplier,
    amount: 80,
    reverseOn: "2026-06-02",
  });
  const trial = await report("Trial balance");
  assert.equal(
    trial.reduce((s, r) => s + Number(r.balance), 0),
    0,
  );
  assert.equal((await report("Ledger statement", "?ledger=" + customer)).at(-1).balance, 100);
  for (const type of first.reports) assert.ok(Array.isArray(await report(type)));
  const outsider = (
    await call("/auth/register", {
      method: "POST",
      status: 201,
      body: { name: "Other User", email: "other@example.com", password: "other-password" },
    })
  ).data.token;
  await call(path + "/workspace", { as: outsider, status: 404 });
  await call(path + "/members", {
    method: "POST",
    body: { email: "other@example.com", role: "viewer" },
  });
  await call(path + "/workspace", { as: outsider });
  await call(path + "/masters", {
    as: outsider,
    method: "POST",
    status: 403,
    body: { kind: "unit", name: "XX" },
  });
  await call(path + "/audit", { as: outsider, status: 403 });
  const taxItem = await create(
    "item",
    "GST Item",
    { sku: "GST-1", unit: first.masters.find((m) => m.name === "PCS").id, buy: 100, sell: 120, gst: 18 },
    { openingQty: 2 },
  );
  for (const place of ["Gujarat", "Maharashtra"]) {
    const doc = await submit({
      kind: "sale",
      party: customer,
      place,
      lines: [{ item: taxItem, qty: 1, rate: 120 }],
    });
    const saved = await call(path + "/vouchers/" + doc.id);
    assert.equal(Number(saved.total), 141.6);
    assert.equal(Number(saved.details.taxes.IGST), place === "Gujarat" ? 0 : 21.6);
  }
  for (let i = 1; i <= 4; i++)
    await call("/companies", {
      method: "POST",
      status: 201,
      body: { ...companyData, name: "Branch " + i },
    });
  await call("/companies", { method: "POST", status: 409, body: { ...companyData, name: "Six" } });
  await call(path, { method: "DELETE", body: { confirm: companyData.name } });
  assert.equal((await call("/companies")).length, 4);
  await call("/auth/logout", { method: "POST" });
  await call("/auth/me", { status: 401 });
});
