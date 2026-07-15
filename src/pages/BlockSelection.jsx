import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";
import mapPin from "../assets/map_pin.mp4";
import CustomModal from "../components/CustomModal";
import { User, LogOut, Sparkles, MapPin, Printer, ArrowRight, ShieldCheck, Cpu, Wifi, Activity, Clock, Layers, HelpCircle, HardDrive, RefreshCw } from "lucide-react";

const defaultIcons = ["🏛️", "⚡", "📘", "🏛️", "⚡", "📘"];
const defaultAccents = ["#3b82f6", "#22d3ee", "#8b5cf6", "#f43f5e", "#f59e0b", "#ec4899"];

// Stagger child entrance variants
const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
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
  hidden: { opacity: 0, y: 25 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 90, damping: 14 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
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
                // Ensure at least 4 blocks visually by adding A Block placeholder if necessary
                if (mapped.length < 4) {
                    mapped.push({
                        name: "A Block",
                        description: "A Block print counter",
                        icon: "🏛️",
                        accent: "#ea580c"
                    });
                }
                setBlocks(mapped);
            } catch (err) {
                console.error("Failed to load blocks", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchPendingOrders = async () => {
            if (!userId) return;
            try {
                const res = await api.get("/pdf/userOrders", { params: { userId } });
                const pending = (res.data || []).filter(
                    o => o.status === "PENDING_SCAN" || o.status === "CANCEL_WINDOW"
                );
                setPendingOrders(pending);
            } catch (err) {
                console.error("Failed to fetch pending orders on mount:", err);
            }
        };

        fetchBlocks();
        fetchPendingOrders();
    }, [userId]);

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
        <main className="min-h-screen bg-[#070b14] py-10 px-4 md:px-12 relative overflow-hidden font-sans flex flex-col justify-between text-white">
            {/* Cinematic layered neon gradients matching specified palette */}
            <div className="absolute top-0 left-0 w-[55rem] h-[55rem] bg-[#3b82f6]/[0.1] rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[45rem] h-[45rem] bg-[#8b5cf6]/[0.08] rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-0 w-[50rem] h-[50rem] bg-[#22d3ee]/[0.08] rounded-full blur-[160px] pointer-events-none" />
            
            {/* Faint futuristic grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

            <PopupManager page="LOCATION_SELECTION" />
            
            <motion.div 
                className="w-full max-w-none mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10"
                variants={pageVariants}
                initial="hidden"
                animate="show"
            >
                {/* LEFT CONSOLE - Columns 1-4 (35% equivalent layout) */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-8">
                    
                    {/* Header console details */}
                    <motion.div variants={headerVariants} className="space-y-6">
                        <div className="space-y-3">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                                <Sparkles className="w-3.5 h-3.5 text-[#22d3ee] animate-pulse" /> STEP 1 OF 3 • PICKUP POINT
                            </span>
                            <h1 className="text-4xl md:text-[44px] font-black text-white tracking-tight leading-[1.05] drop-shadow-sm">
                                Choose Print Location
                            </h1>
                            <p className="text-[15px] font-medium text-slate-400 leading-relaxed">
                                Select the printer where you want to collect your documents. Orders route to that printer automatically.
                            </p>
                        </div>

                        {/* Secure Client Connected Status widget */}
                        <div className="p-5 bg-[#0b1020]/75 backdrop-blur-2xl border border-slate-800 rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#22d3ee] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <Cpu className="w-5.5 h-5.5 text-white animate-pulse" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-ping" />
                                        <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest leading-none">Live Client</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-300 mt-1 block">Latency: <span className="font-mono text-[#22d3ee]">12ms</span></span>
                                </div>
                            </div>
                            <button onClick={logout} className="h-9 px-4 rounded-full border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-400 flex items-center gap-1 transition-all hover:-translate-y-0.5">
                                <LogOut className="w-3.5 h-3.5" /> Sign Out
                            </button>
                        </div>
                    </motion.div>

                    {/* Premium Security Panel / OTP Card (with gold accent accentuating importance) */}
                    <motion.div 
                        variants={cardVariants}
                        className="p-8 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-[#0b1020]/90 backdrop-blur-2xl border border-amber-500/20 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex flex-col justify-between items-start min-h-[300px] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] hover:border-amber-500/40 hover:-translate-y-1"
                    >
                        <div className="space-y-4">
                            <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-amber-500/10 text-2xl shadow-inner border border-amber-500/20">
                                🔑
                            </span>
                            <h3 className="text-[20px] font-semibold text-white tracking-tight">
                                Already Have an OTP?
                            </h3>
                            <p className="text-[15px] font-medium text-slate-400 leading-relaxed">
                                Enter your code to release your queued print job instantly at any counter.
                            </p>
                        </div>
                        
                        <button
                            onClick={handleOpenOtpModal}
                            className="w-full h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[15px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5"
                        >
                            Verify OTP →
                        </button>
                    </motion.div>

                    {/* "How it Works" card instructions */}
                    <motion.div 
                        variants={cardVariants}
                        className="p-6 bg-[#0b1020]/75 backdrop-blur-2xl border border-slate-800/80 rounded-[24px] space-y-4"
                    >
                        <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider">How it works</h4>
                        <div className="space-y-3">
                            {[
                                "Choose a nearby printer counter from available blocks.",
                                "Your orders are routed automatically to that print node.",
                                "Visit the printer tray and release using your generated OTP."
                            ].map((text, idx) => (
                                <div key={idx} className="flex gap-3 items-start p-3 bg-slate-950/45 rounded-xl border border-slate-900">
                                    <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-blue-500/10 text-xs font-black text-blue-400 border border-blue-500/20 shrink-0">
                                        {idx + 1}
                                    </span>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed">{text}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Need Help? Support Card */}
                    <motion.div 
                        variants={cardVariants}
                        className="p-5 bg-[#0b1020]/65 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-[#0b1020]/80"
                    >
                        <div className="flex items-center gap-2.5">
                            <HelpCircle className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-400">Need Help?</span>
                        </div>
                        <a href="mailto:support@printcounter.edu" className="text-xs font-bold text-[#22d3ee] flex items-center gap-1 hover:underline">
                            Contact Support <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                    </motion.div>

                </div>

                {/* RIGHT CONSOLE - Widescreen holographic map & available location selection cards (Columns 5-12) */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    
                    {/* Immersive Widescreen Map visual centerpiece */}
                    <motion.div 
                        variants={mapVariants}
                        className="overflow-hidden rounded-[24px] border border-slate-800 bg-[#0b1020]/50 shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/50 to-transparent pointer-events-none z-10" />
                        <video 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="w-full h-[340px] object-cover z-0 transition-transform duration-500 ease-out group-hover:scale-[1.015] brightness-90 group-hover:brightness-100"
                        >
                            <source src={mapPin} type="video/mp4" />
                        </video>
                        
                        {/* Widescreen Live badge header inside map */}
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#0b1020]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[10px] font-black tracking-widest text-[#22c55e] uppercase">Live Printer Network</span>
                        </div>

                        {/* Floating Expand Map badge bottom-right */}
                        <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-full shadow-lg">
                          <span className="text-[10px] font-black tracking-widest text-slate-200 uppercase">Live Map</span>
                        </div>
                    </motion.div>

                    {/* Premium Live Statistics Panel below map */}
                    <motion.div 
                        variants={itemVariants}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-[#0b1020]/75 backdrop-blur-xl border border-slate-800/80 rounded-[20px] shadow-inner"
                    >
                        {[
                            { label: "Active Printers", value: `${blocks.filter(b => b.name !== "A Block").length} Node(s)`, icon: <Printer className="w-4 h-4 text-blue-400" /> },
                            { label: "Jobs in Queue", value: `${pendingOrders.length} Pending`, icon: <Activity className="w-4 h-4 text-cyan-400" /> },
                            { label: "Avg Wait Time", value: `${(pendingOrders.length * 1.5 || 1.2).toFixed(1)} Mins`, icon: <Clock className="w-4 h-4 text-purple-400" /> },
                            { label: "System Uptime", value: "99.98%", icon: <Layers className="w-4 h-4 text-emerald-400" /> }
                        ].map((stat, idx) => (
                            <div key={idx} className="space-y-1 border-r border-slate-800/50 last:border-0 pr-4 last:pr-0">
                                <div className="flex items-center gap-1.5">
                                    {stat.icon}
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                                </div>
                                <div className="text-lg font-extrabold text-white tracking-tight">{stat.value}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Available Printer Selection Grid */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-xl font-bold tracking-tight text-white">Available Print Locations</h3>
                            <span className="text-xs font-semibold text-slate-500">Sort by: Nearest</span>
                        </div>

                        {loading ? (
                            <div className="text-center text-slate-400 font-bold py-12 flex flex-col items-center justify-center gap-2">
                                <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
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
                                            className="w-full relative overflow-hidden text-left border border-slate-800 bg-[#0d1322]/80 backdrop-blur-2xl p-8 rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between items-start min-h-[220px] transition-all duration-300"
                                            onClick={() => selectBlock(block.name)}
                                            whileHover={{ 
                                              y: -8, 
                                              scale: 1.02, 
                                              borderColor: block.accent,
                                              boxShadow: `0 20px 40px -10px ${block.accent}20`
                                            }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="w-full flex items-start gap-4">
                                                <span 
                                                    className="inline-grid place-items-center w-14 h-14 rounded-2xl text-2xl shrink-0 shadow-inner border border-slate-800"
                                                    style={{ backgroundColor: `${block.accent}12` }}
                                                >
                                                    {block.icon}
                                                </span>
                                                <div className="space-y-1 flex-1">
                                                    <h3 className="text-[20px] font-semibold text-white tracking-tight leading-tight">{block.name}</h3>
                                                    <p className="text-[15px] font-medium text-slate-400 mt-1 leading-relaxed">{block.description}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="w-full mt-6 flex justify-end">
                                                <span 
                                                    className="h-10 px-5 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center gap-1 shadow-sm border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-all hover:-translate-y-0.5 text-white"
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

                    {/* Slim visual information bars at footer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#0b1020]/50 border border-slate-800/85 rounded-xl flex items-center gap-3">
                            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                            <span className="text-xs font-semibold text-slate-400">Real-time status updates synced with server counters.</span>
                        </div>
                        <div className="p-4 bg-[#0b1020]/50 border border-slate-800/85 rounded-xl flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-semibold text-slate-400">Secure end-to-end encrypted local campus printing.</span>
                        </div>
                    </div>

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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center shadow-2xl"
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
                                        className="w-full h-12 rounded-xl bg-slate-900 border border-slate-800 text-center text-sm font-bold text-white focus:border-sky-500 focus:outline-none appearance-none px-4"
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
                                    className="w-full h-12 rounded-xl bg-slate-900 border border-slate-800 text-center text-lg font-bold text-white placeholder-slate-500 tracking-[0.5em] focus:border-sky-500 focus:outline-none"
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
                                    className="h-11 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors"
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
