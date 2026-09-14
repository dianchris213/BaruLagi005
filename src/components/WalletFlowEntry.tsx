import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { parseAmount, type WalletBase } from "@/lib/reset";

type Props = {
  wallets: readonly WalletBase[];
  disabled?: boolean;
  onRecord: (walletId: string, kind: "in" | "out", amount: number) => void;
};

/** Compact, validated cash-flow entry. Every accepted entry updates state
 *  immediately, which is what drives the live AI insight refresh. */
export function WalletFlowEntry({ wallets, disabled = false, onRecord }: Props) {
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [kind, setKind] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = wallets.find((w) => w.id === walletId);
    if (!target) {
      setError("Pilih dompet terlebih dahulu.");
      return;
    }
    const parsed = parseAmount(amount);
    if (!parsed.ok) {
      setError(parsed.error);
      setNote("");
      return;
    }
    onRecord(target.id, kind, parsed.value);
    setError("");
    setAmount("");
    setNote(
      `${kind === "in" ? "Pemasukan" : "Pengeluaran"} Rp ${parsed.value.toLocaleString("id-ID")} dicatat ke ${target.name}.`,
    );
  };

  return (
    <form onSubmit={submit} noValidate className="mt-3 border-t border-slate-100 pt-3">
      <fieldset disabled={disabled} className="disabled:opacity-60">
        <legend className="text-xs font-semibold text-slate-800">Catat arus kas</legend>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="flow-wallet" className="text-[11px] font-medium text-slate-500">
              Dompet
            </label>
            <select
              id="flow-wallet"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-800"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="flow-amount" className="text-[11px] font-medium text-slate-500">
              Jumlah (Rp)
            </label>
            <input
              id="flow-amount"
              inputMode="numeric"
              autoComplete="off"
              maxLength={13}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "flow-error" : undefined}
              placeholder="50.000"
              className={`mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ${
                error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-800"
              }`}
            />
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Jenis arus kas"
          className="mt-2 grid grid-cols-2 gap-2"
        >
          {(["in", "out"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`flex min-h-11 items-center justify-center gap-1 rounded-xl text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 ${
                kind === k
                  ? k === "in"
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {k === "in" ? (
                <Plus className="size-3.5" aria-hidden="true" />
              ) : (
                <Minus className="size-3.5" aria-hidden="true" />
              )}
              {k === "in" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
        >
          Simpan arus kas
        </button>

        <p aria-live="polite" className="mt-1 min-h-4 text-[11px] font-semibold">
          {error ? (
            <span id="flow-error" role="alert" className="text-rose-500">
              {error}
            </span>
          ) : (
            <span className="text-emerald-600">{note}</span>
          )}
        </p>
      </fieldset>
    </form>
  );
}
