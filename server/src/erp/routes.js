const express = require("express");
const crypto = require("node:crypto");
const Decimal = require("decimal.js");
const { z } = require("zod");
const { authenticate } = require("../middleware/auth.middlewarer");
const { hashPassword } = require("../utils/password");
const { transaction } = require("./db");
const {
  company: companySchema,
  master: masterSchema,
  voucher,
  classes,
  seedCompany,
  parse,
  fail,
} = require("./catalog");
const { post, record } = require("./post");
const { report, names, period } = require("./reports");
const { spreadsheet, invoice } = require("./exports");
const updates = require("./updates");
const router = express.Router();
router.use(authenticate);
const dateText = "to_char(c.year_start,'YYYY-MM-DD') AS year_start";
router.get("/", async (req, res) =>
  res.json(
    await transaction(
      async (db) =>
        (
          await db.query(
            `SELECT c.*, ${dateText}, CASE WHEN owner_id=$1 THEN 'owner' ELSE m.role END role FROM companies c LEFT JOIN members m ON m.company_id=c.id AND m.user_id=$1 WHERE c.owner_id=$1 OR m.user_id=$1 ORDER BY c.name`,
            [req.user.id],
          )
        ).rows,
    ),
  ),
);
async function checkCompanyLimit(db, userId) {
  await db.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [userId]);
  const count = await db.query(
    "SELECT (SELECT count(*) FROM companies WHERE owner_id=$1)+(SELECT count(*) FROM members WHERE user_id=$1) n",
    [userId],
  );
  if (Number(count.rows[0].n) >= 5) fail("Each account can access up to five companies.", 409);
}
router.post("/", async (req, res) => {
  const c = parse(companySchema, req.body);
  const result = await transaction(async (db) => {
    await checkCompanyLimit(db, req.user.id);
    const { rows } = await db.query(
      "INSERT INTO companies(owner_id,name,address,state,gstin,contact,year_start) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [req.user.id, c.name, c.address, c.state, c.gstin, c.contact, c.year_start],
    );
    await seedCompany(db, rows[0].id);
    return rows[0];
  });
  res.status(201).json(result);
});
function scoped(level, handler) {
  return async (req, res) => {
    const id = parse(z.uuid(), req.params.company);
    const result = await transaction(async (db) => {
      const { rows } = await db.query(
        `SELECT c.*, ${dateText} FROM companies c WHERE c.id=$1 ${level === "read" ? "FOR SHARE" : "FOR UPDATE"}`,
        [id],
      );
      const c = rows[0];
      if (!c) fail("Company unavailable.", 404);
      const role =
        c.owner_id === req.user.id
          ? "owner"
          : (
              await db.query("SELECT role FROM members WHERE company_id=$1 AND user_id=$2", [
                id,
                req.user.id,
              ])
            ).rows[0]?.role;
      if (!role) fail("Company unavailable.", 404);
      if ((level === "owner" && role !== "owner") || (level === "write" && role === "viewer"))
        fail("Insufficient company permissions.", 403);
      return handler(db, { ...c, role }, req);
    });
    if (level !== "read") updates.publish(id);
    if (result?.send) return result.send(res);
    res.json(result ?? { success: true });
  };
}
const audit = (db, c, req, action, label) =>
  db.query("INSERT INTO audit_events(company_id,actor,action,description) VALUES($1,$2,$3,$4)", [
    c.id,
    req.user.id,
    action,
    label,
  ]);
