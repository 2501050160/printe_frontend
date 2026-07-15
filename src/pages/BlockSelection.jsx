import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";
import mapPin from "../assets/map_pin.mp4";
import CustomModal from "../components/CustomModal";
import { User, LogOut, Sparkles, MapPin } from "lucide-react";

const defaultIcons = ["🏛️", "⚡", "📘", "🏛️", "⚡", "📘"];
const defaultAccents = ["#0891b2", "#059669", "#7c3aed", "#e11d48", "#ea580c", "#db2777"];

// Page-load animation variants
const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const mapVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut", delay: 0.1 } }
};

const cardContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
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
        <main className="min-h-screen bg-slate-50 py-12 px-6 md:px-12 relative overflow-hidden font-sans">
            {/* Elegant blurred ambient blue gradients in corners */}
            <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-blue-400/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-sky-300/10 rounded-full blur-[140px] pointer-events-none" />
            
            {/* Light dotted pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

            <PopupManager page="LOCATION_SELECTION" />
            
            <div className="w-full max-w-none relative z-10 space-y-10">
                {/* HEADER: Premium card height & layout */}
                <motion.header 
                    variants={headerVariants}
                    initial="hidden"
                    animate="show"
                    className="p-8 bg-white/70 backdrop-blur-xl border border-blue-100/50 rounded-[24px] shadow-lg shadow-slate-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 min-h-[140px]"
                >
                    <div className="space-y-2.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/50">
                            <Sparkles className="w-3.5 h-3.5" /> STEP 1 • PICKUP POINT
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            Choose Print Location
                        </h1>
                        <p className="text-sm font-semibold text-slate-400/90 leading-relaxed">
                            Select the printer where you want to collect your documents. Orders are routed automatically.
                        </p>
                    </div>

                    {/* Profile Section: Glass card with soft blue glow */}
                    <div className="flex items-center gap-3.5 bg-white/50 backdrop-blur-md border border-blue-100/60 p-2.5 pr-5 rounded-2xl shadow-sm shadow-blue-500/5">
                        <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/15">
                            <User className="w-5.5 h-5.5" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Session</div>
                            <button onClick={logout} className="text-xs font-extrabold text-rose-500 hover:text-rose-600 flex items-center gap-1 mt-0.5 transition-colors">
                                <LogOut className="w-3.5 h-3.5" /> Sign Out
                            </button>
                        </div>
                    </div>
                </motion.header>

                {/* MAP SECTION: Visual Hero Element */}
                <motion.div 
                    variants={mapVariants}
                    initial="hidden"
                    animate="show"
                    className="overflow-hidden rounded-[24px] border border-blue-100/50 bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-100/60 relative group"
                >
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-[300px] object-cover z-0 transition-all duration-500 group-hover:scale-[1.015] group-hover:brightness-105"
                    >
                        <source src={mapPin} type="video/mp4" />
                    </video>
                    
                    {/* Floating live status badge bottom-right */}
                    <div className="absolute bottom-5 right-5 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-full shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-extrabold tracking-widest text-slate-200 uppercase">Live Map</span>
                      </div>
                    </div>
                </motion.div>

                {/* BOTTOM LAYOUT: Asymmetric Two-Column Grid */}
                {loading ? (
                    <div className="text-center text-slate-400 font-bold py-16 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                        Loading locations...
                    </div>
                ) : (
                    <motion.div 
                      variants={cardContainerVariants}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-stretch"
                    >
                        
                        {/* LEFT (30% width / 3 cols) - Large OTP Card */}
                        <motion.div 
                            variants={cardVariants}
                            className="lg:col-span-3 flex"
                        >
                            <motion.button
                                type="button"
                                className="w-full relative overflow-hidden text-left border border-amber-200/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white p-8 rounded-[24px] shadow-lg shadow-amber-500/5 flex flex-col justify-between items-start min-h-[380px] lg:min-h-full transition-all duration-300"
                                onClick={handleOpenOtpModal}
                                whileHover={{ 
                                  y: -8, 
                                  scale: 1.02, 
                                  borderColor: "#f59e0b",
                                  boxShadow: "0 25px 45px -15px rgba(245, 158, 11, 0.18)"
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div>
                                    <span className="inline-grid place-items-center w-16 h-16 rounded-full bg-amber-100 text-3xl shadow-inner">
                                        🔑
                                    </span>
                                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-6">
                                        Already Have an OTP?
                                    </h3>
                                    <p className="text-sm font-semibold text-slate-500 mt-2 leading-relaxed">
                                        Release your existing print instantly.
                                    </p>
                                </div>
                                
                                <span className="w-full mt-8 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm text-center transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30">
                                    Enter OTP →
                                </span>
                            </motion.button>
                        </motion.div>

                        {/* RIGHT (70% width / 7 cols) - Dynamic Blocks 2x2 grid */}
                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                            {blocks.map((block) => (
                                <motion.div 
                                    key={block.name}
                                    variants={cardVariants}
                                    className="flex"
                                >
                                    <motion.button
                                        type="button"
                                        className="w-full relative overflow-hidden text-left border border-blue-100/50 bg-white/70 backdrop-blur-xl p-8 rounded-[20px] shadow-lg shadow-slate-100/40 flex flex-col justify-between items-start min-h-[220px] transition-all duration-300"
                                        onClick={() => selectBlock(block.name)}
                                        whileHover={{ 
                                          y: -8, 
                                          scale: 1.02, 
                                          borderColor: block.accent,
                                          boxShadow: `0 25px 45px -15px ${block.accent}22`
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <span 
                                                className="inline-grid place-items-center w-16 h-16 rounded-full text-3xl shrink-0 shadow-inner"
                                                style={{ backgroundColor: `${block.accent}12` }}
                                            >
                                                {block.icon}
                                            </span>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{block.name}</h3>
                                                <p className="text-xs font-semibold text-slate-500 leading-relaxed">{block.description}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full mt-6 flex justify-end">
                                            <span 
                                                className="py-2.5 px-4 rounded-full text-xs font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-sm border border-slate-150/50 bg-slate-50 hover:bg-slate-100"
                                                style={{ color: block.accent }}
                                            >
                                                Select Location →
                                            </span>
                                        </div>
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>

                    </motion.div>
                )}
            </div>

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
