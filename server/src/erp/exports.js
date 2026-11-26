const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
async function spreadsheet(title, rows) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet(title.slice(0, 31));
  const keys = Object.keys(rows[0] || { message: "" });
  sheet.columns = keys.map((key) => ({ header: key.replaceAll("_", " "), key, width: 22 }));
  const numeric = new Set([
    "opening",
    "debit",
    "credit",
    "balance",
    "amount",
    "quantity",
    "available",
    "reserved",
    "damaged",
    "valuation",
    "reorder",
    "qty",
    "value",
    "outstanding",
    "cgst",
    "sgst",
    "igst",
    "taxable",
    "total",
  ]);
  sheet.addRows(
    rows.length
      ? rows.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, numeric.has(k) && v !== null ? Number(v) : v]),
          ),
        )
      : [{ message: "No entries in this period" }],
  );
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174C40" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return book.xlsx.writeBuffer();
}
function invoice(res, v) {
  const d = v.details,
    doc = new PDFDocument({ margin: 48, size: "A4" });
  const title =
    {
      sale: "Tax invoice",
      purchase: "Purchase voucher",
      creditNote: "Credit note",
      debitNote: "Debit note",
      proforma: "Proforma invoice",
      estimate: "Estimate",
      quotation: "Quotation",
    }[v.kind] || "Voucher";
  res.type("application/pdf").attachment(v.number + ".pdf");
  doc.pipe(res);
  doc
    .fillColor("#174C40")
    .fontSize(22)
    .text(d.company?.name || "SmartERP");
  doc
    .fontSize(11)
    .fillColor("#252e2b")
    .text(
      [d.company?.address, d.company?.state, d.company?.gstin, d.company?.contact]
        .filter(Boolean)
        .join(" | "),
    );
  doc
    .moveDown()
    .fontSize(18)
    .text(title + "  " + v.number)
    .fontSize(10)
    .text("Date: " + v.date);
  if (d.party)
    doc.text(
      "Party: " +
        [d.party.name, d.party.address, d.party.state, d.party.gstin].filter(Boolean).join(" | "),
    );
  if (d.place) doc.text("Place of supply: " + d.place);
  if (d.input?.reference) doc.text("Reference: " + d.input.reference);
  doc.moveDown();
  for (const l of d.lines || []) {
    if (doc.y > 680) doc.addPage();
    doc
      .font("Helvetica-Bold")
      .text(l.name + "   " + (l.sku || ""))
      .font("Helvetica")
      .text(
        "HSN " +
          (l.hsn || "-") +
          "   |   " +
          l.qty +
          " " +
          (l.unit || "") +
          " x INR " +
          l.rate +
          "   |   Taxable INR " +
          l.net,
      )
      .text(
        "GST " +
          l.gst +
          "%   |   CGST " +
          l.cgst +
          "   SGST " +
          l.sgst +
          "   IGST " +
          l.igst +
          "   |   INR " +
          l.total,
      )
      .moveDown(0.6);
  }
  if (doc.y > 615) doc.addPage();
  if (d.debit) doc.text("Debit: " + d.debit + "    Credit: " + d.credit);
  if (d.taxes)
    doc.text(
      "Taxable: INR " +
        d.base +
        "    CGST " +
        d.taxes.CGST +
        "    SGST " +
        d.taxes.SGST +
        "    IGST " +
        d.taxes.IGST,
    );
  doc
    .moveDown(0.5)
    .fontSize(14)
    .text("Total   INR " + v.total);
  if (["sale", "purchase", "creditNote", "debitNote"].includes(v.kind))
    doc
      .fontSize(11)
      .text(
        "Settled: INR " + d.paid + "    Balance: INR " + (Number(v.total) - Number(d.paid)).toFixed(2),
      );
  if (d.input?.note) doc.moveDown().fontSize(10).text(d.input.note);
  doc.end();
}
module.exports = { spreadsheet, invoice };
