import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";
import mapPin from "../assets/map_pin.mp4";
import CustomModal from "../components/CustomModal";
import { User, LogOut, Sparkles, MapPin, Printer, ArrowRight } from "lucide-react";

const defaultIcons = ["🏛️", "⚡", "📘", "🏛️", "⚡", "📘"];
const defaultAccents = ["#2563eb", "#10b981", "#7c3aed", "#e11d48", "#ea580c", "#db2777"];

// Page-load animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const mapVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 15 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 90, damping: 14 } 
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
        <main className="min-h-screen bg-[#f8fafc] py-12 px-6 md:px-12 relative overflow-hidden font-sans flex flex-col justify-between">
            {/* Layered radial gradient background glows (5-8% opacity) */}
            <div className="absolute top-0 left-0 w-[55rem] h-[55rem] bg-blue-500/[0.06] rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[45rem] h-[45rem] bg-purple-500/[0.05] rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-0 w-[50rem] h-[50rem] bg-cyan-400/[0.05] rounded-full blur-[150px] pointer-events-none" />
            
            {/* Very light dotted patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

            <PopupManager page="LOCATION_SELECTION" />
            
            <motion.div 
                className="w-full max-w-[1450px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10"
                variants={pageVariants}
                initial="hidden"
                animate="show"
            >
                {/* LEFT CONSOLE - Desktop Columns 1–4 (35% equivalent layout) */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-10">
                    
                    {/* Header glass card with premium glow & padding */}
                    <motion.div variants={headerVariants} className="space-y-6">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/50 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> STEP 1 • PICKUP POINT
                            </span>
                            <h1 className="text-4xl md:text-[44px] font-black text-slate-900 tracking-tight leading-[1.05]">
                                Choose Print Location
                            </h1>
                            <p className="text-[16px] font-medium text-slate-400/90 leading-relaxed">
                                Select the printer where you want to collect your documents. Orders route to that printer automatically.
                            </p>
                        </div>

                        {/* Floating Active Account Widget */}
                        <div className="p-5 bg-white/70 backdrop-blur-xl border border-white/60 rounded-[20px] shadow-[0_12px_40px_rgba(15,23,42,0.06)] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                                    <User className="w-5.5 h-5.5" />
                                </div>
                                <div className="text-left">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Session</div>
                                    <span className="text-sm font-semibold text-slate-600 mt-1 block">Secure Client Connected</span>
                                </div>
                            </div>
                            <button onClick={logout} className="h-9 px-4 rounded-full border border-rose-100 hover:border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-all hover:-translate-y-0.5">
                                <LogOut className="w-3.5 h-3.5" /> Sign Out
                            </button>
                        </div>
                    </motion.div>

                    {/* Premium OTP Release Card - Warm Glass Gradient */}
                    <motion.div 
                        variants={cardVariants}
                        className="p-8 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-200/50 rounded-[24px] shadow-[0_12px_40px_rgba(15,23,42,0.06)] flex flex-col justify-between items-start min-h-[320px] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)] hover:-translate-y-1"
                    >
                        <div className="space-y-4">
                            <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-amber-100/60 text-2xl shadow-inner border border-amber-200/30">
                                🔑
                            </span>
                            <h3 className="text-[20px] font-semibold text-slate-900 tracking-tight">
                                Already Have an OTP?
                            </h3>
                            <p className="text-[15px] font-medium text-slate-400/90 leading-relaxed">
                                Enter your code to release your queued print job instantly at any counter.
                            </p>
                        </div>
                        
                        <button
                            onClick={handleOpenOtpModal}
                            className="w-full h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[15px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5"
                        >
                            Enter OTP →
                        </button>
                    </motion.div>

                </div>

                {/* RIGHT CONSOLE - Desktop Columns 5–12 (65% equivalent layout) */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    
                    {/* Centered Campus Map Hero Panel */}
                    <motion.div 
                        variants={mapVariants}
                        className="overflow-hidden rounded-[24px] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_12px_40px_rgba(15,23,42,0.08)] relative group transition-all duration-300"
                    >
                        <video 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="w-full h-[330px] object-cover z-0 transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                        >
                            <source src={mapPin} type="video/mp4" />
                        </video>
                        
                        {/* Live Map status badge floating bottom-right */}
                        <div className="absolute bottom-4 right-4 z-20 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-full shadow-lg">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[10px] font-black tracking-widest text-slate-200 uppercase">Live Map</span>
                          </div>
                        </div>
                    </motion.div>

                    {/* Stacked wide grid layout for Dynamic Blocks */}
                    {loading ? (
                        <div className="text-center text-slate-400 font-bold py-12 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                            Loading locations...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                            {blocks.map((block) => (
                                <motion.div 
                                    key={block.name}
                                    variants={cardVariants}
                                    className="flex"
                                >
                                    <motion.button
                                        type="button"
                                        className="w-full relative overflow-hidden text-left border border-white/60 bg-white/70 backdrop-blur-xl p-8 rounded-[20px] shadow-[0_12px_40px_rgba(15,23,42,0.06)] flex flex-col justify-between items-start min-h-[220px] transition-all duration-300"
                                        onClick={() => selectBlock(block.name)}
                                        whileHover={{ 
                                          y: -8, 
                                          scale: 1.02, 
                                          borderColor: block.accent,
                                          boxShadow: `0 20px 60px -10px ${block.accent}25`
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="w-full flex items-start gap-4">
                                            <span 
                                                className="inline-grid place-items-center w-14 h-14 rounded-2xl text-2xl shrink-0 shadow-inner border border-blue-50/15"
                                                style={{ backgroundColor: `${block.accent}12` }}
                                            >
                                                {block.icon}
                                            </span>
                                            <div className="space-y-1 flex-1">
                                                <h3 className="text-[20px] font-semibold text-slate-900 tracking-tight leading-tight">{block.name}</h3>
                                                <p className="text-[15px] font-medium text-slate-400 mt-1 leading-relaxed">{block.description}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full mt-6 flex justify-end">
                                            <span 
                                                className="h-10 px-5 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center gap-1 shadow-sm border border-slate-150/40 bg-slate-50 hover:bg-slate-100 transition-all hover:-translate-y-0.5"
                                                style={{ color: block.accent }}
                                            >
                                                Select Location →
                                            </span>
                                        </div>
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>
                    )}

                </div>
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
