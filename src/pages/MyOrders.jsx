import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getStoredWalletBalance, getWalletBalance } from "../services/auth";

function MyOrders() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");

    const [orders, setOrders] = useState([]);
    const [walletBalance, setWalletBalance] = useState(getStoredWalletBalance());

    // OTP Verification Modal states
    const [releasingOrder, setReleasingOrder] = useState(null);
    const [mobileOtp, setMobileOtp] = useState("");
    const [mobileOtpError, setMobileOtpError] = useState("");
    const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

    useEffect(() => {
        fetchOrders();

        if (userId) {
            getWalletBalance(userId).then(setWalletBalance);
        }

        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get("/pdf/userOrders", {
                params: { userId }
            });

            setOrders(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleKeypadPress = (val) => {
        setMobileOtpError("");
        if (mobileOtp.length < 4) {
            setMobileOtp(prev => prev + val);
        }
    };

    const handleKeypadBackspace = () => {
        setMobileOtpError("");
        setMobileOtp(prev => prev.slice(0, -1));
    };

    const handleKeypadClear = () => {
        setMobileOtpError("");
        setMobileOtp("");
    };

    const handleReleaseVerify = async () => {
        if (mobileOtp.length !== 4) {
            setMobileOtpError("OTP must be exactly 4 digits.");
            return;
        }
        setIsSubmittingOtp(true);
        try {
            await api.post("/pdf/releasePrint", null, {
                params: { orderId: releasingOrder.orderId, otp: mobileOtp }
            });
            setReleasingOrder(null);
            fetchOrders();
        } catch (err) {
            setMobileOtpError(err.response?.data?.message || "Invalid OTP code. Please check the TV display screen.");
        } finally {
            setIsSubmittingOtp(false);
        }
    };

    const statusClass = (status) => {
        if (status === "CANCELLED") {
            return "status-pill status-unpaid";
        }

        if (status === "CANCEL_WINDOW" || status === "QUEUE") {
            return "status-pill status-created";
        }

        if (status === "COMPLETED") {
            return "status-pill status-completed";
        }

        if (status === "PRINTING") {
            return "status-pill status-printing";
        }

        if (status === "PENDING_SCAN") {
            return "status-pill !bg-sky-500 !text-white !border-sky-600 font-bold";
        }

        return "status-pill status-created";
    };

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="My Orders"
                    subtitle="Order History"
                    badge={`Wallet Rs. ${walletBalance}`}
                    actions={[
                        { label: "New Print", path: "/dashboard" },
                        { label: "Back", path: "/dashboard", className: "btn secondary" }
                    ]}
                />

                <motion.section
                    className="panel overflow-x-auto"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                >
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Pages</th>
                                <th>Copies</th>
                                <th>Price</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders.map((order, index) => (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <td className="font-black">{order.orderId}</td>
                                    <td className="font-bold">
                                        {order.customerName || "Customer"}
                                    </td>
                                    <td>{order.blockLocation || "C Block"}</td>
                                    <td>{order.selectedPages}</td>
                                    <td>{order.copies}</td>
                                    <td className="font-black">Rs. {order.price}</td>
                                    <td className="flex items-center gap-2">
                                        <span className={statusClass(order.status)}>
                                            {order.status === "PENDING_SCAN" ? "PENDING SCAN" : order.status}
                                        </span>
                                        {order.status === "PENDING_SCAN" && (
                                            <button
                                                onClick={() => {
                                                    setReleasingOrder(order);
                                                    setMobileOtp("");
                                                    setMobileOtpError("");
                                                }}
                                                className="bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black px-3 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1 shadow"
                                            >
                                                Release 🔑
                                            </button>
                                        )}
                                        {(order.status === "PRINTING" || order.status === "QUEUE") && (
                                            <div className="flex items-center justify-center text-sky-500">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}

                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📄</div>
                                            <p>No orders yet</p>
                                            <button
                                                onClick={() => navigate("/dashboard")}
                                                className="btn mt-4"
                                            >
                                                Start Printing
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </motion.section>
            </div>

            {/* Mobile OTP Keypad Modal */}
            <AnimatePresence>
                {releasingOrder && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl"
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                        >
                            <p className="text-xs font-black uppercase tracking-widest text-sky-400">
                                Verify Kiosk OTP
                            </p>
                            <h3 className="mt-2 text-xl font-black text-white">
                                {releasingOrder.orderId}
                            </h3>
                            <p className="text-sm font-semibold text-slate-400 mt-1">
                                Enter the 4-digit OTP shown next to your order on the printer display panel.
                            </p>

                            {/* OTP Display Field */}
                            <div className="my-6 flex justify-center gap-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-12 h-14 rounded-xl border flex items-center justify-center text-2xl font-black transition-all duration-150 ${
                                            mobileOtp[i] 
                                                ? "border-sky-500 bg-sky-500/10 text-sky-400" 
                                                : "border-slate-700 bg-slate-800 text-slate-500"
                                        }`}
                                    >
                                        {mobileOtp[i] || "•"}
                                    </div>
                                ))}
                            </div>

                            {mobileOtpError && (
                                <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">
                                    ⚠️ {mobileOtpError}
                                </p>
                            )}

                            {/* Keypad Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button 
                                        key={num}
                                        onClick={() => handleKeypadPress(String(num))}
                                        className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white transition-all cursor-pointer"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button 
                                    onClick={handleKeypadClear}
                                    className="h-12 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-xs font-black text-rose-400 transition-all cursor-pointer"
                                >
                                    Clear
                                </button>
                                <button 
                                    onClick={() => handleKeypadPress("0")}
                                    className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white transition-all cursor-pointer"
                                >
                                    0
                                </button>
                                <button 
                                    onClick={handleKeypadBackspace}
                                    className="h-12 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-md font-bold text-white transition-all cursor-pointer flex items-center justify-center"
                                >
                                    ⌫
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setReleasingOrder(null)}
                                    className="h-11 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReleaseVerify}
                                    disabled={isSubmittingOtp}
                                    className="h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-black text-white transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingOtp ? "Releasing..." : "Verify & Print"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default MyOrders;
