"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Action } from "./Controls";
import {
  type Company,
  type Master,
  type Workspace,
  defaultFY,
  masterKinds,
  trade,
  stock,
  finance,
  label,
  today,
  rupees,
} from "./model";
type Save = (data: object) => Promise<void>;
export function CompanyForm({ company, save }: { company?: Company; save: Save }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: company?.name || "",
      address: company?.address || "",
      state: company?.state || "",
      contact: company?.contact || "",
      gstin: company?.gstin || "",
      year_start: company?.year_start || defaultFY(),
    },
  });
  return (
    <form className="form-grid" onSubmit={handleSubmit(save)}>
      {(["name", "address", "state", "contact", "gstin", "year_start"] as const).map((k) => (
        <Field
          key={k}
          title={
            {
              name: "Company name",
              address: "Registered address",
              state: "State or territory",
              contact: "Contact information",
              gstin: "GSTIN (optional)",
              year_start: "Financial year begins",
            }[k]
          }
        >
          <input
            {...register(k)}
            autoFocus={k === "name"}
            required={["name", "address", "state", "year_start"].includes(k)}
            type={k === "year_start" ? "date" : "text"}
          />
        </Field>
      ))}
      <div className="form-footer">
        <Action primary type="submit" disabled={isSubmitting}>
          Save company
        </Action>
      </div>
    </form>
  );
}
export function MasterForm({
  initial,
  existing,
  masters,
  save,
}: {
  initial: string;
  existing?: Master;
  masters: Master[];
  save: Save;
}) {
  const {
    register,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    shouldUnregister: true,
    defaultValues: {
      kind: existing?.kind || initial,
      name: existing?.name || "",
      category: existing?.category || "Assets",
      details: existing?.details || {},
      opening: 0,
      openingQty: 0,
    },
  });
  const kind = watch("kind"),
    item = kind === "item",
    party = ["customer", "supplier"].includes(kind),
    ledger = !["item", "unit", "group", "stockGroup"].includes(kind);
  const categories: Record<string, string> = {
    customer: "Assets",
    supplier: "Liabilities",
    bank: "Assets",
    cash: "Assets",
    asset: "Assets",
    liability: "Liabilities",
    income: "Income",
    expense: "Expenses",
  };
  return (
    <form className="form-grid" onSubmit={handleSubmit(save)}>
      <Field title="Master type">
        <select {...register("kind")} aria-readonly={!!existing}>
          {(existing ? [existing.kind] : masterKinds).map((k) => (
            <option key={k} value={k}>
              {label(k)}
            </option>
          ))}
        </select>
      </Field>
      <Field title="Name">
        <input autoFocus required {...register("name")} />
      </Field>
      {kind === "group" && (
        <Field title="Account category">
          <select {...register("category")}>
            {["Assets", "Liabilities", "Income", "Expenses"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      )}
      {(item || ledger) && (
        <Field title={item ? "Stock group" : "Ledger group"}>
          <select {...register("details.group")}>
            <option value="">Ungrouped</option>
            {masters
              .filter((m) =>
                item ? m.kind === "stockGroup" : m.kind === "group" && m.category === categories[kind],
              )
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </Field>
      )}
      {party &&
        (["address", "contact", "state", "gstin"] as const).map((k) => (
          <Field
            key={k}
            title={
              {
                address: "Address",
                contact: "Mobile / contact",
                state: "State or territory",
                gstin: "GSTIN",
              }[k]
            }
          >
            <input {...register(`details.${k}`)} />
          </Field>
        ))}
      {item && (
        <>
          <Field title="SKU">
            <input required {...register("details.sku")} />
          </Field>
          <Field title="Unit">
            <select required {...register("details.unit")}>
              <option value="">Select unit</option>
              {masters
                .filter((m) => m.kind === "unit")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field title="HSN code">
            <input {...register("details.hsn")} />
          </Field>
          {(["buy", "sell", "gst", "reorder"] as const).map((k) => (
            <Field
              key={k}
              title={
                {
                  buy: "Purchase rate (₹)",
                  sell: "Selling rate (₹)",
                  gst: "GST rate (%)",
                  reorder: "Low stock threshold",
                }[k]
              }
            >
              <input
                {...register(`details.${k}`)}
                type="number"
                defaultValue={existing?.details[k] || 0}
                min="0"
                step={k === "reorder" ? ".001" : ".01"}
                max={k === "gst" ? 100 : undefined}
              />
            </Field>
          ))}
        </>
      )}
      {!existing && (ledger || item) && (
        <Field title={item ? "Opening stock (Main)" : "Opening balance (₹)"}>
          <input
            {...register(item ? "openingQty" : "opening")}
            type="number"
            min="0"
            step={item ? ".001" : ".01"}
          />
        </Field>
      )}
      <div className="form-footer">
        <Action primary type="submit" disabled={isSubmitting}>
          Save master
        </Action>
      </div>
    </form>
  );
}
export function VoucherForm({
  kind,
  w,
  from,
  to,
  save,
  change,
}: {
  kind: string;
  w: Workspace;
  from: string;
  to: string;
  save: Save;
  change: (k: string) => void;
}) {
  const [requestId] = useState(() => crypto.randomUUID());
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      kind,
      date: today() < from ? from : today() > to ? to : today(),
      party: "",
      account: w.masters.find((m) => m.system_key === "cash")?.id || "",
      debit: kind === "payroll" ? w.masters.find((m) => m.system_key === "salary")?.id || "" : "",
      credit: "",
      amount: 0,
      paid: 0,
      note: "",
      reference: "",
      cheque: "",
      place: "",
      location: "Main",
      destination: "",
      reverseOn: "",
      lines: [{ item: "", qty: 1, rate: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const isTrade = trade.includes(kind),
    hasItems = isTrade || stock.includes(kind),
    buy = ["purchase", "debitNote"].includes(kind),
    nonposting = ["proforma", "quotation", "estimate"].includes(kind);
  const party = w.masters.find((m) => m.id === watch("party"));
  const lines = watch("lines");
  const gross = lines.reduce((s, l) => {
    const m = w.masters.find((x) => x.id === l.item);
    const base = Math.round(Number(l.qty) * Number(l.rate) * 100) / 100;
    return s + base + (isTrade ? Math.round(base * Number(m?.details.gst || 0)) / 100 : 0);
  }, 0);
  const options = (kinds: string[]) =>
    w.masters
      .filter((m) => kinds.includes(m.kind))
      .map((m) => (
        <option value={m.id} key={m.id}>
          {m.name}
        </option>
      ));
  const all = ["customer", "supplier", "bank", "cash", "asset", "liability", "income", "expense"];
  return (
    <form
      className="form-grid"
      onSubmit={handleSubmit((d) => save({ ...d, requestId, lines: hasItems ? d.lines : [] }))}
    >
      <Field title="Voucher type">
        <select value={kind} onChange={(e) => change(e.target.value)}>
          {[...trade, ...finance, ...stock].map((k) => (
            <option key={k} value={k}>
              {label(k)}
            </option>
          ))}
        </select>
      </Field>
      <Field title="Voucher date">
        <input required type="date" min={from} max={to} {...register("date")} />
      </Field>
      {isTrade && (
        <>
          <Field title={buy ? "Supplier" : "Customer"}>
            <select required {...register("party")}>
              <option value="">Select party</option>
              {options([buy ? "supplier" : "customer"])}
            </select>
          </Field>
          <Field title="Place of supply">
            <input
              {...register("place")}
              placeholder={(buy ? w.company.state : party?.details.state) || "State or territory"}
            />
          </Field>
        </>
      )}
      {hasItems ? (
        <>
          <Field title="Stock location">
            <input required {...register("location")} />
          </Field>
          {kind === "transfer" && (
            <Field title="Destination location">
              <input required {...register("destination")} />
            </Field>
          )}
          <div className="line-items">
            <h3>Items</h3>
            {fields.map((f, i) => (
              <div className="line-row" key={f.id}>
                <Field title="Stock item">
                  <select
                    required
                    {...register(`lines.${i}.item`, {
                      onChange: (e) => {
                        const m = w.masters.find((m) => m.id === e.target.value);
                        setValue(
                          `lines.${i}.rate`,
                          Number((buy || !isTrade ? m?.details.buy : m?.details.sell) || 0),
                        );
                      },
                    })}
                  >
                    <option value="">Select item</option>
                    {options(["item"])}
                  </select>
                </Field>
                <Field title="Quantity">
                  <input required type="number" min=".001" step=".001" {...register(`lines.${i}.qty`)} />
                </Field>
                <Field title="Rate (₹)">
                  <input required type="number" min="0" step=".01" {...register(`lines.${i}.rate`)} />
                </Field>
                <button
                  aria-label="Remove line"
                  type="button"
                  disabled={fields.length === 1}
                  onClick={() => remove(i)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <Action onClick={() => append({ item: "", qty: 1, rate: 0 })}>
              <Plus size={14} /> Add line
            </Action>
          </div>
        </>
      ) : (
        <>
          <Field title="Debit account">
            <select required {...register("debit")}>
              <option value="">Select account</option>
              {options(
                ["receipt", "contra"].includes(kind)
                  ? ["cash", "bank"]
                  : kind === "payroll"
                    ? ["expense"]
                    : all,
              )}
            </select>
          </Field>
          <Field title="Credit account">
            <select required {...register("credit")}>
              <option value="">Select account</option>
              {options(["payment", "payroll", "contra"].includes(kind) ? ["cash", "bank"] : all)}
            </select>
          </Field>
          <Field title="Amount (₹)">
            <input type="number" min=".01" step=".01" required {...register("amount")} />
          </Field>
          {kind === "reversingJournal" && (
            <Field title="Reverse on">
              <input required type="date" {...register("reverseOn")} />
            </Field>
          )}
        </>
      )}
      {isTrade && !nonposting && (
        <>
          <Field title="Amount settled now (₹)">
            <input type="number" min="0" step=".01" {...register("paid")} />
          </Field>
          <Field title="Settlement account">
            <select {...register("account")}>{options(["cash", "bank"])}</select>
          </Field>
        </>
      )}
      <Field title="Reference / original bill">
        <input
          list="erp-bill-numbers"
          required={["creditNote", "debitNote"].includes(kind)}
          {...register("reference")}
        />
      </Field>
      <datalist id="erp-bill-numbers">
        {w.vouchers
          .filter((v) => v.kind === (buy ? "purchase" : "sale") && v.party === party?.name)
          .map((v) => (
            <option key={v.id} value={v.number} />
          ))}
      </datalist>
      {!nonposting && (
        <Field title="Cheque number (if applicable)">
          <input {...register("cheque")} />
        </Field>
      )}
      <Field title={kind === "payroll" ? "Employee / pay period" : "Narration"}>
        <input required={kind === "payroll"} {...register("note")} />
      </Field>
      <div className="form-footer">
        {isTrade && (
          <strong>
            {["creditNote", "debitNote"].includes(kind) ? "Estimated total" : "Total"} {rupees(gross)}
          </strong>
        )}
        <Action primary type="submit" disabled={isSubmitting}>
          {nonposting ? "Save document" : "Post voucher"}
        </Action>
      </div>
    </form>
  );
}
