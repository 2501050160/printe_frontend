import { motion } from "framer-motion";

function OrderCard({ order, variant = "default" }) {
    const isDark = variant === "dark";

    return (
        <motion.div
            className={
                isDark
                    ? "rounded-lg border border-white/15 bg-white/10 p-6 backdrop-blur"
                    : "rounded-lg border border-slate-200 bg-slate-50 p-4"
            }
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <p
                className={
                    isDark
                        ? "text-sm font-black uppercase tracking-[0.2em] text-cyan-200"
                        : "text-xs font-black uppercase tracking-widest text-slate-500"
                }
            >
                {order.status || "Order"}
            </p>

            <h3
                className={
                    isDark
                        ? "mt-3 text-4xl font-black md:text-5xl"
                        : "mt-2 text-2xl font-black text-slate-900"
                }
            >
                {order.orderId}
            </h3>

            <p
                className={
                    isDark
                        ? "mt-2 text-2xl font-black text-cyan-100"
                        : "mt-1 font-bold text-slate-700"
                }
            >
                {order.customerName || "Customer"}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className={isDark ? "rounded-lg bg-white/10 p-3" : "rounded-lg bg-white p-3"}>
                    <p className="text-xs font-bold text-slate-400">Location</p>
                    <p className="font-black">{order.blockLocation || "C Block"}</p>
                </div>

                <div className={isDark ? "rounded-lg bg-white/10 p-3" : "rounded-lg bg-white p-3"}>
                    <p className="text-xs font-bold text-slate-400">Pages</p>
                    <p className="font-black">{order.selectedPages}</p>
                </div>

                <div className={isDark ? "rounded-lg bg-white/10 p-3" : "rounded-lg bg-white p-3"}>
                    <p className="text-xs font-bold text-slate-400">Copies</p>
                    <p className="font-black">{order.copies}</p>
                </div>
            </div>
        </motion.div>
    );
}

export default OrderCard;
