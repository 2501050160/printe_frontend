import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";
import mapPin from "../assets/map_pin.mp4";
import CustomModal from "../components/CustomModal";

const defaultIcons = ["🏛️", "⚡", "📘", "🏛️", "⚡", "📘"];
const defaultAccents = ["#0891b2", "#059669", "#7c3aed", "#e11d48", "#ea580c", "#db2777"];

// Page-load animation container variants for staggered child entry
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
      stiffness: 100,
      damping: 15
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
            // Clear the query param so refresh doesn't re-trigger
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
                        // Instantly set the order and OTP from the query params to avoid API delays!
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
                        // Fallback to fetching orders from API if query params don't have OTP
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
        <main className="page-shell page-shell-decorated min-h-screen bg-gradient-to-br from-slate-50/50 via-sky-50/20 to-emerald-50/10 py-12 px-6 md:px-12 relative overflow-hidden font-sans">
            {/* Soft Ambient Mesh Blur Gradients */}
            <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-blue-400/10 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-emerald-400/5 rounded-full blur-[130px] pointer-events-none" />

            <PopupManager page="LOCATION_SELECTION" />
            
            <motion.div 
                className="content-wrap max-w-6xl mx-auto relative z-10 space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={itemVariants} className="space-y-4">
                    <Navbar
                        title="Choose Print Location"
                        subtitle="Step 1 · Pickup Point"
                        badge="Required"
                    />

                    <p className="text-lg md:text-xl font-medium text-slate-500 max-w-3xl leading-relaxed mt-2">
                        Select where you will collect your printed documents. Orders are
                        routed to the printer at that location automatically.
                    </p>
                </motion.div>

                {/* Visual Focus Interactive Map Banner */}
                <motion.div 
                    variants={itemVariants}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-100/60 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50"
                >
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-64 md:h-[440px] object-cover z-0 transition-transform duration-700 hover:scale-[1.01]"
                    >
                        <source src={mapPin} type="video/mp4" />
                    </video>
                    
                    <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h4 className="font-extrabold text-lg md:text-xl tracking-tight">Autonomous Print Counters</h4>
                            <p className="text-sm text-slate-300 mt-1">Each campus block features a fully configured smart printer terminal.</p>
                        </div>
                        <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-4 py-2 rounded-full font-bold whitespace-nowrap tracking-wider uppercase">
                            Live Status
                        </span>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="text-center text-lg font-bold text-slate-400 py-16 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                      Loading locations...
                    </div>
                ) : (
                    <motion.div 
                      variants={itemVariants}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
                    >
                        {/* OTP utility card styled with amber accent */}
                        <motion.button
                            type="button"
                            className="relative overflow-hidden text-left border border-amber-200 bg-gradient-to-br from-amber-50/80 via-white/90 to-transparent p-8 md:p-10 rounded-[24px] shadow-lg shadow-amber-100/40 flex flex-col justify-between h-full w-full min-h-[300px] transition-all"
                            onClick={handleOpenOtpModal}
                            whileHover={{ 
                              y: -6, 
                              scale: 1.02, 
                              borderColor: "#d97706",
                              boxShadow: "0 25px 50px -12px rgba(217, 119, 6, 0.12)"
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="absolute inset-auto -right-10 -bottom-10 w-44 h-44 rounded-full bg-amber-500/10 blur-[28px] pointer-events-none" />
                            
                            <div>
                              <span className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-amber-100 text-3xl">🔑</span>
                              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-6">Enter the OTP</h3>
                              <p className="text-sm font-semibold text-slate-500 mt-2 leading-relaxed">enter otp to print</p>
                            </div>
                            
                            <span className="mt-8 text-sm font-extrabold tracking-wider uppercase text-amber-600 flex items-center gap-1.5 hover:underline">
                              Release Print →
                            </span>
                        </motion.button>

                        {/* Dynamic Blocks */}
                        {blocks.map((block) => (
                            <motion.button
                                key={block.name}
                                type="button"
                                className="relative overflow-hidden text-left border border-slate-200/80 bg-white/70 backdrop-blur-xl p-8 md:p-10 rounded-[24px] shadow-lg shadow-slate-100/50 flex flex-col justify-between h-full w-full min-h-[300px] transition-all"
                                style={{ "--block-accent": block.accent }}
                                onClick={() => selectBlock(block.name)}
                                whileHover={{ 
                                  y: -6, 
                                  scale: 1.02, 
                                  borderColor: block.accent,
                                  boxShadow: `0 25px 50px -12px ${block.accent}22`
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span 
                                  className="absolute inset-auto -right-10 -bottom-10 w-44 h-44 rounded-full blur-[28px] pointer-events-none"
                                  style={{ backgroundColor: `${block.accent}15` }}
                                />
                                
                                <div>
                                  <span 
                                    className="inline-grid place-items-center w-16 h-16 rounded-2xl text-3xl"
                                    style={{ backgroundColor: `${block.accent}15` }}
                                  >
                                    {block.icon}
                                  </span>
                                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-6">{block.name}</h3>
                                  <p className="text-sm font-semibold text-slate-500 mt-2 leading-relaxed">{block.description}</p>
                                </div>
                                
                                <span 
                                  className="mt-8 text-sm font-extrabold tracking-wider uppercase flex items-center gap-1.5"
                                  style={{ color: block.accent }}
                                >
                                  Select location →
                                </span>
                            </motion.button>
                        ))}
                    </motion.div>
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
