function PrinterCard({ printer, onDelete }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        {printer.blockLocation}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">
                        {printer.printerName || "Unnamed Printer"}
                    </h3>
                    <p className="mt-2 text-sm font-bold text-slate-600">
                        IP: {printer.printerIp || "Local / USB"}
                    </p>
                </div>

                <span
                    className={
                        printer.active
                            ? "status-pill status-paid"
                            : "status-pill status-unpaid"
                    }
                >
                    {printer.active ? "Active" : "Inactive"}
                </span>
            </div>

            {onDelete && (
                <button
                    onClick={() => onDelete(printer.id)}
                    className="btn danger mt-4 min-h-0 px-3 py-2 text-sm"
                >
                    Delete
                </button>
            )}
        </div>
    );
}

export default PrinterCard;
