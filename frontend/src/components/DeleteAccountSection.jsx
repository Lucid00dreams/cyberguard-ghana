import { useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { deleteLocalKeys } from "../utils/e2eeCrypto";

export default function DeleteAccountSection({ compact = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const titleId = useId();

  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isConfirmed = confirmText.trim().toUpperCase() === "DELETE";

  function openDeleteModal() {
    setConfirmText("");
    setError("");
    dialogRef.current?.showModal();
  }

  function closeDeleteModal() {
    if (deleting) return;
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setConfirmText("");
    setError("");
  }

  function handleBackdropPointerUp(e) {
    if (deleting || !dialogRef.current) return;
    const rect = dialogRef.current.getBoundingClientRect();
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (clickedOutside) {
      dialogRef.current.close();
    }
  }

  async function handleConfirmDelete(e) {
    e.preventDefault();
    if (!isConfirmed || deleting) return;

    setDeleting(true);
    setError("");

    try {
      const deletedUserId = user?.id;
      await api.delete("/auth/me");
      dialogRef.current?.close();
      logout();
      if (deletedUserId) {
        deleteLocalKeys(deletedUserId).catch(() => {});
      }
      navigate("/login", {
        replace: true,
        state: { accountDeleted: true },
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to delete your account right now. Please try again."
      );
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className={`bg-white border border-rose-200/90 shadow-xs ${
          compact ? "rounded-xl p-6 max-w-xl" : "rounded-2xl p-6"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-rose-700">
              <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                Delete Account
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Permanently erase your CyberGuard Ghana profile, course progress, earned certificates, mentorship bookings, and encrypted chat keys. Once deleted, your account cannot be recovered.
            </p>
          </div>

          <button
            type="button"
            onClick={openDeleteModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={handleDialogClose}
        onPointerUp={handleBackdropPointerUp}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 id={titleId} className="text-base font-extrabold text-slate-900">
                  Permanently delete account?
                </h2>
                <p className="text-xs text-slate-500 font-mono truncate max-w-[240px]">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={deleting}
              aria-label="Close confirmation dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-xl bg-rose-50/70 border border-rose-200/80 p-3.5 space-y-1.5 text-xs text-rose-950">
            <p className="font-bold">This action is immediate and irreversible:</p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-900/90 leading-relaxed">
              <li>Removes your profile, enrollments, quiz records, and certificates</li>
              <li>Cancels scheduled 1-on-1 mentorship bookings</li>
              <li>Unsubscribes your email from 7:00 AM daily safety tips</li>
              <li>Wipes your CyberChat end-to-end encryption keys on this device</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleConfirmDelete} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Type <span className="font-mono font-bold text-rose-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                autoComplete="off"
                disabled={deleting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-600 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                autoFocus
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Keep My Account
              </button>

              <button
                type="submit"
                disabled={!isConfirmed || deleting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
