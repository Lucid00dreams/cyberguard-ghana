import { useRef, useState } from "react";
import { Award, Download, Printer, X, ShieldCheck, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function CertificateModal({ certificate, studentName, courseTitle, onClose }) {
  const certRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState("");

  const referenceCode = certificate?.certRef || `CG-GH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const issueDate = certificate?.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  const nameToDisplay = studentName || "Ghana Student";
  const titleToDisplay = courseTitle || certificate?.courseTitle || "Cybersecurity & Digital Defense";

  // Export as Image (PNG)
  async function handleExportImage() {
    if (!certRef.current) return;
    setExporting(true);
    setExportSuccess("");
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3, // High definition render
        useCORS: true,
        backgroundColor: "#FFFFFF",
      });
      const imageUri = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `CyberGuard_Certificate_${referenceCode}.png`;
      link.href = imageUri;
      link.click();
      setExportSuccess("Certificate exported as PNG image!");
      setTimeout(() => setExportSuccess(""), 3000);
    } catch (err) {
      console.error("Image export error:", err);
    } finally {
      setExporting(false);
    }
  }

  // Export as PDF Document
  async function handleExportPDF() {
    if (!certRef.current) return;
    setExporting(true);
    setExportSuccess("");
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#FFFFFF",
      });
      const imgData = canvas.toDataURL("image/png");

      // Landscape A4 PDF (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CyberGuard_Certificate_${referenceCode}.pdf`);

      setExportSuccess("Certificate exported as PDF!");
      setTimeout(() => setExportSuccess(""), 3000);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative my-auto max-h-[96vh] flex flex-col justify-between">

        {/* Top Control Header Bar (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Accredited National COP Certificate</h3>
              <p className="text-xs text-slate-500">Official Landscape Credential • Republic of Ghana</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {exportSuccess && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {exportSuccess}
              </span>
            )}

            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> Export PDF
            </button>

            <button
              onClick={handleExportImage}
              disabled={exporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" /> Export Image (PNG)
            </button>

            <button
              onClick={handlePrint}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LANDSCAPE CERTIFICATE CONTAINER */}
        <div className="overflow-x-auto overflow-y-hidden flex justify-center items-center py-1">
          <div
            ref={certRef}
            className="w-[900px] h-[580px] bg-[#FAFBFD] border-[10px] border-double border-[#001E3C] rounded-2xl p-8 relative overflow-hidden shadow-xl text-center flex flex-col justify-between font-serif select-none shrink-0"
            style={{ width: "900px", height: "580px" }}
          >
            {/* Background Watermark Seal */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <ShieldCheck className="w-[450px] h-[450px] text-[#001E3C]" />
            </div>

            {/* Ghana National Colors Top Bar Header */}
            <div className="relative z-10 space-y-1.5">
              <div className="flex justify-center items-center gap-1.5 mb-1.5">
                <div className="w-10 h-2 bg-[#CE1126] rounded-full" />
                <div className="w-10 h-2 bg-[#FCD116] rounded-full" />
                <div className="w-10 h-2 bg-[#006B3F] rounded-full" />
              </div>
              <span className="text-[11px] font-mono font-black tracking-[0.3em] uppercase text-[#0056D2] block font-sans">
                REPUBLIC OF GHANA • NATIONAL CHILD ONLINE PROTECTION ACADEMY
              </span>
              <h1 className="text-2xl font-extrabold text-[#001E3C] tracking-widest font-sans uppercase">
                Certificate of Accredited Achievement
              </h1>
              <p className="text-[10px] text-slate-500 font-sans tracking-widest uppercase font-semibold">
                Cybersecurity Act, 2020 (Act 1038) • National COP Framework
              </p>
            </div>

            <div className="w-28 h-0.5 bg-amber-500 mx-auto" />

            {/* Certificate Body Text */}
            <div className="space-y-3 relative z-10 font-sans my-auto">
              <p className="text-slate-600 text-xs italic">This official digital credential certifies that</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#001E3C] uppercase">
                {nameToDisplay}
              </h2>
              <p className="text-slate-600 text-xs max-w-xl mx-auto leading-relaxed">
                has successfully completed all required modules, practical threat simulations, and passed the official examination for
              </p>
              <div className="inline-block bg-blue-50/90 border border-blue-200 px-6 py-2 rounded-xl">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#0056D2]">
                  {titleToDisplay}
                </h3>
              </div>
            </div>

            {/* Certificate Footer Signature & Verification */}
            <div className="grid grid-cols-3 gap-4 items-end border-t border-slate-200/90 pt-4 relative z-10 text-left font-sans">
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Date Issued</span>
                <span className="text-xs font-bold text-slate-800 font-mono">{issueDate}</span>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white mx-auto shadow-md border-2 border-white">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase text-amber-700 tracking-widest block mt-1">VERIFIED SEAL</span>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Certificate Ref</span>
                <span className="text-xs font-mono font-bold text-[#0056D2]">{referenceCode}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
