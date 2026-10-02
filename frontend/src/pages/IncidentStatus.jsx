import { useState } from "react";
import api from "../utils/api";

export default function IncidentStatus() {
  const [refCode, setRefCode] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setReport(null);
    try {
      const { data } = await api.get(`/incidents/status/${refCode.trim()}`);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.error || "No report found with that reference code.");
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold mb-2">Check report status</h1>
      <p className="text-mist mb-8">Enter the reference code you received when you submitted your report.</p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={refCode}
          onChange={(e) => setRefCode(e.target.value)}
          placeholder="CG-XXXX-XXXX"
          className="flex-1 border border-line rounded-md px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-guard"
        />
        <button type="submit" className="bg-guard text-white font-semibold px-5 rounded-md hover:bg-guardLight">
          Check
        </button>
      </form>

      {error && <p className="text-alert text-sm mt-4">{error}</p>}

      {report && (
        <div className="mt-6 border border-line rounded-lg p-5 bg-paper">
          <p className="text-xs font-mono text-mist">{report.refCode}</p>
          <p className="mt-2"><span className="font-semibold">Category:</span> {report.category}</p>
          <p><span className="font-semibold">Status:</span> {report.status.replace("_", " ")}</p>
          <p className="text-xs text-mist mt-2">Submitted {new Date(report.createdAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}

