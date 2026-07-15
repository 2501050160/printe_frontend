import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";
import mapPin from "../assets/map_pin.mp4";
import CustomModal from "../components/CustomModal";
import { User, LogOut, Sparkles } from "lucide-react";

const defaultIcons = ["🏛️", "⚡", "📘", "🏛️", "⚡", "📘"];
const defaultAccents = ["#0891b2", "#059669", "#7c3aed", "#e11d48", "#ea580c", "#db2777"];

// Framer motion animation configs
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 14
    }
  }
};

function BlockSelection() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem("userId");

    // Direct OTP Release State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [inputOtp, setInputOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [releasing, setReleasing] = useState(false);
    const [otpTimeLeft, setOtpTimeLeft] = useState(0);

    const parseBackendDate = (dateVal) => {
        if (!dateVal) return null;
        if (Array.isArray(dateVal)) {
            const [y, m, d, hr, min, sec] = dateVal;
            return new Date(Date.UTC(y, m - 1, d, hr || 0, min || 0, sec || 0));
        }
        if (typeof dateVal === "string") {
            const cleanStr = dateVal.replace(" ", "T");
            const hasOffset = /([+-]\d{2}:?\d{2}|Z)$/.test(cleanStr);
            const isoStr = hasOffset ? cleanStr : cleanStr + "Z";
            return new Date(isoStr);
        }
        return new Date(dateVal);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    useEffect(() => {
        if (!showOtpModal || !selectedOrderId) return;
        
        const selectedOrder = pendingOrders.find(o => o.orderId === selectedOrderId);
        if (!selectedOrder) return;

        const updateTimer = () => {
            if (!selectedOrder.cancelWindowEndsAt) {
                setOtpTimeLeft(600);
                return;
            }
            const dateObj = parseBackendDate(selectedOrder.cancelWindowEndsAt);
            if (!dateObj || isNaN(dateObj.getTime())) {
                setOtpTimeLeft(600);
                return;
            }
            const expireTime = dateObj.getTime() + 10 * 60 * 1000;
            const left = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
            setOtpTimeLeft(left);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [showOtpModal, selectedOrderId, pendingOrders]);

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
            navigate("/");
        }
    }, [userId, navigate]);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const response = await api.get("/blocks/all");
                const mapped = response.data.map((b, idx) => ({
                    name: b.name,
                    description: `${b.name} print counter`,
                    icon: defaultIcons[idx % defaultIcons.length],
                    accent: defaultAccents[idx % defaultAccents.length]
                }));
                setBlocks(mapped);
            } catch (err) {
                console.error("Failed to load blocks", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBlocks();
    }, []);

    // Auto-open OTP modal when redirected from checkout with orderId
    useEffect(() => {
        const redirectOrderId = searchParams.get("orderId");
        const redirectOtp = searchParams.get("otp");
        const redirectFileName = searchParams.get("fileName");
        const redirectBlock = searchParams.get("block");

        if (redirectOrderId && userId) {
            setSearchParams({}, { replace: true });
            
            (async () => {
                const blockLoc = redirectBlock ? decodeURIComponent(redirectBlock) : "";
                let otpBypassed = false;

                if (blockLoc) {
                    try {
                        const printerRes = await api.get("/printer/byBlock", { params: { blockLocation: blockLoc } });
                        const printerConfig = printerRes.data;
                        if (printerConfig && printerConfig.otpEnabled === false) {
                            otpBypassed = true;
                        }
                    } catch (err) {
                        console.error("Failed to check printer config:", err);
                    }
                }

                if (otpBypassed) {
                    showAlert("Direct Printing Released! 🚀", `OTP is bypassed for ${blockLoc}. Your document has been sent directly to the printer spooler!`, "success");
                    navigate("/my-orders");
                } else {
                    setOtpError("");
                    
                    if (redirectOtp) {
                        setPendingOrders([
                            {
                                orderId: redirectOrderId,
                                otpCode: redirectOtp,
                                fileName: redirectFileName ? decodeURIComponent(redirectFileName) : "document.pdf",
                                status: "PENDING_SCAN"
                            }
                        ]);
                        setSelectedOrderId(redirectOrderId);
                        setFetchingOrders(false);
                    } else {
                        setFetchingOrders(true);
                        try {
                            const res = await api.get("/pdf/userOrders", { params: { userId } });
                            const pending = (res.data || []).filter(
                                o => o.status === "PENDING_SCAN" || o.status === "CANCEL_WINDOW"
                            );
                            setPendingOrders(pending);
                            const match = pending.find(o => o.orderId === redirectOrderId);
                            setSelectedOrderId(match ? match.orderId : (pending.length > 0 ? pending[0].orderId : ""));
                        } catch (err) {
                            setOtpError("Failed to fetch your pending orders.");
                        } finally {
                            setFetchingOrders(false);
                        }
                    }
                }
            })();
        }
    }, [userId, searchParams, setSearchParams]);

    const logout = () => {
        clearUserSession();
        navigate("/");
    };

    const selectBlock = (blockName) => {
        localStorage.setItem("selectedBlock", blockName);
        navigate("/dashboard");
    };

    const handleOpenOtpModal = async () => {
        if (!userId) {
            showAlert("Not Logged In", "Please log in to release your prints.", "warning");
            return;
        }
        setShowOtpModal(true);
        setFetchingOrders(true);
        setOtpError("");
        try {
            const res = await api.get("/pdf/userOrders", { params: { userId } });
            const pending = (res.data || []).filter(o => o.status === "PENDING_SCAN" || o.status === "CANCEL_WINDOW");
            setPendingOrders(pending);
            if (pending.length > 0) {
                setSelectedOrderId(pending[0].orderId);
            } else {
                setSelectedOrderId("");
            }
        } catch (err) {
            setOtpError("Failed to fetch your pending orders.");
        } finally {
            setFetchingOrders(false);
        }
    };

    const handleDirectRelease = async () => {
        if (!selectedOrderId || inputOtp.length !== 4) {
            setOtpError("Please select an order and enter the 4-digit OTP.");
            return;
        }
        setReleasing(true);
        try {
            await api.post("/pdf/releasePrint", null, {
                params: { orderId: selectedOrderId, otp: inputOtp.trim() }
            });
            setOtpError("");
            setShowOtpModal(false);
            setInputOtp("");
            showAlert("Printing Started! 🖨️", "Successfully released your print job. Please collect your pages from the printer tray.", "success");
        } catch (err) {
            setOtpError(err.response?.data?.message || "Invalid OTP or Order.");
        } finally {
            setReleasing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-50 py-10 px-4 md:px-12 relative overflow-hidden font-sans">
            {/* Elegant blurred ambient backgrounds */}
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-300/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-sky-200/20 rounded-full blur-[120px] pointer-events-none" />
            
            {/* Dotted mesh grid decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            <PopupManager page="LOCATION_SELECTION" />
            
            <motion.div 
                className="max-w-6xl mx-auto relative z-10 space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Full-width Premium Header Card */}
                <motion.div 
                    variants={itemVariants}
                    className="p-6 md:p-8 bg-white/70 backdrop-blur-xl border border-blue-100/60 rounded-[24px] shadow-lg shadow-slate-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                    <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/50">
                            <Sparkles className="w-3.5 h-3.5" /> STEP 1 • PICKUP POINT
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            Choose Print Location
                        </h1>
                        <p className="text-sm font-semibold text-slate-500 max-w-xl">
                            Select the printer where you want to collect your documents. Orders are routed automatically.
                        </p>
                    </div>

                    {/* User Profile Container */}
                    <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200/60 p-2 pr-4 rounded-full">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Session</div>
                            <button onClick={logout} className="text-xs font-extrabold text-rose-500 hover:text-rose-600 flex items-center gap-1 mt-0.5 transition-colors">
                                <LogOut className="w-3.5 h-3.5" /> Sign Out
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Campus Map Visual Hero */}
                <motion.div 
                    variants={itemVariants}
                    className="overflow-hidden rounded-[24px] border border-blue-100/50 bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-100/60"
                >
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-[300px] object-cover z-0"
                    >
                        <source src={mapPin} type="video/mp4" />
                    </video>
                    <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between gap-4 border-t border-slate-800">
                        <div>
                            <h4 className="font-extrabold text-sm tracking-tight">Autonomous Print Counters</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Campus block smart printers updated in real-time.</p>
                        </div>
                        <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                            Live map
                        </span>
                    </div>
                </motion.div>

                {/* Bottom Section Layout */}
                {loading ? (
                    <div className="text-center text-slate-500 font-bold py-16 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                        Loading print counters...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-stretch">
                        
                        {/* LEFT COLUMN: Large OTP Card (30% equivalent / 3 cols) */}
                        <motion.div 
                            variants={itemVariants}
                            className="lg:col-span-3 flex"
                        >
                            <motion.button
                                type="button"
                                className="w-full relative overflow-hidden text-left border border-amber-200/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white p-8 rounded-[24px] shadow-lg shadow-amber-500/5 flex flex-col justify-between items-start min-h-[360px] lg:min-h-full transition-all"
                                onClick={handleOpenOtpModal}
                                whileHover={{ 
                                  y: -8, 
                                  scale: 1.02, 
                                  borderColor: "#f59e0b",
                                  boxShadow: "0 25px 40px -15px rgba(245, 158, 11, 0.15)"
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div>
                                    <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-amber-100 text-2xl shadow-inner">
                                        🔑
                                    </span>
                                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-6">
                                        Already Have an OTP?
                                    </h3>
                                    <p className="text-sm font-semibold text-slate-500 mt-2 leading-relaxed">
                                        Release your existing print instantly.
                                    </p>
                                </div>
                                
                                <span className="w-full mt-8 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm text-center transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10">
                                    Enter OTP →
                                </span>
                            </motion.button>
                        </motion.div>

                        {/* RIGHT COLUMN: Printer locations 2x2 grid (70% equivalent / 7 cols) */}
                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                            {blocks.map((block, index) => (
                                <motion.div 
                                    key={block.name}
                                    variants={itemVariants}
                                    className="flex"
                                >
                                    <motion.button
                                        type="button"
                                        className="w-full relative overflow-hidden text-left border border-blue-100/50 bg-white/70 backdrop-blur-xl p-8 rounded-[20px] shadow-lg shadow-slate-100/40 flex flex-col justify-between items-start min-h-[220px] transition-all"
                                        onClick={() => selectBlock(block.name)}
                                        whileHover={{ 
                                          y: -8, 
                                          scale: 1.02, 
                                          borderColor: block.accent,
                                          boxShadow: `0 25px 40px -15px ${block.accent}20`
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <span 
                                                className="inline-grid place-items-center w-14 h-14 rounded-full text-2xl shrink-0 shadow-inner"
                                                style={{ backgroundColor: `${block.accent}12` }}
                                            >
                                                {block.icon}
                                            </span>
                                            <div>
                                                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{block.name}</h3>
                                                <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">{block.description}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full mt-6 flex justify-end">
                                            <span 
                                                className="text-xs font-extrabold tracking-wider uppercase flex items-center gap-1 hover:underline"
                                                style={{ color: block.accent }}
                                            >
                                                Select Location →
                                            </span>
                                        </div>
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>

                    </div>
                )}
            </motion.div>

            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />

            <AnimatePresence>
                {showOtpModal && (
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
                                Direct Print Release
                            </p>
                            <h3 className="mt-2 text-xl font-black text-white">
                                Enter Order & OTP
                            </h3>
                            
                            <div className="mt-6 space-y-4">
                                {fetchingOrders ? (
                                    <p className="text-slate-400 text-sm py-3 font-semibold">Loading your pending orders...</p>
                                ) : pendingOrders.length === 0 ? (
                                    <p className="text-rose-400 text-sm font-semibold bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">
                                        You have no pending prints to release.
                                    </p>
                                ) : (
                                    <select
                                        value={selectedOrderId}
                                        onChange={(e) => {
                                            setOtpError("");
                                            setSelectedOrderId(e.target.value);
                                        }}
                                        className="w-full h-12 rounded-xl bg-slate-800 border border-slate-700 text-center text-sm font-bold text-white focus:border-sky-500 focus:outline-none appearance-none px-4"
                                    >
                                        {pendingOrders.map(order => (
                                            <option key={order.orderId} value={order.orderId}>
                                                {order.orderId} - {order.fileName}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {selectedOrderId && pendingOrders.find(o => o.orderId === selectedOrderId) && (
                                    <div className="text-center text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 py-2 rounded-xl mt-2">
                                        ⏱️ OTP Expires in: <span className="font-mono text-sm font-black">{formatTime(otpTimeLeft)}</span>
                                    </div>
                                )}

                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="4-Digit OTP"
                                    value={inputOtp}
                                    onChange={(e) => {
                                        setOtpError("");
                                        setInputOtp(e.target.value);
                                    }}
                                    className="w-full h-12 rounded-xl bg-slate-800 border border-slate-700 text-center text-lg font-bold text-white placeholder-slate-500 tracking-[0.5em] focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            {otpError && (
                                <p className="text-xs font-bold text-rose-500 mt-4 bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">
                                    ⚠️ {otpError}
                                </p>
                            )}

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setShowOtpModal(false);
                                        setOtpError("");
                                        setInputOtp("");
                                    }}
                                    className="h-11 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDirectRelease}
                                    disabled={releasing || pendingOrders.length === 0}
                                    className="h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-black text-white transition-colors disabled:opacity-50"
                                >
                                    {releasing ? "Releasing..." : "Verify & Print"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default BlockSelection;
