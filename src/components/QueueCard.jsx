import { motion } from "framer-motion";

function QueueCard({ order, index = 0, position = 2 }) {
    const isPendingScan = order.status === "PENDING_SCAN";

    // Calculate total sheets to print
    const sheetsCount = (() => {
        let pageCount = order.totalPages || 0;
        if (order.selectedPages && order.selectedPages !== "ALL") {
            let count = 0;
            const parts = order.selectedPages.split(",");
            for (const part of parts) {
                const pagePart = part.trim();
                if (!pagePart) continue;
                if (pagePart.includes("-")) {
                    const range = pagePart.split("-").map(Number);
                    if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
                        count += Math.max(0, range[1] - range[0] + 1);
                    } else {
                        count += 1;
                    }
                } else {
                    if (!isNaN(Number(pagePart))) {
                        count += 1;
                    }
                }
            }
            pageCount = count > 0 ? count : 1;
        }
        return pageCount * (order.copies || 1);
    })();

    return (
        <motion.div
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-lg relative overflow-hidden pt-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
            <span className="absolute left-4 top-2 text-[10px] font-black uppercase text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 shadow-sm select-none z-10">
                Position #{position}
            </span>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start z-10 mt-1">
                <div>
                    <p className="text-sm font-bold tracking-widest text-white/50 uppercase">Order</p>
                    <p className="text-3xl font-black text-white leading-none mt-1">
                        {order.orderId}
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-sm font-bold tracking-widest text-white/50 uppercase">Customer</p>
                    <p className="text-xl font-bold text-sky-200 mt-1 truncate max-w-[120px]">
                        {order.customerName || "Customer"}
                    </p>
                </div>
            </div>

            <div className="mt-1 flex flex-col gap-1.5 z-10">
                <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300">
                    <span>📄 Selected Pages</span>
                    <span className="text-white font-black">{order.selectedPages === 'ALL' ? `${order.totalPages} pages` : order.selectedPages}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300">
                    <span>🖨️ Total Sheets</span>
                    <span className="text-emerald-400 font-black">{sheetsCount} sheets</span>
                </div>
            </div>

            <div className="mt-2 z-10 flex items-center justify-center border-t border-white/10 pt-3">
                {isPendingScan ? (
                    <div className="text-center w-full bg-sky-500/20 border border-sky-400/30 rounded-xl py-2">
                        <span className="block text-[10px] font-black uppercase text-sky-300 tracking-widest mb-1">Enter OTP to Print</span>
                        <span className="text-2xl font-mono font-black text-sky-100 tracking-[0.2em]">{order.otpCode}</span>
                    </div>
                ) : (
                    <div className="text-center w-full bg-amber-500/20 border border-amber-400/30 rounded-xl py-2">
                        <span className="text-lg font-black text-amber-200 uppercase tracking-widest">
                            {order.status === "CANCEL_WINDOW" ? "Confirming" : "Waiting"}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default QueueCard;
