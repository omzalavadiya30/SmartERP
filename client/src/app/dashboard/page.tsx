"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Boxes,
  Building2,
  Calculator as Calc,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Command,
  FileBarChart2,
  FileText,
  Home,
  Landmark,
  Layers3,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthContext } from "@/context/AuthContext";
import { Action, DataTable, Field } from "@/components/erp/Controls";
import { CompanyForm, MasterForm, VoucherForm } from "@/components/erp/Forms";
import { Calculator, DocumentView, Reports, Team } from "@/components/erp/Views";
import {
  type Company,
  type Workspace,
  type Row,
  defaultFY,
  yearEnd,
  label,
  masterKinds,
  trade,
  stock,
  finance,
  rupees,
  message,
  download,
} from "@/components/erp/model";
import { useCompanyUpdates } from "@/components/erp/useCompanyUpdates";
import "./workspace.css";

type Screen = { name: string; kind?: string; id?: string };
const home = { name: "Gateway" };
const nav = [
  ["Gateway", Home],
  ["Masters", Layers3],
  ["Transactions", ClipboardList],
  ["Inventory", Boxes],
  ["Accounting", BookOpen],
  ["Banking", Landmark],
  ["Payroll", Users],
  ["GST", FileText],
  ["Reports", FileBarChart2],
  ["Utilities", Calc],
  ["Administration", Settings2],
] as const;
const areaActions: Record<string, string[]> = {
  Transactions: [...trade, ...finance.filter((k) => k !== "payroll")],
  Inventory: stock,
  Accounting: finance.filter((k) => k !== "payroll"),
  Banking: ["contra", "payment", "receipt"],
  Payroll: ["payroll"],
};
const areaReports: Record<string, string[]> = {
  Inventory: ["Stock summary", "Low stock", "Item movements", "Inventory valuation"],
  Accounting: ["Ledger statement", "Trial balance", "Profit and loss", "Balance sheet", "Cash flow"],
  Banking: ["Bank transactions", "Cheques", "Cash flow"],
  Payroll: ["Payroll register"],
  GST: ["GST register", "GST summary", "GSTR outward supply summary"],
};
export default function Dashboard() {
  const { user, loading, logout } = useAuthContext(),
    router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]),
    [company, setCompany] = useState<Company | null>(null),
    [w, setW] = useState<Workspace | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "Companies" }),
    [history, setHistory] = useState<Screen[]>([]);
  const [from, setFrom] = useState(defaultFY),
    [to, setTo] = useState(() => yearEnd(defaultFY())),
    [revision, refresh] = useState(0),
    [problem, setProblem] = useState(""),
    [q, search] = useState(""),
    [menu, setMenu] = useState(false);
  const base = "/companies/" + company?.id;
  const go = (name: string, kind = "", id = "") => {
    setHistory((prev) => [...prev, screen]);
    setScreen({ name, kind, id });
    setMenu(false);
    search("");
  };
  const back = () => {
    const prev = history.at(-1);
    setHistory((h) => h.slice(0, -1));
    setScreen(prev || (company ? home : { name: "Companies" }));
    setMenu(false);
  };
  const select = (c: Company) => {
    setCompany(c);
    setW(null);
    setFrom(c.year_start);
    setTo(yearEnd(c.year_start));
    setHistory([]);
    setScreen(home);
    setProblem("");
  };
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);
  useEffect(() => {
    if (!user) return;
    let live = true;
    api
      .get("/companies")
      .then((r) => {
        if (live) setCompanies(r.data);
      })
      .catch((e) => {
        if (live) setProblem(message(e));
      });
    return () => {
      live = false;
    };
  }, [user, revision]);
  useEffect(() => {
    if (!company) return;
    let live = true;
    api
      .get(base + "/workspace", { params: { from, to } })
      .then((r) => {
        if (live) {
          setProblem("");
          setW(r.data);
        }
      })
      .catch((e) => {
        if (live) {
          setW(null);
          setProblem(message(e));
        }
      });
    return () => {
      live = false;
    };
  }, [base, company, from, to, revision]);
  const onUpdate = useCallback(() => refresh((v) => v + 1), []);
  useCompanyUpdates(company?.id, onUpdate);
  const active = w?.company || company;
  const editable = active?.role !== "viewer";
  const kind = screen.kind || "",
    id = screen.id || "";
  const master = w?.masters.find((m) => m.id === id);
  const report = (type: string, ledger = "") => go("Report", type, ledger);
  const save = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setProblem("");
      refresh((v) => v + 1);
    } catch (e) {
      toast.error(message(e));
    }
  };
  const groups = ["Companies", "New company", "Edit company"];
  const companyPage = groups.includes(screen.name);
  const logOut = async () => {
    await logout();
    router.replace("/login");
  };
  const newMaster = (k: string) => go("New master", k);
  const voucher = (k: string) => go("New voucher", k);
  const openSearch = () => go("Command search");
  const remove = async (mid: string) => {
    const m = w?.masters.find((v) => v.id === mid);
    if (m && window.confirm("Delete " + m.name + "?"))
      await save(async () => {
        await api.delete(base + "/masters/" + mid);
        go("Masters", m.kind);
      });
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName) || el.isContentEditable;
      const key = e.key.toLowerCase();
      const focusedItem =
        w?.masters.find(
          (m) => m.kind === "item" && m.id === el.closest("[data-row-id]")?.getAttribute("data-row-id"),
        ) || (master?.kind === "item" ? master : undefined);
      if (key === "escape") {
        e.preventDefault();
        back();
        return;
      }
      if (!typing && (key === "arrowdown" || key === "arrowup")) {
        const buttons = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".erp-main button:not(:disabled),.erp-main a,.erp-main select,.erp-main input",
          ),
        ).filter((b) => b.offsetParent);
        if (buttons.length) {
          e.preventDefault();
          const index = buttons.indexOf(el);
          buttons[(index + (key === "arrowdown" ? 1 : -1) + buttons.length) % buttons.length].focus();
        }
        return;
      }
      const combo =
        (e.ctrlKey || e.metaKey ? "ctrl+" : "") +
        (e.altKey ? "alt+" : "") +
        (e.shiftKey ? "shift+" : "") +
        key;
      if (
        typing &&
        ["ctrl+c", "ctrl+a", "ctrl+f", "ctrl+h", "ctrl+d", "ctrl+r", "ctrl+t", "ctrl+e"].includes(combo)
      )
        return;
      const actions: Record<string, () => void> = {
        f1: () => go("Companies"),
        "ctrl+q": () => void logOut(),
        f5: () => refresh((v) => v + 1),
      };
      if (w && !companyPage)
        Object.assign(actions, {
          f2: () => go("Financial year"),
          f3: () => go("Company information"),
          f4: () => go("Calculator"),
          "ctrl+h": () => go("Gateway"),
          "ctrl+k": openSearch,
          "ctrl+shift+f": openSearch,
          "ctrl+f": () => {
            const f = document.querySelector<HTMLInputElement>("[data-filter]");
            if (f) f.focus();
            else openSearch();
          },
          "alt+b": () => report("Balance sheet"),
          "alt+p": () => report("Profit and loss"),
          "alt+t": () => report("Trial balance"),
          "alt+c": () => report("Cash flow"),
          "alt+r": () => report("Stock summary"),
          "alt+x": () => report("GST summary"),
          "ctrl+i": () => go("Inventory"),
          "ctrl+r": () => report("Stock summary"),
          "ctrl+shift+c": () => go("Masters", "customer"),
          "ctrl+shift+s": () => go("Masters", "supplier"),
        });
      if (w && !companyPage && editable)
        Object.assign(actions, {
          "alt+l": () => newMaster("customer"),
          "alt+a": () => go("Masters"),
          "alt+g": () => newMaster("group"),
          "alt+s": () => newMaster("item"),
          "alt+u": () => newMaster("unit"),
          f6: () => voucher("receipt"),
          f7: () => voucher("journal"),
          f8: () => voucher("sale"),
          f9: () => voucher("purchase"),
          f10: () => voucher("reversingJournal"),
          "alt+f8": () => voucher("creditNote"),
          "alt+f9": () => voucher("debitNote"),
          "ctrl+n": () => newMaster("item"),
          "ctrl+e": () =>
            focusedItem ? go("Edit master", "item", focusedItem.id) : go("Masters", "item"),
          "ctrl+d": () => (focusedItem ? void remove(focusedItem.id) : go("Masters", "item")),
          "ctrl+t": () => voucher("transfer"),
          "ctrl+b": () => voucher("sale"),
          "ctrl+c": () => newMaster("customer"),
          "ctrl+s": () => newMaster("supplier"),
        });
      if (screen.name === "Document")
        Object.assign(actions, {
          "ctrl+p": () => window.print(),
          "ctrl+shift+p": () =>
            download(
              base + "/vouchers/" + id + "/pdf",
              (w?.vouchers.find((v) => v.id === id)?.number || "voucher") + ".pdf",
            ).catch((e) => toast.error(message(e))),
        });
      if (actions[combo]) {
        e.preventDefault();
        actions[combo]();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  if (loading || !user) return <main className="empty">Opening SmartERP…</main>;
  const title = ["New voucher", "New master"].includes(screen.name)
    ? (screen.name === "New master" ? "New " : "") + label(kind)
    : screen.name === "Report"
      ? kind
      : screen.name === "Gateway"
        ? "Business overview"
        : screen.name === "Document"
          ? "Voucher details"
          : screen.name;
  const docRows = (w?.vouchers || []).map((v) => ({
    id: v.id,
    date: v.date,
    number: v.number,
    type: label(v.kind),
    party: v.party,
    total: rupees(v.total),
  }));
  const openDoc = (r: Row) => <button onClick={() => go("Document", "", String(r.id))}>View</button>;
  const commands = [
    ...nav
      .filter(([n]) => n !== "Administration" || active?.role === "owner")
      .map(([n]) => ({ text: n, act: () => go(n) })),
    ...(editable
      ? [...trade, ...finance, ...stock].map((k) => ({ text: label(k), act: () => voucher(k) }))
      : []),
    ...(w?.reports || []).map((n) => ({ text: n, act: () => report(n) })),
    ...(w?.masters || []).map((m) => ({
      text: label(m.kind) + " · " + m.name,
      act: () =>
        m.kind === "item"
          ? report("Stock summary")
          : m.category && m.kind !== "group"
            ? report("Ledger statement", m.id)
            : go("Masters", m.kind),
    })),
    ...(w?.vouchers || []).map((v) => ({
      text: v.number + " · " + v.party,
      act: () => go("Document", "", v.id),
    })),
  ];
  return (
    <div className={"erp " + (menu ? "menu-open" : "")}>
      <aside className="erp-side">
        <div className="brand">
          <span className="brand-symbol">
            <Layers3 size={21} />
          </span>
          SmartERP
        </div>
        <button className="company-switch" onClick={() => go("Companies")}>
          <Building2 size={17} />
          <span>{active?.name || "Select company"}</span>
          <ChevronDown size={14} />
        </button>
        <nav aria-label="Workspace">
          {nav
            .filter(([n]) => n !== "Administration" || active?.role === "owner")
            .map(([n, Icon]) => (
              <button
                key={n}
                disabled={!company}
                className={screen.name === n ? "on" : ""}
                onClick={() => go(n)}
              >
                <Icon size={17} />
                {n}
              </button>
            ))}
        </nav>
        <div className="profile">
          <span>{user.name?.slice(0, 1)}</span>
          <div>
            <b>{user.name}</b>
            <small>{active?.role || "Account"}</small>
          </div>
          <button aria-label="Sign out" onClick={logOut}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="erp-main">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMenu(!menu)}>
            <Menu size={19} />
          </button>
          <span>Workspace</span>
          <ChevronRight size={14} />
          <b>{companyPage ? "Companies" : screen.name}</b>
          {w && !companyPage && (
            <button className="search-button" onClick={openSearch}>
              <Search size={15} /> Search <kbd>Ctrl K</kbd>
            </button>
          )}
        </header>
        <div className="erp-content">
          <div className="page-heading">
            <div>
              <p className="context-name">{companyPage ? "Company management" : active?.name}</p>
              <h1>{title}</h1>
            </div>
            {!companyPage && company && (
              <Action onClick={() => go("Financial year")}>
                FY {from.slice(0, 4)}–{to.slice(2, 4)} <ChevronDown size={13} />
              </Action>
            )}
          </div>
          {problem && (
            <div className="problem" role="alert">
              {problem} <button onClick={() => refresh((v) => v + 1)}>Retry</button>
            </div>
          )}
          {screen.name === "Companies" && (
            <>
              <div className="section-head">
                <h2>Your companies</h2>
                <Action primary onClick={() => go("New company")}>
                  <Plus size={15} /> Create company
                </Action>
              </div>
              <div className="company-list">
                {companies.map((c) => (
                  <div className="company-card" key={c.id}>
                    <Building2 />
                    <div>
                      <h3>{c.name}</h3>
                      <p>
                        {c.state} · {c.role}
                      </p>
                    </div>
                    <Action primary onClick={() => select(c)}>
                      Open
                    </Action>
                    {c.role === "owner" && (
                      <Action onClick={() => go("Edit company", "", c.id)}>Edit</Action>
                    )}
                  </div>
                ))}
              </div>
              {!companies.length && (
                <p className="empty">Create your first company to start entering stock and vouchers.</p>
              )}
            </>
          )}
          {["New company", "Edit company"].includes(screen.name) && (
            <div className="panel">
              <CompanyForm
                key={id}
                company={companies.find((c) => c.id === id)}
                save={(d) =>
                  save(async () => {
                    const result = id
                      ? await api.put("/companies/" + id, d)
                      : await api.post("/companies", d);
                    const list: Company[] = (await api.get("/companies")).data;
                    setCompanies(list);
                    const chosen = list.find((c) => c.id === (id || result.data.id));
                    if (chosen) select(chosen);
                    toast.success("Company saved");
                  })
                }
              />
              {id && (
                <button
                  className="danger"
                  onClick={async () => {
                    const c = companies.find((x) => x.id === id);
                    const confirm = window.prompt(
                      "Permanently delete all records? Type the company name to confirm.",
                    );
                    if (c && confirm === c.name)
                      await save(async () => {
                        await api.delete("/companies/" + id, { data: { confirm } });
                        if (company?.id === id) {
                          setCompany(null);
                          setW(null);
                        }
                        setHistory([]);
                        setScreen({ name: "Companies" });
                      });
                  }}
                >
                  Delete company
                </button>
              )}
            </div>
          )}
          {!companyPage && !w && !problem && <p className="empty">Loading workspace…</p>}
          {w && !companyPage && (
            <>
              {screen.name === "Gateway" && (
                <>
                  <div className="metrics">
                    {[
                      {
                        name: "Sales this year",
                        value: rupees(
                          w.vouchers.reduce(
                            (s, v) =>
                              s +
                              (v.kind === "sale" ? 1 : v.kind === "creditNote" ? -1 : 0) *
                                Number(v.total),
                            0,
                          ),
                        ),
                        icon: Activity,
                        report: "Sales register",
                      },
                      {
                        name: "Receivables",
                        value: rupees(w.customers.reduce((s, r) => s + Number(r.outstanding), 0)),
                        icon: ArrowDownLeft,
                        report: "Customer outstanding",
                      },
                      {
                        name: "Payables",
                        value: rupees(w.suppliers.reduce((s, r) => s + Number(r.outstanding), 0)),
                        icon: ArrowUpRight,
                        report: "Supplier outstanding",
                      },
                      {
                        name: "Stock value",
                        value: rupees(w.stock.reduce((s, r) => s + Number(r.valuation), 0)),
                        icon: Package,
                        report: "Inventory valuation",
                      },
                    ].map(({ name, value, icon: Icon, report: r }) => (
                      <button key={name} onClick={() => report(r)}>
                        <span>
                          <Icon size={16} />
                          {name}
                        </span>
                        <strong>{value}</strong>
                      </button>
                    ))}
                  </div>
                  {editable && (
                    <div className="quick-actions">
                      <button onClick={() => voucher("sale")}>
                        <FileText />
                        <div>
                          <b>New sales invoice</b>
                          <small>Bill a customer</small>
                        </div>
                        <kbd>F8</kbd>
                      </button>
                      <button onClick={() => voucher("purchase")}>
                        <Wallet />
                        <div>
                          <b>New purchase</b>
                          <small>Receive supplier stock</small>
                        </div>
                        <kbd>F9</kbd>
                      </button>
                    </div>
                  )}
                  <div className="section-head">
                    <h2>Recent vouchers</h2>
                    <button onClick={() => go("Transactions")}>View register →</button>
                  </div>
                  <DataTable
                    rows={docRows.slice(0, 8)}
                    actions={openDoc}
                    empty="Posted vouchers will appear here."
                  />
                </>
              )}
              {screen.name === "Masters" && (
                <>
                  <div className="filter-bar">
                    <Field title="Show masters">
                      <select
                        value={kind}
                        onChange={(e) => setScreen({ ...screen, kind: e.target.value })}
                      >
                        <option value="">All masters</option>
                        {masterKinds.map((k) => (
                          <option key={k} value={k}>
                            {label(k)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {editable && (
                      <Action primary onClick={() => newMaster(kind || "customer")}>
                        <Plus size={14} /> Create master
                      </Action>
                    )}
                  </div>
                  <DataTable
                    rows={w.masters
                      .filter((m) => !kind || m.kind === kind)
                      .map((m) => ({
                        id: m.id,
                        name: m.name,
                        type: label(m.kind),
                        category: m.category,
                        sku: m.details.sku || "",
                      }))}
                    actions={(r) => {
                      const m = w.masters.find((x) => x.id === r.id)!;
                      return (
                        <div className="row-actions">
                          {m.category && m.kind !== "group" && (
                            <button onClick={() => report("Ledger statement", m.id)}>Statement</button>
                          )}
                          {editable && !m.system_key && (
                            <>
                              <button onClick={() => go("Edit master", m.kind, m.id)}>Edit</button>
                              <button onClick={() => void remove(m.id)}>Delete</button>
                            </>
                          )}
                        </div>
                      );
                    }}
                  />
                </>
              )}
              {["New master", "Edit master"].includes(screen.name) && editable && (
                <div className="panel">
                  <MasterForm
                    key={id + kind}
                    masters={w.masters}
                    initial={kind}
                    existing={master}
                    save={(d) =>
                      save(async () => {
                        if (id) await api.put(base + "/masters/" + id, d);
                        else await api.post(base + "/masters", d);
                        go("Masters", (d as { kind: string }).kind);
                        toast.success("Master saved");
                      })
                    }
                  />
                </div>
              )}
              {screen.name === "New voucher" && editable && (
                <div className="panel">
                  <VoucherForm
                    key={kind}
                    kind={kind}
                    change={voucher}
                    w={w}
                    from={from}
                    to={to}
                    save={(d) =>
                      save(async () => {
                        const r = await api.post(base + "/vouchers", d);
                        go("Document", "", r.data.id);
                        toast.success(r.data.number + " saved");
                      })
                    }
                  />
                </div>
              )}
              {screen.name === "Document" && <DocumentView key={id} id={id} base={base} />}
              {(areaActions[screen.name] || areaReports[screen.name]) && (
                <>
                  {editable && areaActions[screen.name] && (
                    <>
                      <h2>Enter a voucher</h2>
                      <div className="action-grid">
                        {areaActions[screen.name].map((k) => (
                          <button key={k} onClick={() => voucher(k)}>
                            {label(k)}
                            <Plus size={14} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {areaReports[screen.name] && (
                    <>
                      <h2>Reports</h2>
                      <div className="action-grid">
                        {areaReports[screen.name].map((k) => (
                          <button key={k} onClick={() => report(k)}>
                            {k}
                            <ChevronRight size={15} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {screen.name === "Inventory" && (
                    <>
                      <div className="section-head">
                        <h2>Stock on hand</h2>
                        {editable && <Action onClick={() => newMaster("item")}>New stock item</Action>}
                      </div>
                      <DataTable rows={w.stock} />
                    </>
                  )}
                  {screen.name === "Transactions" && (
                    <>
                      <h2>Voucher register</h2>
                      <DataTable rows={docRows} actions={openDoc} />
                    </>
                  )}
                </>
              )}
              {screen.name === "Reports" && (
                <div className="action-grid">
                  {w.reports.map((k) => (
                    <button key={k} onClick={() => report(k)}>
                      {k}
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}
              {screen.name === "Report" && (
                <Reports
                  base={base}
                  w={w}
                  revision={revision}
                  type={kind}
                  ledger={id}
                  from={from}
                  to={to}
                  change={(k, l) => setScreen({ name: "Report", kind: k, id: l })}
                />
              )}
              {screen.name === "Financial year" && (
                <form
                  className="panel form-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const d = String(new FormData(e.currentTarget).get("start"));
                    setFrom(d);
                    setTo(yearEnd(d));
                    back();
                  }}
                >
                  <Field title="Financial year starts">
                    <input required type="date" name="start" defaultValue={from} />
                  </Field>
                  <div className="form-footer">
                    <Action primary type="submit">
                      Apply year
                    </Action>
                  </div>
                </form>
              )}
              {screen.name === "Company information" && (
                <>
                  <DataTable
                    rows={[
                      {
                        name: w.company.name,
                        address: w.company.address,
                        state: w.company.state,
                        gstin: w.company.gstin,
                        contact: w.company.contact,
                      },
                    ]}
                  />
                  {w.company.role === "owner" && (
                    <Action onClick={() => go("Edit company", "", w.company.id)}>Edit company</Action>
                  )}
                </>
              )}
              {screen.name === "Utilities" && (
                <div className="action-grid">
                  {[
                    "Calculator",
                    "Command search",
                    "Financial year",
                    "Company information",
                    "Keyboard shortcuts",
                  ].map((n) => (
                    <button key={n} onClick={() => go(n)}>
                      {n}
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}
              {screen.name === "Calculator" && (
                <div className="panel">
                  <Calculator />
                </div>
              )}
              {screen.name === "Keyboard shortcuts" && <DataTable rows={shortcutRows} />}
              {screen.name === "Administration" && w.company.role === "owner" && (
                <div className="action-grid">
                  {["Team access", "Audit log", "Company information"].map((n) => (
                    <button key={n} onClick={() => go(n)}>
                      {n}
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}
              {["Team access", "Audit log"].includes(screen.name) && w.company.role === "owner" && (
                <Team
                  key={screen.name}
                  base={base}
                  audit={screen.name === "Audit log"}
                  revision={revision}
                />
              )}
              {screen.name === "Command search" && (
                <>
                  <Field title="Find an action, party, item or voucher">
                    <input
                      data-filter
                      autoFocus
                      value={q}
                      onChange={(e) => search(e.target.value)}
                      placeholder="Search workspace…"
                    />
                  </Field>
                  <div className="action-grid">
                    {commands
                      .filter((c) => c.text.toLowerCase().includes(q.toLowerCase()))
                      .map((c, i) => (
                        <button key={i} onClick={c.act}>
                          {c.text}
                          <Command size={13} />
                        </button>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
          {screen.name !== "Gateway" && screen.name !== "Companies" && (
            <button className="back-link" onClick={back}>
              ← Back <kbd>Esc</kbd>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
const shortcutRows = [
  ["F1 / F2 / F3", "Companies / Financial year / Company information"],
  ["F4 / F5", "Calculator / Refresh"],
  ["Esc / Ctrl H / Ctrl Q", "Back / Home / Sign out"],
  ["Ctrl K / Ctrl Shift F / Ctrl F", "Command search / Global search / Search table"],
  ["Alt L / Alt A / Alt G / Alt S / Alt U", "Create ledger / Alter ledger / Group / Stock item / Unit"],
  ["F6 / F7 / F8 / F9 / F10", "Receipt / Journal / Sale / Purchase / Reversing journal"],
  ["Alt F8 / Alt F9", "Credit note / Debit note"],
  [
    "Ctrl I / N / E / D / T / R",
    "Inventory / New item / Edit item / Delete item / Transfer / Stock report",
  ],
  ["Ctrl B / Ctrl P / Ctrl Shift P", "New invoice / Print / Download PDF"],
  ["Ctrl C / Ctrl Shift C", "New customer / Customer ledgers"],
  ["Ctrl S / Ctrl Shift S", "New supplier / Supplier ledgers"],
  [
    "Alt B / P / T / C / R / X",
    "Balance sheet / Profit and loss / Trial balance / Cash flow / Stock summary / GST",
  ],
  ["↑ ↓ / Enter / Tab / Shift Tab", "Navigate / Select / Next field / Previous field"],
].map(([shortcut, action]) => ({ shortcut, action }));
