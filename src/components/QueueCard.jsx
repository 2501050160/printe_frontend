import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function QueueCard({ order, index = 0 }) {
    const isPendingScan = order.status === "PENDING_SCAN";

    const calculateTimeLeft = () => {
        if (!order.cancelWindowEndsAt) return 600;
        const expireTime = new Date(order.cancelWindowEndsAt).getTime() + 10 * 60 * 1000;
        return Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (!isPendingScan) return;

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (left <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [order.cancelWindowEndsAt, isPendingScan]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
        <motion.div
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-lg relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start z-10">
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

            <div className="mt-2 z-10 flex items-center justify-center border-t border-white/10 pt-4">
                {isPendingScan ? (
                    <div className="text-center w-full bg-sky-500/20 border border-sky-400/30 rounded-xl py-2">
                        <span className="block text-[10px] font-black uppercase text-sky-300 tracking-widest mb-1">Enter OTP to Print</span>
                        <span className="text-2xl font-mono font-black text-sky-100 tracking-[0.2em]">{order.otpCode}</span>
                        <span className="block text-[11px] font-bold text-sky-300 mt-1">
                            Expires in {formatTime(timeLeft)}
                        </span>
                    </div>
                ) : (
                    <div className="text-center w-full bg-amber-500/20 border border-amber-400/30 rounded-xl py-3">
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
