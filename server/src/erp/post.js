const Decimal = require("decimal.js");
const { fail, trade, documents, stock, classes } = require("./catalog");
const D = (value) => new Decimal(value);
const cents = (value) => D(value).toDecimalPlaces(2);
const fmt = (value) => cents(value).toFixed(2);
const prefixes = {
  sale: "INV",
  purchase: "PUR",
  creditNote: "CN",
  debitNote: "DN",
  quotation: "QUO",
  estimate: "EST",
  proforma: "PF",
  receipt: "RCT",
  payment: "PAY",
  contra: "CTR",
  journal: "JRN",
  reversingJournal: "RVJ",
  payroll: "SAL",
  stockIn: "IN",
  stockOut: "OUT",
  transfer: "TR",
  reserve: "RSV",
  release: "REL",
  damage: "DMG",
  opening: "OP",
};
async function record(db, company, user, data, total, details, entries, moves) {
  const year = data.date.slice(0, 4);
  const prefix = prefixes[data.kind] + "-" + year + "-";
  const count = await db.query(
    "SELECT count(*) AS n FROM vouchers WHERE company_id=$1 AND number LIKE $2",
    [company.id, prefix + "%"],
  );
  const number = prefix + String(Number(count.rows[0].n) + 1).padStart(5, "0");
  const result = await db.query(
    "INSERT INTO vouchers(company_id,number,kind,date,request_id,total,details,author_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,number",
    [
      company.id,
      number,
      data.kind,
      data.date,
      data.requestId,
      fmt(total),
      JSON.stringify(details),
      user,
    ],
  );
  const id = result.rows[0].id;
  let balance = D(0);
  for (const [ledger, value] of entries) {
    const amount = cents(value);
    if (amount.isZero()) continue;
    balance = balance.plus(amount);
    await db.query(
      "INSERT INTO postings(company_id,voucher_id,ledger_id,amount,cheque) VALUES($1,$2,$3,$4,$5)",
      [company.id, id, ledger, fmt(amount), data.cheque || ""],
    );
  }
  if (!balance.isZero()) throw new Error("Unbalanced voucher");
  for (const m of moves)
    await db.query(
      "INSERT INTO movements(company_id,voucher_id,item_id,location,bucket,qty,value) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [company.id, id, m.item, m.location, m.bucket, m.qty.toString(), fmt(m.value)],
    );
  return result.rows[0];
}
async function post(db, company, user, d) {
  const existing = await db.query(
    "SELECT id,number,details FROM vouchers WHERE company_id=$1 AND request_id=$2",
    [company.id, d.requestId],
  );
  if (existing.rows.length) {
    const old = existing.rows[0];
    if (!require("node:util").isDeepStrictEqual(old.details.input, d))
      fail("Request identifier already used for another voucher.", 409);
    return { id: old.id, number: old.number };
  }
  const masters = (await db.query("SELECT * FROM masters WHERE company_id=$1", [company.id])).rows;
  const byId = new Map(masters.map((m) => [m.id, m]));
  function get(id, kinds) {
    const m = byId.get(id);
    if (!m || !kinds.includes(m.kind)) fail("Select a valid " + kinds.join(" or ") + ".");
    return m;
  }
  const system = Object.fromEntries(
    masters.filter((m) => m.system_key).map((m) => [m.system_key, m.id]),
  );
  const entries = [],
    moves = [],
    lines = [];
  const entry = (ledger, amount) => entries.push([ledger, amount]);
  const move = (item, location, bucket, qty, value) =>
    moves.push({ item, location, bucket, qty: D(qty), value: cents(value) });
  const doc = documents.includes(d.kind);
  const isTrade = trade.includes(d.kind);
  const buy = ["purchase", "debitNote"].includes(d.kind);
  const returned = ["creditNote", "debitNote"].includes(d.kind);
  const direction = returned ? -1 : 1;
  const party = isTrade ? get(d.party, [buy ? "supplier" : "customer"]) : null;
  let original,
    priorReturns = [];
  if (returned) {
    original = (
      await db.query(
        "SELECT date::text,details FROM vouchers WHERE company_id=$1 AND number=$2 AND kind=$3",
        [company.id, d.reference.trim(), buy ? "purchase" : "sale"],
      )
    ).rows[0];
    if (!original || original.details.input.party !== d.party || original.date > d.date)
      fail("Select an earlier original bill for this party.");
    priorReturns = (
      await db.query(
        "SELECT details FROM vouchers WHERE company_id=$1 AND kind=$2 AND details->'input'->>'reference'=$3",
        [company.id, d.kind, d.reference],
      )
    ).rows;
  }
  const snapshot = {
    input: d,
    company: {
      name: company.name,
      address: company.address,
      gstin: company.gstin,
      state: company.state,
      contact: company.contact,
    },
    party: party ? { name: party.name, ...party.details } : null,
    lines,
  };
  let base = D(0),
    gst = D(0),
    total = D(0),
    cost = D(0);
  const taxes = { CGST: D(0), SGST: D(0), IGST: D(0) };
  if (isTrade || stock.includes(d.kind)) {
    if (!d.lines.length) fail("Add at least one item.");
    if (new Set(d.lines.map((l) => l.item)).size !== d.lines.length)
      fail("Combine repeated items into one line.");
    if (d.kind === "transfer" && (!d.destination || d.destination === d.location))
      fail("Choose a different destination.");
    const supply =
      original?.details.place || d.place || (buy ? company.state : party?.details.state) || "";
    snapshot.place = supply;
    for (const line of d.lines) {
      const item = get(line.item, ["item"]);
      const qty = D(line.qty);
      const originalIndex = original?.details.input.lines.findIndex((l) => l.item === item.id);
      const sold = original?.details.lines[originalIndex];
      let already = D(0);
      if (returned) {
        if (!sold) fail("Item missing from original bill.");
        for (const prev of priorReturns) {
          const i = prev.details.input.lines.findIndex((l) => l.item === item.id);
          if (i >= 0) {
            already = already.plus(prev.details.lines[i].qty);
          }
        }
        if (already.plus(qty).gt(sold.qty)) fail("Return quantity exceeds the unreturned quantity.");
        if (!D(line.rate).eq(sold.rate))
          fail("Return rate must match the original bill (" + sold.rate + ").");
      }
      // Round the cumulative share so partial returns add up to the original line.
      const share = (field) =>
        cents(D(sold[field]).times(already.plus(qty)).div(sold.qty)).minus(
          cents(D(sold[field]).times(already).div(sold.qty)),
        );
      const net = sold ? share("net") : cents(qty.times(line.rate));
      const bucket = d.kind === "release" ? "reserved" : "available";
      const balances = (
        await db.query(
          "SELECT coalesce(sum(qty),0) AS qty,coalesce(sum(value),0) AS value FROM movements WHERE company_id=$1 AND item_id=$2 AND location=$3 AND bucket=$4",
          [company.id, item.id, d.location, bucket],
        )
      ).rows[0];
      const latest = (
        await db.query(
          "SELECT max(v.date)::text AS date FROM movements m JOIN vouchers v ON v.id=m.voucher_id WHERE m.company_id=$1 AND item_id=$2",
          [company.id, item.id],
        )
      ).rows[0].date;
      if (!doc && latest && latest > d.date)
        fail("Stock vouchers must follow the last movement date for " + item.name + ".");
      const incoming = ["purchase", "creditNote", "stockIn"].includes(d.kind);
      if (!doc && !incoming && D(balances.qty).lt(qty))
        fail("Insufficient " + bucket + " stock of " + item.name + " at " + d.location + ".");
      let value = net;
      if (!incoming && !doc) value = cents(D(balances.value).times(qty).div(balances.qty));
      if (d.kind === "creditNote") value = share("cost");
      if (!doc) {
        const sign = incoming ? 1 : -1;
        move(item.id, d.location, bucket, qty.times(sign), value.times(sign));
        if (["transfer", "reserve", "release", "damage"].includes(d.kind)) {
          const target = {
            transfer: "available",
            reserve: "reserved",
            release: "available",
            damage: "damaged",
          }[d.kind];
          move(item.id, d.kind === "transfer" ? d.destination : d.location, target, qty, value);
        }
      }
      base = base.plus(net);
      cost = cost.plus(value);
      const rate = isTrade ? D(sold?.gst ?? item.details.gst ?? 0) : D(0);
      if (!rate.isZero() && (!supply || !(buy ? party.details.state : company.state)))
        fail("Set the supplier state and place of supply for GST.");
      let tax = cents(net.times(rate).div(100));
      const inter = original
        ? D(sold.igst).gt(0)
        : (buy ? party?.details.state : company.state)?.trim().toLowerCase() !==
          supply.trim().toLowerCase();
      const cgst = sold ? share("cgst") : inter ? D(0) : cents(tax.div(2));
      const sgst = sold ? share("sgst") : inter ? D(0) : tax.minus(cgst);
      const igst = sold ? share("igst") : inter ? tax : D(0);
      tax = cgst.plus(sgst).plus(igst);
      for (const [k, v] of Object.entries({ CGST: cgst, SGST: sgst, IGST: igst }))
        taxes[k] = taxes[k].plus(v);
      gst = gst.plus(tax);
      lines.push({
        cost: fmt(value),
        name: item.name,
        sku: item.details.sku,
        hsn: item.details.hsn,
        unit: byId.get(item.details.unit)?.name,
        qty: line.qty,
        rate: line.rate,
        net: fmt(net),
        gst: rate.toString(),
        cgst: fmt(cgst),
        sgst: fmt(sgst),
        igst: fmt(igst),
        total: fmt(net.plus(tax)),
      });
    }
    total = base.plus(gst);
    if (isTrade && !doc) {
      const sign = buy ? -direction : direction;
      entry(party.id, total.times(sign));
      if (buy) {
        entry(system.inventory, cost.times(direction));
        entry(system.adjust, base.minus(cost).times(direction));
      } else {
        entry(system.receipts, base.times(-direction));
        entry(system.cogs, cost.times(direction));
        entry(system.inventory, cost.times(-direction));
      }
      for (const [key, value] of Object.entries(taxes))
        entry(system[(buy ? "in" : "out") + key], value.times(-sign));
      if (D(d.paid).gt(total)) fail("Amount settled exceeds voucher total.");
      if (d.paid) {
        const account = get(d.account, ["cash", "bank"]);
        entry(account.id, D(d.paid).times(sign));
        entry(party.id, D(d.paid).times(-sign));
      }
    } else if (["stockIn", "stockOut"].includes(d.kind)) {
      const value = cost.times(d.kind === "stockIn" ? 1 : -1);
      entry(system.inventory, value);
      entry(system.adjust, value.neg());
    }
  } else {
    const ledgerKinds = Object.keys(classes);
    const debit = get(d.debit, ledgerKinds),
      credit = get(d.credit, ledgerKinds);
    if (debit.id === credit.id || !d.amount) fail("Choose different accounts and a positive amount.");
    if ([debit.system_key, credit.system_key].includes("inventory"))
      fail("Use a stock voucher to change inventory valuation.");
    const liquid = ["cash", "bank"];
    if (["receipt", "contra"].includes(d.kind) && !liquid.includes(debit.kind))
      fail("Debit a cash or bank account.");
    if (["payment", "payroll", "contra"].includes(d.kind) && !liquid.includes(credit.kind))
      fail("Credit a cash or bank account.");
    if (d.kind === "payroll" && debit.kind !== "expense") fail("Select a salary expense account.");
    if (d.kind === "reversingJournal" && (!d.reverseOn || d.reverseOn <= d.date))
      fail("Reversal date must be after the voucher date.");
    total = D(d.amount);
    entry(debit.id, total);
    entry(credit.id, total.neg());
    snapshot.debit = debit.name;
    snapshot.credit = credit.name;
  }
  Object.assign(snapshot, {
    base: fmt(base),
    gst: fmt(gst),
    paid: fmt(d.paid),
    taxes: Object.fromEntries(Object.entries(taxes).map(([k, v]) => [k, fmt(v)])),
  });
  const saved = await record(db, company, user, d, total, snapshot, entries, moves);
  if (d.kind === "reversingJournal")
    await record(
      db,
      company,
      user,
      { ...d, kind: "journal", date: d.reverseOn, requestId: require("node:crypto").randomUUID() },
      total,
      {
        ...snapshot,
        debit: snapshot.credit,
        credit: snapshot.debit,
        reference: saved.number,
        note: "Reversal of " + saved.number,
      },
      entries.map(([k, v]) => [k, D(v).neg()]),
      [],
    );
  return saved;
}
module.exports = { post, record };
