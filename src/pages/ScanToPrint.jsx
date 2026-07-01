import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import CustomModal from "../components/CustomModal";
import { getStoredWalletBalance, getWalletBalance } from "../services/auth";

function ScanToPrint() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const blockLocation = searchParams.get("block") || "Library";
    const userId = localStorage.getItem("userId");

    const [orders, setOrders] = useState([]);
    const [printer, setPrinter] = useState(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [releasing, setReleasing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(getStoredWalletBalance());

    // Custom Modal config
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const showAlert = (title, message, type = "info", onConfirm = null) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm
        });
    };

    useEffect(() => {
        if (!userId) {
            // Save this path to localStorage so we can redirect back here after login
            localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
            navigate("/");
            return;
        }

        getWalletBalance(userId).then(setWalletBalance);
        fetchData();
    }, [userId, blockLocation]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch printer config
            const printerRes = await api.get("/printer/byBlock", {
                params: { blockLocation }
            });
            setPrinter(printerRes.data);

            // Fetch pending scan orders
            const ordersRes = await api.get("/pdf/pendingScan", {
                params: { userId, blockLocation }
            });
            const pendingOrders = ordersRes.data || [];
            setOrders(pendingOrders);
            // Default to selecting all orders
            setSelectedOrderIds(pendingOrders.map(o => o.orderId));
        } catch (error) {
            console.error("Failed to load scanner details:", error);
            showAlert("Connection Error", "Unable to contact the backend service.", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectOrder = (orderId) => {
        if (selectedOrderIds.includes(orderId)) {
            setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
        } else {
            setSelectedOrderIds(prev => [...prev, orderId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedOrderIds.length === orders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(orders.map(o => o.orderId));
        }
    };

    const releaseSelectedOrders = async () => {
        if (selectedOrderIds.length === 0) {
            showAlert("No Selection", "Please select at least one document to print.", "warning");
            return;
        }

        if (printer && printer.maintenance) {
            showAlert("Printer Offline", "This printer is currently under maintenance. You can cancel your orders to refund your wallet, or print at another location.", "error");
            return;
        }

        setReleasing(true);
        let successCount = 0;
        let failCount = 0;

        for (const orderId of selectedOrderIds) {
            try {
                await api.post("/pdf/releasePrint", null, {
                    params: { orderId }
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to release print for ${orderId}:`, err);
                failCount++;
            }
        }

        setReleasing(false);
        if (failCount === 0) {
            showAlert(
                "Printing Started! 🖨️",
                `Successfully released ${successCount} print jobs. Please collect your pages from the printer tray.`,
                "success",
                () => {
                    navigate("/dashboard");
                }
            );
        } else {
            showAlert(
                "Partial Release",
                `Released ${successCount} files successfully. ${failCount} files failed.`,
                "warning",
                () => {
                    fetchData();
                }
            );
        }
    };

    const cancelOrder = async (orderId) => {
        showAlert(
            "Cancel Order?",
            "Are you sure you want to cancel this print order? The amount will be instantly refunded to your wallet.",
            "confirm",
            async () => {
                try {
                    await api.post("/pdf/cancelOrder", null, {
                        params: { orderId, userId }
                    });
                    showAlert("Cancelled Successfully", "Order cancelled and wallet balance refunded.", "success");
                    fetchData();
                } catch (err) {
                    console.error("Cancellation error:", err);
                    showAlert("Error", "Unable to cancel this order.", "error");
                }
            }
        );
    };

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="Scan to Print"
                    subtitle={`${blockLocation} Location`}
                    actions={[
                        {
                            label: "Dashboard",
                            path: "/dashboard"
                        },
                        {
                            label: "My Orders",
                            path: "/my-orders"
                        }
                    ]}
                />

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4" />
                        <p className="font-bold">Locating printer queue, please wait...</p>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                        {/* Printer Status Section */}
                        <div className="md:col-span-1 space-y-6">
                            <motion.div
                                className="panel p-6"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <p className="eyebrow">Printer Status</p>
                                <h2 className="text-xl font-black text-slate-900 mt-1">
                                    {printer?.printerName || "Printer Offline"}
                                </h2>

                                <div className="mt-4 space-y-3 font-semibold text-sm">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Connection:</span>
                                        <span className={printer?.active ? "text-emerald-600" : "text-rose-600"}>
                                            {printer?.active ? "Online ●" : "Offline"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Operational Mode:</span>
                                        <span className={printer?.maintenance ? "text-amber-600" : "text-sky-600"}>
                                            {printer?.maintenance ? "Maintenance 🛠️" : "Ready for Jobs 🔐"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                        <span className="text-slate-500">Paper Level:</span>
                                        <span className="text-slate-800">
                                            {printer?.paperCount != null ? `${printer.paperCount} sheets` : "Unknown"}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="panel p-6 bg-slate-900 text-white"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h3 className="font-black text-lg">Verification Instructions</h3>
                                <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-300 list-disc list-inside leading-relaxed">
                                    <li>Confirm the target printer is correct.</li>
                                    <li>Select the files you want to release.</li>
                                    <li>Tap "Verify & Release Printing".</li>
                                    <li>Your physical printing will start in 5 seconds!</li>
                                </ul>
                            </motion.div>
                        </div>

                        {/* Scanned Orders List */}
                        <div className="md:col-span-2">
                            <motion.div
                                className="panel p-6 flex flex-col h-full"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <p className="eyebrow">Select Documents</p>
                                        <h2 className="text-xl font-black text-slate-900">
                                            Pending Print Queue
                                        </h2>
                                    </div>
                                    {orders.length > 0 && (
                                        <button
                                            onClick={handleSelectAll}
                                            className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 transition-colors"
                                        >
                                            {selectedOrderIds.length === orders.length ? "Deselect All" : "Select All"}
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 flex-1 space-y-3">
                                    {orders.map((order) => (
                                        <div
                                            key={order.id}
                                            className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                                                selectedOrderIds.includes(order.orderId)
                                                    ? "border-sky-200 bg-sky-50/20"
                                                    : "border-slate-200/60 bg-slate-50/30"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4.5 w-4.5 cursor-pointer"
                                                checked={selectedOrderIds.includes(order.orderId)}
                                                onChange={() => toggleSelectOrder(order.orderId)}
                                            />

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate">
                                                    📄 {order.fileName}
                                                </h4>
                                                <p className="text-xs font-semibold text-slate-500 mt-1">
                                                    ID: <span className="font-mono text-slate-700">{order.orderId}</span> ● {order.totalPages} pages ● {order.copies} copies ● <span className="font-bold">{order.printType}</span>
                                                </p>
                                            </div>

                                            <div className="text-right flex flex-col items-end gap-2">
                                                <span className="font-black text-slate-900 text-sm">
                                                    ₹{order.price}
                                                </span>
                                                <button
                                                    onClick={() => cancelOrder(order.orderId)}
                                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    Cancel & Refund
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {orders.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                                            <span className="text-4xl mb-3">📭</span>
                                            <h3 className="font-black text-slate-800 text-lg">No Pending Scans</h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm leading-relaxed">
                                                There are no print orders waiting to be released at <strong>{blockLocation}</strong>. Please upload files and complete checkouts first.
                                            </p>
                                            <button
                                                onClick={() => navigate("/dashboard")}
                                                className="btn mt-5 px-6 py-2 text-xs font-bold shadow-lg"
                                            >
                                                Go to Dashboard
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {orders.length > 0 && (
                                    <div className="mt-6 border-t border-slate-100 pt-6">
                                        <button
                                            onClick={releaseSelectedOrders}
                                            disabled={releasing}
                                            className="btn w-full py-3.5 text-sm font-black tracking-wide shadow-xl flex items-center justify-center gap-2"
                                        >
                                            {releasing ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                    Releasing Print Jobs...
                                                </>
                                            ) : (
                                                <>
                                                    🖨️ Verify & Release Printing ({selectedOrderIds.length} file{selectedOrderIds.length > 1 ? "s" : ""})
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification and confirm dialogs */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </main>
    );
}

export default ScanToPrint;