router.put(
  "/:company",
  scoped("owner", async (db, c, req) => {
    const v = parse(companySchema, req.body);
    await db.query(
      "UPDATE companies SET name=$2,address=$3,state=$4,gstin=$5,contact=$6,year_start=$7 WHERE id=$1",
      [c.id, v.name, v.address, v.state, v.gstin, v.contact, v.year_start],
    );
    await audit(db, c, req, "Company updated", v.name);
  }),
);
router.delete(
  "/:company",
  scoped("owner", async (db, c, req) => {
    if (req.body.confirm !== c.name) fail("Type the company name to confirm deletion.");
    await db.query("DELETE FROM companies WHERE id=$1", [c.id]);
  }),
);
router.get(
  "/:company/updates",
  scoped("read", async (db, c) => ({ send: (res) => updates.subscribe(c.id, res) })),
);
router.get(
  "/:company/workspace",
  scoped("read", async (db, c, req) => {
    const [from, to] = period(req.query);
    const rows = async (sql, args) => (await db.query(sql, args)).rows;
    return {
      company: c,
      masters: await rows("SELECT * FROM masters WHERE company_id=$1 ORDER BY name", [c.id]),
      vouchers: await rows(
        "SELECT id,number,kind,date::text,total,coalesce(details->'party'->>'name',details->>'debit','') party FROM vouchers WHERE company_id=$1 AND date BETWEEN $2 AND $3 ORDER BY date DESC,created_at DESC",
        [c.id, from, to],
      ),
      stock: await report(db, c.id, "Stock summary", req.query),
      reports: names,
      customers: await report(db, c.id, "Customer outstanding", req.query),
      suppliers: await report(db, c.id, "Supplier outstanding", req.query),
    };
  }),
);
async function saveMaster(db, c, req) {
  const m = parse(masterSchema, req.body),
    edit = req.params.id;
  let previous;
  if (edit) {
    previous = (
      await db.query("SELECT * FROM masters WHERE company_id=$1 AND id=$2", [
        c.id,
        parse(z.uuid(), edit),
      ])
    ).rows[0];
    if (!previous) fail("Master unavailable.", 404);
    if (previous.system_key || previous.kind !== m.kind) fail("This account type is fixed.");
  }
  if (m.kind === "item" && (!m.details.sku || !m.details.unit)) fail("An item needs a SKU and unit.");
  if (m.details.unit) {
    if (
      !(
        await db.query("SELECT id FROM masters WHERE company_id=$1 AND id=$2 AND kind='unit'", [
          c.id,
          m.details.unit,
        ])
      ).rowCount
    )
      fail("Select a company unit.");
    if (
      previous &&
      previous.details.unit !== m.details.unit &&
      (await db.query("SELECT id FROM movements WHERE item_id=$1 LIMIT 1", [edit])).rows.length
    )
      fail("The unit is fixed after stock has moved.");
  }
  const category =
    classes[m.kind] ||
    (m.kind === "group"
      ? parse(z.enum(["Assets", "Liabilities", "Income", "Expenses"]), m.category)
      : "");
  if (m.details.group) {
    const group = (
      await db.query("SELECT * FROM masters WHERE company_id=$1 AND id=$2", [c.id, m.details.group])
    ).rows[0];
    if (
      !group ||
      group.kind !== (m.kind === "item" ? "stockGroup" : "group") ||
      (group.kind === "group" && group.category !== category)
    )
      fail("Select a matching group.");
  }
  const args = [c.id, m.kind, m.name, category, JSON.stringify(m.details)];
  const sql = edit
    ? "UPDATE masters SET name=$3,category=$4,details=$5 WHERE company_id=$1 AND kind=$2 AND id=$6 RETURNING id"
    : "INSERT INTO masters(company_id,kind,name,category,details) VALUES($1,$2,$3,$4,$5) RETURNING id";
  const id = (await db.query(sql, edit ? [...args, edit] : args)).rows[0].id;
  if (!edit && (m.opening || m.openingQty)) {
    const accounts = (
      await db.query(
        "SELECT system_key,id FROM masters WHERE company_id=$1 AND system_key IS NOT NULL",
        [c.id],
      )
    ).rows;
    const sys = Object.fromEntries(accounts.map((a) => [a.system_key, a.id]));
    const item = m.kind === "item";
    if (!item && !classes[m.kind]) fail("Opening balances apply to items and ledger accounts.");
    const value = item
      ? new Decimal(m.openingQty).times(m.details.buy).toDecimalPlaces(2)
      : new Decimal(m.opening).times(["Liabilities", "Income"].includes(category) ? -1 : 1);
    const entries = [
      [item ? sys.inventory : id, value],
      [sys.opening, value.neg()],
    ];
    await record(
      db,
      c,
      req.user.id,
      { date: c.year_start, kind: "opening", requestId: crypto.randomUUID() },
      value.abs(),
      { note: "Opening balance for " + m.name },
      entries,
      item ? [{ item: id, qty: m.openingQty, value, location: "Main", bucket: "available" }] : [],
    );
  }
  await audit(db, c, req, edit ? "Master updated" : "Master created", m.name);
  return { id };
}
router.post("/:company/masters", scoped("write", saveMaster));
router.put("/:company/masters/:id", scoped("write", saveMaster));
router.delete(
  "/:company/masters/:id",
  scoped("write", async (db, c, req) => {
    const id = parse(z.uuid(), req.params.id);
    const ref = (
      await db.query(
        "SELECT id FROM masters WHERE company_id=$1 AND (details->>'unit'=$2 OR details->>'group'=$2) LIMIT 1",
        [c.id, id],
      )
    ).rows;
    const used = (
      await db.query(
        "SELECT id FROM vouchers WHERE company_id=$1 AND (details->'input'->>'party'=$2 OR details->'input'->'lines' @> jsonb_build_array(jsonb_build_object('item',$2::text))) LIMIT 1",
        [c.id, id],
      )
    ).rows;
    if (ref.length || used.length) fail("This master is in use.", 409);
    const deleted = await db.query(
      "DELETE FROM masters WHERE id=$1 AND company_id=$2 AND system_key IS NULL RETURNING name",
      [id, c.id],
    );
    if (!deleted.rows.length) fail("This master cannot be removed.");
    await audit(db, c, req, "Master deleted", deleted.rows[0].name);
  }),
);
router.post(
  "/:company/vouchers",
  scoped("write", async (db, c, req) => {
    const d = parse(voucher, req.body);
    const result = await post(db, c, req.user.id, d);
    return result;
  }),
);
async function getVoucher(db, c, req) {
  const v = (
    await db.query(
      "SELECT id,number,date::text,kind,total,details FROM vouchers WHERE company_id=$1 AND id=$2",
      [c.id, parse(z.uuid(), req.params.id)],
    )
  ).rows[0];
  if (!v) fail("Voucher unavailable.", 404);
  return v;
}
router.get("/:company/vouchers/:id", scoped("read", getVoucher));
router.get(
  "/:company/vouchers/:id/pdf",
  scoped("read", async (db, c, req) => {
    const v = await getVoucher(db, c, req);
    return { send: (res) => invoice(res, v) };
  }),
);
router.get(
  "/:company/reports/:name",
  scoped("read", async (db, c, req) => {
    const rows = await report(db, c.id, req.params.name, req.query);
    if (req.query.format === "xlsx") {
      const buffer = await spreadsheet(req.params.name, rows);
      return { send: (res) => res.attachment(req.params.name + ".xlsx").send(Buffer.from(buffer)) };
    }
    return rows;
  }),
);
router.patch(
  "/:company/bank/:id",
  scoped("write", async (db, c, req) => {
    const date = parse(z.union([z.iso.date(), z.null()]), req.body.cleared_on);
    const result = await db.query(
      "UPDATE postings p SET cleared_on=$1 FROM masters m,vouchers v WHERE p.ledger_id=m.id AND p.voucher_id=v.id AND m.kind='bank' AND p.company_id=$2 AND p.id=$3 AND ($1::date IS NULL OR $1::date>=v.date) RETURNING p.id",
      [date, c.id, parse(z.string().regex(/^\d+$/), req.params.id)],
    );
    if (!result.rows.length)
      fail("Choose a bank entry and a clearance date on or after the transaction.");
    await audit(db, c, req, "Bank reconciliation", String(req.params.id));
  }),
);
router.get(
  "/:company/members",
  scoped(
    "owner",
    async (db, c) =>
      (
        await db.query(
          "SELECT u.id,u.name,u.email,m.role FROM members m JOIN users u ON u.id=m.user_id WHERE m.company_id=$1 ORDER BY u.name",
          [c.id],
        )
      ).rows,
  ),
);
router.post(
  "/:company/members",
  scoped("owner", async (db, c, req) => {
    const m = parse(
      z.object({
        email: z.email().transform((x) => x.toLowerCase()),
        role: z.enum(["viewer", "operator"]),
        name: z.string().trim().max(100).optional(),
        password: z.string().max(100).optional(),
      }),
      req.body,
    );
    let u = (await db.query("SELECT id FROM users WHERE email=$1", [m.email])).rows[0];
    if (!u) {
      if (!m.name || !m.password || m.password.length < 8)
        fail("New accounts require a name and a password of at least eight characters.");
      u = (
        await db.query("INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id", [
          m.name,
          m.email,
          await hashPassword(m.password),
        ])
      ).rows[0];
    }
    if (u.id === c.owner_id) fail("This user owns the company.");
    const existing = await db.query("SELECT user_id FROM members WHERE company_id=$1 AND user_id=$2", [
      c.id,
      u.id,
    ]);
    if (!existing.rows.length) await checkCompanyLimit(db, u.id);
    await db.query(
      "INSERT INTO members(company_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT(company_id,user_id) DO UPDATE SET role=excluded.role",
      [c.id, u.id, m.role],
    );
    await audit(db, c, req, "Member access updated", m.email + " · " + m.role);
  }),
);
router.delete(
  "/:company/members/:id",
  scoped("owner", async (db, c, req) => {
    await db.query("DELETE FROM members WHERE company_id=$1 AND user_id=$2", [
      c.id,
      parse(z.uuid(), req.params.id),
    ]);
    await audit(db, c, req, "Member access removed", req.params.id);
  }),
);
router.get(
  "/:company/audit",
  scoped(
    "owner",
    async (db, c) =>
      (
        await db.query(
          `SELECT e.at,u.name actor,e.action,e.description FROM (
    SELECT at,actor,action,description FROM audit_events WHERE company_id=$1 UNION ALL SELECT created_at,author_id,'Voucher posted',number FROM vouchers WHERE company_id=$1
    ) e JOIN users u ON u.id=e.actor ORDER BY e.at DESC`,
          [c.id],
        )
      ).rows,
  ),
);
router.use((err, req, res, next) => {
  if (err.code === "23505")
    return res.status(409).json({ message: "This name, SKU or number already exists." });
  if (err.code === "23503") return res.status(409).json({ message: "This record is in use." });
  next(err);
});
module.exports = router;
