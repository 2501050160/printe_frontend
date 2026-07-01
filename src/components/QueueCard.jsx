import { motion } from "framer-motion";

function QueueCard({ order, index = 0 }) {
    const isPendingScan = order.status === "PENDING_SCAN";

    return (
        <motion.div
            className="flex items-center justify-between gap-4 rounded-lg bg-white/10 p-4"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <div>
                <p className="text-2xl font-black">
                    {order.orderId}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-300">
                    {order.customerName || "Customer"}
                </p>
            </div>

            {isPendingScan ? (
                <span className="rounded-full bg-sky-500 px-4 py-2 font-black text-white shadow-md border border-sky-400/30 text-lg font-mono">
                    OTP: {order.otpCode}
                </span>
            ) : (
                <span className="rounded-full bg-amber-200 px-4 py-2 font-black text-amber-950">
                    {order.status === "CANCEL_WINDOW" ? "Confirming" : "Waiting"}
                </span>
            )}
        </motion.div>
    );
}

export default QueueCard;
