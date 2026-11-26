const { z } = require("zod");
const { AppError } = require("../utils/errors");
const fail = (message, status = 400) => {
  throw new AppError(message, status);
};
const name = z.string().trim().min(1).max(120);
const short = z.string().trim().max(220).default("");
const uuid = z.uuid();
const optionalId = z.union([uuid, z.literal("")]).default("");
const gstin = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^([0-9]{2}[A-Z0-9]{13})?$/, "Use a 15-character GSTIN")
  .default("");
const money = z.coerce.number().finite().min(0).max(999999999).multipleOf(0.01);
const quantity = z.coerce.number().finite().min(0).max(9999999).multipleOf(0.001);
const company = z.object({
  name,
  address: name,
  state: name,
  gstin,
  contact: short,
  year_start: z.iso.date(),
});
const kinds = [
  "customer",
  "supplier",
  "cash",
  "bank",
  "income",
  "expense",
  "asset",
  "liability",
  "group",
  "stockGroup",
  "item",
  "unit",
];
const classes = {
  customer: "Assets",
  supplier: "Liabilities",
  cash: "Assets",
  bank: "Assets",
  income: "Income",
  expense: "Expenses",
  asset: "Assets",
  liability: "Liabilities",
};
const master = z.object({
  kind: z.enum(kinds),
  name,
  category: short,
  details: z
    .object({
      address: short,
      state: short,
      contact: short,
      gstin,
      sku: short,
      hsn: short,
      unit: optionalId,
      group: optionalId,
      buy: money.default(0),
      sell: money.default(0),
      gst: z.coerce.number().min(0).max(100).multipleOf(0.01).default(0),
      reorder: quantity.default(0),
    })
    .default({}),
  opening: money.default(0),
  openingQty: quantity.default(0),
});
const trade = ["sale", "purchase", "creditNote", "debitNote", "quotation", "estimate", "proforma"];
const documents = ["quotation", "estimate", "proforma"];
const stock = ["stockIn", "stockOut", "transfer", "reserve", "release", "damage"];
const financial = ["receipt", "payment", "contra", "journal", "reversingJournal", "payroll"];
const voucher = z.object({
  kind: z.enum([...trade, ...stock, ...financial]),
  date: z.iso.date(),
  requestId: uuid,
  party: optionalId,
  account: optionalId,
  debit: optionalId,
  credit: optionalId,
  amount: money.default(0),
  paid: money.default(0),
  note: short,
  cheque: short,
  place: short,
  location: name.default("Main"),
  destination: short,
  reverseOn: z.union([z.iso.date(), z.literal("")]).default(""),
  reference: short,
  lines: z
    .array(z.object({ item: uuid, qty: quantity.positive(), rate: money }))
    .max(150)
    .default([]),
});
const seed = [
  ["cash", "Cash", "cash"],
  ["bank", "Bank", "bank"],
  ["inventory", "Stock on hand", "asset"],
  ["receipts", "Sales revenue", "income"],
  ["cogs", "Cost of goods sold", "expense"],
  ["opening", "Opening capital", "liability"],
  ["adjust", "Inventory adjustment", "expense"],
  ["salary", "Salaries", "expense"],
  ...["CGST", "SGST", "IGST"].flatMap((t) => [
    ["in" + t, "Input " + t, "asset"],
    ["out" + t, "Output " + t, "liability"],
  ]),
];
async function seedCompany(db, id) {
  for (const [key, title, kind] of seed)
    await db.query(
      "INSERT INTO masters(company_id,kind,name,category,system_key) VALUES($1,$2,$3,$4,$5)",
      [id, kind, title, classes[kind], key],
    );
  for (const unit of ["PCS", "KG", "BOX", "LTR", "PACK"])
    await db.query("INSERT INTO masters(company_id,kind,name) VALUES($1,'unit',$2)", [id, unit]);
  for (const category of ["Assets", "Liabilities", "Income", "Expenses"])
    await db.query("INSERT INTO masters(company_id,kind,name,category) VALUES($1,'group',$2,$2)", [
      id,
      category,
    ]);
}
function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success)
    fail(result.error.issues.map((x) => x.path.join(".") + " " + x.message).join(", "));
  return result.data;
}
module.exports = {
  fail,
  parse,
  company,
  master,
  voucher,
  trade,
  documents,
  stock,
  financial,
  classes,
  seedCompany,
};
