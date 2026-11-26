const { fail } = require("./catalog");
const { z } = require("zod");
const formats = {
  "Sales register": ["sale", "creditNote"],
  "Purchase register": ["purchase", "debitNote"],
  "Daily sales": ["sale", "creditNote"],
  "Monthly sales": ["sale", "creditNote"],
  "Top customers": ["sale", "creditNote"],
  "Supplier summary": ["purchase", "debitNote"],
  "GST register": ["sale", "purchase", "creditNote", "debitNote"],
  "GSTR outward supply summary": ["sale", "creditNote"],
  "GST summary": ["sale", "purchase", "creditNote", "debitNote"],
};
const names = [
  ...Object.keys(formats),
  "Stock summary",
  "Low stock",
  "Item movements",
  "Inventory valuation",
  "Customer outstanding",
  "Supplier outstanding",
  "Ledger statement",
  "Trial balance",
  "Profit and loss",
  "Balance sheet",
  "Cash flow",
  "Bank transactions",
  "Cheques",
  "Payroll register",
];
function period(query) {
  const from = query.from || "1900-01-01",
    to = query.to || "9999-12-31";
  if (!z.iso.date().safeParse(from).success || !z.iso.date().safeParse(to).success || from > to)
    fail("Select a valid reporting period.");
  return [from, to];
}
async function report(db, company, type, query) {
  if (!names.includes(type)) fail("Unknown report.");
  const [from, to] = period(query);
  const params = [company, from, to];
  const run = async (sql, extra = []) => (await db.query(sql, [...params, ...extra])).rows;
  const ledgerSql = `SELECT m.id,m.name,m.kind,m.category,
      coalesce(sum(p.amount) FILTER(WHERE v.date < $2),0) opening,
      coalesce(sum(p.amount) FILTER(WHERE v.date BETWEEN $2 AND $3 AND p.amount>0),0) debit,
      coalesce(-sum(p.amount) FILTER(WHERE v.date BETWEEN $2 AND $3 AND p.amount<0),0) credit,
      coalesce(sum(p.amount) FILTER(WHERE v.date <= $3),0) balance
      FROM masters m LEFT JOIN postings p ON p.ledger_id=m.id LEFT JOIN vouchers v ON v.id=p.voucher_id
      WHERE m.company_id=$1 AND m.kind IN ('cash','bank','customer','supplier','asset','liability','income','expense')
      GROUP BY m.id ORDER BY m.name`;
  if (
    [
      "Trial balance",
      "Profit and loss",
      "Balance sheet",
      "Customer outstanding",
      "Supplier outstanding",
    ].includes(type)
  ) {
    const rows = await run(ledgerSql);
    if (type === "Trial balance")
      return rows.map(({ name, opening, debit, credit, balance }) => ({
        account: name,
        opening,
        debit,
        credit,
        balance,
      }));
    if (type === "Profit and loss") {
      const op = rows
        .filter((r) => ["Income", "Expenses"].includes(r.category))
        .map((r) => ({
          account: r.name,
          category: r.category,
          amount: round((r.debit - r.credit) * (r.category === "Income" ? -1 : 1)),
        }));
      return [
        ...op,
        {
          account: "Net profit / (loss)",
          category: "Result",
          amount: round(op.reduce((s, r) => s + (r.category === "Income" ? r.amount : -r.amount), 0)),
        },
      ];
    }
    if (type === "Balance sheet") {
      const result = rows
        .filter((r) => ["Income", "Expenses"].includes(r.category))
        .reduce((s, r) => s - Number(r.balance), 0);
      return [
        ...rows
          .filter((r) => !["Income", "Expenses"].includes(r.category))
          .map((r) => ({
            account: r.name,
            category: r.category,
            amount: round(Number(r.balance) * (r.category === "Liabilities" ? -1 : 1)),
          })),
        { account: "Accumulated profit / (loss)", category: "Equity", amount: round(result) },
      ];
    }
    return rows
      .filter((r) => r.kind === (type === "Customer outstanding" ? "customer" : "supplier"))
      .map((r) => ({
        party: r.name,
        outstanding: round(Number(r.balance) * (r.kind === "supplier" ? -1 : 1)),
      }));
  }
  if (type === "Stock summary" || type === "Low stock" || type === "Inventory valuation") {
    const rows = await run(`SELECT m.name, m.details->>'sku' sku, u.name unit,
          coalesce(sum(t.qty) FILTER(WHERE v.date <= $3),0) quantity,
          coalesce(sum(t.qty) FILTER(WHERE v.date <= $3 AND t.bucket='available'),0) available,
          coalesce(sum(t.qty) FILTER(WHERE v.date <= $3 AND t.bucket='reserved'),0) reserved,
          coalesce(sum(t.qty) FILTER(WHERE v.date <= $3 AND t.bucket='damaged'),0) damaged,
          coalesce(sum(t.value) FILTER(WHERE v.date <= $3),0) valuation, m.details->>'reorder' reorder
          FROM masters m LEFT JOIN masters u ON u.id::text=m.details->>'unit'
          LEFT JOIN movements t ON m.id=t.item_id LEFT JOIN vouchers v ON v.id=t.voucher_id
          WHERE m.company_id=$1 AND m.kind='item' AND $2::date <= $3 GROUP BY m.id,u.name ORDER BY m.name`);
    return type === "Low stock" ? rows.filter((r) => Number(r.available) <= Number(r.reorder)) : rows;
  }
  if (type === "Item movements")
    return run(
      `SELECT v.date::text,v.number,m.name,t.location,t.bucket,t.qty,t.value FROM movements t JOIN vouchers v ON v.id=t.voucher_id JOIN masters m ON m.id=t.item_id WHERE t.company_id=$1 AND v.date BETWEEN $2 AND $3 AND ($4::text='' OR m.id::text=$4) ORDER BY v.date,t.id`,
      [query.item || ""],
    );
  if (type === "Cash flow") {
    const opening = (await run(ledgerSql))
      .filter((r) => ["cash", "bank"].includes(r.kind))
      .reduce((sum, r) => sum + Number(r.opening), 0);
    const rows = await run(`WITH cash_vouchers AS (
          SELECT v.id,v.kind,sum(p.amount) amount FROM postings p JOIN vouchers v ON v.id=p.voucher_id JOIN masters m ON m.id=p.ledger_id
          WHERE p.company_id=$1 AND v.date BETWEEN $2 AND $3 AND m.kind IN ('bank','cash') GROUP BY v.id,v.kind
        ) SELECT kind activity,sum(greatest(amount,0)) inflow,sum(greatest(-amount,0)) outflow,sum(amount) net FROM cash_vouchers WHERE amount<>0 GROUP BY kind ORDER BY kind`);
    const closing = round(rows.reduce((v, r) => v + Number(r.net), opening));
    return [
      { activity: "Opening cash and bank", inflow: null, outflow: null, net: round(opening) },
      ...rows,
      { activity: "Closing cash and bank", inflow: null, outflow: null, net: closing },
    ];
  }
  if (["Ledger statement", "Bank transactions", "Cheques"].includes(type)) {
    const filter = {
      "Ledger statement": "m.id::text=$4",
      "Bank transactions": "m.kind='bank'",
      Cheques: "m.kind='bank' AND p.cheque<>''",
    }[type];
    let opening = 0;
    if (type === "Ledger statement") {
      const balance = (await run(ledgerSql)).find((r) => r.id === query.ledger);
      if (!balance) return [];
      opening = Number(balance.opening);
    }
    const rows = await run(
      `SELECT p.id::text,v.date::text,v.number,m.name account,v.kind,p.amount,p.cheque,p.cleared_on::text FROM postings p JOIN vouchers v ON v.id=p.voucher_id JOIN masters m ON m.id=p.ledger_id WHERE p.company_id=$1 AND v.date BETWEEN $2 AND $3 AND ${filter} ORDER BY v.date,p.id`,
      type === "Ledger statement" ? [query.ledger || ""] : [],
    );
    if (type === "Ledger statement")
      return [
        { date: from, number: "Opening balance", debit: 0, credit: 0, balance: opening },
        ...rows.map((r) => ({
          date: r.date,
          number: r.number,
          debit: Math.max(r.amount, 0),
          credit: Math.max(-r.amount, 0),
          balance: (opening = round(opening + Number(r.amount))),
        })),
      ];
    return rows;
  }
  const kinds = formats[type] || ["payroll"];
  const rows = await run(
    `SELECT date::text,number,kind,details,total FROM vouchers WHERE company_id=$1 AND date BETWEEN $2 AND $3 AND kind=ANY($4::text[]) ORDER BY date,number`,
    [kinds],
  );
  if (type === "Payroll register")
    return rows.map((r) => ({
      date: r.date,
      voucher: r.number,
      employee: r.details.input.note,
      expense: r.details.debit,
      paid_from: r.details.credit,
      amount: r.total,
    }));
  const values = rows.map((r) => {
    const sign = ["creditNote", "debitNote"].includes(r.kind) ? -1 : 1;
    const d = r.details;
    return {
      date: r.date,
      number: r.number,
      kind: r.kind,
      party: d.party?.name || "",
      gstin: d.party?.gstin || "",
      place: d.place,
      taxable: round(d.base * sign),
      cgst: round(d.taxes.CGST * sign),
      sgst: round(d.taxes.SGST * sign),
      igst: round(d.taxes.IGST * sign),
      total: round(r.total * sign),
    };
  });
  if (
    [
      "Daily sales",
      "Monthly sales",
      "Top customers",
      "Supplier summary",
      "GST summary",
      "GSTR outward supply summary",
    ].includes(type)
  ) {
    const groups = new Map();
    for (const r of values) {
      const key =
        type === "GSTR outward supply summary"
          ? [
              r.date.slice(0, 7),
              r.kind === "creditNote"
                ? "Credit notes"
                : r.gstin
                  ? "Registered sales"
                  : "Unregistered sales",
              r.place,
            ].join(" · ")
          : type === "Daily sales"
            ? r.date
            : type === "Monthly sales"
              ? r.date.slice(0, 7)
              : type === "GST summary"
                ? ["purchase", "debitNote"].includes(r.kind)
                  ? "Input"
                  : "Output"
                : r.party;
      const group = groups.get(key) || { group: key, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
      for (const k of ["taxable", "cgst", "sgst", "igst", "total"]) group[k] = round(group[k] + r[k]);
      groups.set(key, group);
    }
    const result = [...groups.values()];
    return type === "Top customers" ? result.sort((a, b) => b.total - a.total) : result;
  }
  return values;
}
function round(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
module.exports = { report, names, period };
