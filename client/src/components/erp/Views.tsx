"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Action, DataTable, Field } from "./Controls";
import { type Workspace, type Row, download, message, rupees, today, label } from "./model";
export function Reports({
  base,
  w,
  type,
  ledger,
  from,
  to,
  change,
  revision,
}: {
  base: string;
  w: Workspace;
  type: string;
  ledger: string;
  from: string;
  to: string;
  change: (t: string, l?: string) => void;
  revision: number;
}) {
  const [rows, setRows] = useState<Row[]>([]),
    [item, setItem] = useState(""),
    [cleared, setCleared] = useState(today()),
    [version, setVersion] = useState(0),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState("");
  const requestKey = JSON.stringify([base, type, from, to, ledger, item]);
  const busy = loaded !== requestKey;
  useEffect(() => {
    let active = true;
    api
      .get(base + "/reports/" + type, { params: { from, to, ledger, item } })
      .then((r) => {
        if (active) {
          setRows(r.data);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoaded(requestKey);
      });
    return () => {
      active = false;
    };
  }, [base, type, from, to, ledger, item, version, revision, requestKey]);
  const bank = ["Bank transactions", "Cheques"].includes(type) && w.company.role !== "viewer";
  return (
    <>
      <div className="filter-bar">
        <Field title="Report">
          <select value={type} onChange={(e) => change(e.target.value)}>
            {w.reports.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        {type === "Ledger statement" && (
          <Field title="Ledger account">
            <select value={ledger} onChange={(e) => change(type, e.target.value)}>
              <option value="">Select ledger</option>
              {w.masters
                .filter((m) => m.category && m.kind !== "group")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        {type === "Item movements" && (
          <Field title="Stock item">
            <select value={item} onChange={(e) => setItem(e.target.value)}>
              <option value="">All items</option>
              {w.masters
                .filter((m) => m.kind === "item")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        {bank && (
          <Field title="Statement clearance date">
            <input type="date" value={cleared} onChange={(e) => setCleared(e.target.value)} />
          </Field>
        )}
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : busy ? (
        <p className="empty">Loading report…</p>
      ) : (
        <DataTable
          key={type}
          rows={rows}
          empty="No entries for this selection."
          onExport={() =>
            download(base + "/reports/" + type, type + ".xlsx", {
              from,
              to,
              ledger,
              item,
              format: "xlsx",
            }).catch((e) => toast.error(message(e)))
          }
          actions={
            bank
              ? (r) => (
                  <button
                    onClick={async () => {
                      try {
                        await api.patch(base + "/bank/" + r.id, {
                          cleared_on: r.cleared_on ? null : cleared,
                        });
                        setVersion((v) => v + 1);
                      } catch (e) {
                        toast.error(message(e));
                      }
                    }}
                  >
                    {r.cleared_on ? "Undo clearance" : "Mark cleared"}
                  </button>
                )
              : undefined
          }
        />
      )}
    </>
  );
}
export function Team({ base, audit, revision }: { base: string; audit: boolean; revision: number }) {
  const [rows, setRows] = useState<Row[]>([]),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    api
      .get(base + (audit ? "/audit" : "/members"))
      .then((r) => {
        if (live) setRows(r.data);
      })
      .catch((e) => toast.error(message(e)));
    return () => {
      live = false;
    };
  }, [base, audit, version, revision]);
  return (
    <>
      {!audit && (
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const d = Object.fromEntries(new FormData(form));
            try {
              await api.post(base + "/members", d);
              form.reset();
              setVersion((v) => v + 1);
              toast.success("Access saved");
            } catch (err) {
              toast.error(message(err));
            }
          }}
        >
          <Field title="Email">
            <input type="email" required name="email" />
          </Field>
          <Field title="Company role">
            <select name="role">
              <option>viewer</option>
              <option>operator</option>
            </select>
          </Field>
          <Field title="Name for new account">
            <input name="name" />
          </Field>
          <Field title="Password for new account">
            <input type="password" autoComplete="new-password" name="password" minLength={8} />
          </Field>
          <div className="form-footer">
            <Action primary type="submit">
              Save access
            </Action>
          </div>
        </form>
      )}
      <DataTable
        rows={rows}
        actions={
          audit
            ? undefined
            : (r) => (
                <button
                  onClick={async () => {
                    if (window.confirm("Remove company access for " + r.email + "?"))
                      try {
                        await api.delete(base + "/members/" + r.id);
                        setVersion((v) => v + 1);
                      } catch (e) {
                        toast.error(message(e));
                      }
                  }}
                >
                  Remove access
                </button>
              )
        }
      />
    </>
  );
}
type DocumentDetails = {
  company?: { name: string; address: string; gstin: string; state: string };
  party?: { name: string; address: string; gstin: string };
  place?: string;
  lines?: Row[];
  taxes?: Record<string, string>;
  paid?: string;
  base?: string;
  debit?: string;
  credit?: string;
  input?: { note: string; reference: string };
  note?: string;
};
export function DocumentView({ base, id }: { base: string; id: string }) {
  const [v, setV] = useState<{
      id: string;
      date: string;
      number: string;
      total: string;
      kind: string;
      details: DocumentDetails;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    api
      .get(base + "/vouchers/" + id)
      .then((r) => {
        if (live) setV(r.data);
      })
      .catch((e) => {
        if (live) setError(message(e));
      });
    return () => {
      live = false;
    };
  }, [base, id]);
  if (!v) return <p>{error || "Loading voucher…"}</p>;
  const d = v.details;
  return (
    <article className="invoice">
      <div className="document-actions">
        <Action onClick={() => window.print()}>Print</Action>
        <Action
          primary
          onClick={() =>
            download(base + "/vouchers/" + id + "/pdf", v.number + ".pdf").catch((e) =>
              toast.error(message(e)),
            )
          }
        >
          Download PDF
        </Action>
      </div>
      <div className="invoice-head">
        <div>
          <h2>{d.company?.name}</h2>
          <p>
            {d.company?.address} {d.company?.state}
          </p>
          <p>{d.company?.gstin}</p>
        </div>
        <div>
          <h3>{label(v.kind)}</h3>
          <b>{v.number}</b>
          <p>{v.date}</p>
        </div>
      </div>
      {d.party && (
        <p>
          <b>{d.party.name}</b>
          <br />
          {d.party.address} {d.party.gstin}
          <br />
          Place of supply · {d.place}
        </p>
      )}
      {d.input?.reference && <p>Reference · {d.input.reference}</p>}
      {!!d.lines?.length && (
        <div className="scroll-table">
          <table>
            <thead>
              <tr>
                {["Item / HSN", "Quantity", "Rate", "Taxable", "GST", "Total"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.lines.map((line, i) => (
                <tr key={i}>
                  <td>
                    {line.name}
                    <br />
                    <small>
                      {line.sku} · {line.hsn || "—"}
                    </small>
                  </td>
                  <td>
                    {line.qty} {line.unit}
                  </td>
                  <td>{rupees(line.rate)}</td>
                  <td>{rupees(line.net)}</td>
                  <td>
                    {line.gst}%<br />
                    <small>{rupees(Number(line.cgst) + Number(line.sgst) + Number(line.igst))}</small>
                  </td>
                  <td>{rupees(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {d.debit && (
        <p>
          Debit · {d.debit}
          <br />
          Credit · {d.credit}
        </p>
      )}
      <div className="invoice-total">
        {d.taxes && (
          <p>
            CGST {rupees(d.taxes.CGST)} · SGST {rupees(d.taxes.SGST)} · IGST {rupees(d.taxes.IGST)}
          </p>
        )}
        <h2>Total {rupees(v.total)}</h2>
        {["sale", "purchase", "creditNote", "debitNote"].includes(v.kind) && (
          <p>
            Settled {rupees(d.paid)} · Balance {rupees(Number(v.total) - Number(d.paid))}
          </p>
        )}
      </div>
      <p>{d.note || d.input?.note}</p>
    </article>
  );
}
export function Calculator() {
  const [a, setA] = useState(""),
    [b, setB] = useState(""),
    [op, setOp] = useState("+"),
    [out, setOut] = useState("");
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        const x = Number(a),
          y = Number(b);
        setOut(
          op === "/" && !y
            ? "Cannot divide by zero"
            : String(
                Number(({ "+": x + y, "-": x - y, "×": x * y, "/": x / y }[op] || 0).toPrecision(12)),
              ),
        );
      }}
    >
      <Field title="First value">
        <input
          autoFocus
          required
          type="number"
          step="any"
          value={a}
          onChange={(e) => setA(e.target.value)}
        />
      </Field>
      <Field title="Operation">
        <select value={op} onChange={(e) => setOp(e.target.value)}>
          {["+", "-", "×", "/"].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </Field>
      <Field title="Second value">
        <input required type="number" step="any" value={b} onChange={(e) => setB(e.target.value)} />
      </Field>
      <div className="form-footer">
        <output>{out}</output>
        <Action type="submit" primary>
          Calculate
        </Action>
      </div>
    </form>
  );
}
