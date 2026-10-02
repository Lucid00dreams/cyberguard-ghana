const PDFDocument = require("pdfkit");
const prisma = require("../config/prisma");

/**
 * Streams a PDF "case brief" for a single incident report, formatted
 * for CSA Ghana officers to attach to a case file. Contains only the
 * data already in the anonymous report — no reporter PII exists to leak.
 */
async function exportCaseBriefPdf(req, res, next) {
  try {
    const report = await prisma.incidentReport.findUnique({
      where: { id: req.params.id },
      include: { evidence: true },
    });
    if (!report) return res.status(404).json({ error: "Report not found." });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="case-brief-${report.refCode}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text("CyberGuard Ghana — CSA Case Brief", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).fillColor("gray").text("Cybersecurity Act, 2020 (Act 1038) — Sections 62-67", { align: "center" });
    doc.moveDown(2);

    doc.fillColor("black").fontSize(12);
    doc.text(`Reference Code: ${report.refCode}`);
    doc.text(`Category: ${report.category}`);
    doc.text(`Status: ${report.status}`);
    doc.text(`Submitted: ${report.createdAt.toISOString()}`);
    doc.moveDown();

    doc.fontSize(13).text("Narrative", { underline: true });
    doc.fontSize(11).text(report.narrative, { align: "left" });
    doc.moveDown();

    doc.fontSize(13).text("Evidence Hash Chain of Custody", { underline: true });
    if (report.evidence.length === 0) {
      doc.fontSize(11).text("No evidence files attached to this report.");
    } else {
      report.evidence.forEach((ev, i) => {
        doc.moveDown(0.5);
        doc.fontSize(11).text(`${i + 1}. SHA-256: ${ev.sha256Hash}`);
        doc.fontSize(9).fillColor("gray").text(`   MIME type: ${ev.mimeType} | Size: ${ev.byteSize} bytes`);
        if (ev.duplicateOfId) {
          doc.fillColor("red").text(`   ⚠ Matches previously submitted evidence (ID: ${ev.duplicateOfId})`);
        }
        doc.fillColor("black");
      });
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("gray").text(
      "This report was submitted anonymously through the CyberGuard Ghana Zero-Knowledge Incident Portal. " +
        "No IP address, device identifier, or location data was collected at submission. All evidence hashes " +
        "were computed client-side prior to upload for integrity verification.",
      { align: "left" }
    );

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { exportCaseBriefPdf };
