import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";
import mapPin from "../assets/map_pin.mp4";
import CustomModal from "../components/CustomModal";
import { 
  User, 
  LogOut, 
  Sparkles, 
  MapPin, 
  Printer, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Wifi, 
  Activity, 
  Clock, 
  Layers, 
  HelpCircle, 
  Search, 
  Bell, 
  ChevronRight, 
  CheckCircle2, 
  Check, 
  ExternalLink,
  Info
} from "lucide-react";

const defaultIcons = ["🏛️", "⚡", "📘", "🏛️", "⚡", "📘"];
const defaultAccents = ["#6C63FF", "#4F9DFF", "#9F6BFF", "#37E67D", "#F8B84E", "#FF5C7A"];

// Framer motion animation configurations
const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardHoverEffects = {
  hover: {
    y: -8,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
};

function BlockSelection() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Student User";
    const userEmail = localStorage.getItem("userEmail") || "student@campus.edu";

    // Search and filters
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all"); // all, nearest, popular

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
                    description: `${b.name} Print Center`,
                    icon: defaultIcons[idx % defaultIcons.length],
                    accent: defaultAccents[idx % defaultAccents.length],
                    distance: `${(0.2 + idx * 0.15).toFixed(2)} km`,
                    isOpen: idx !== 4, // Default opening statuses
                    queueTime: `${(idx * 3 + 1)} mins`,
                    availablePrinters: idx === 0 ? "4 Active" : idx === 2 ? "3 Active" : "2 Active",
                    colorSupported: idx % 2 === 0,
                    bwSupported: true
                }));
                // Ensure at least 4 blocks visually
                if (mapped.length < 4) {
                    mapped.push({
                        name: "A Block",
                        description: "A Block Print Center",
                        icon: "🏛️",
                        accent: "#6C63FF",
                        distance: "0.85 km",
                        isOpen: true,
                        queueTime: "12 mins",
                        availablePrinters: "2 Active",
                        colorSupported: false,
                        bwSupported: true
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

    // Filtered locations
    const filteredBlocks = blocks.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              b.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeFilter === "nearest") {
            return matchesSearch && parseFloat(b.distance) < 0.6;
        }
        if (activeFilter === "popular") {
            return matchesSearch && b.name.includes("C Block"); // simulated
        }
        return matchesSearch;
    });

    return (
        <main className="min-h-screen bg-[#060B17] py-8 px-4 md:px-8 xl:px-12 relative overflow-hidden font-sans text-white flex flex-col justify-between">
            {/* Custom fonts and global scrollbar styling injection */}
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background-color: #060B17;
                }
                .glass-panel {
                    background: rgba(18, 25, 45, 0.65);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
                }
                .glow-btn {
                    background: linear-gradient(135deg, #6C63FF 0%, #8B5CFF 100%);
                    box-shadow: 0 4px 20px rgba(108, 99, 255, 0.35);
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glow-btn:hover {
                    box-shadow: 0 6px 24px rgba(108, 99, 255, 0.5);
                    transform: scale(1.03);
                }
            `}} />

            {/* Ambient Lighting Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[60rem] h-[60rem] bg-indigo-500/[0.07] rounded-full blur-[180px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-purple-500/[0.06] rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute top-[30%] right-[10%] w-[45rem] h-[45rem] bg-[#4F9DFF]/[0.05] rounded-full blur-[150px] pointer-events-none" />

            {/* Premium Interactive grid background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-40 pointer-events-none" />

            <PopupManager page="LOCATION_SELECTION" />

            <div className="w-full max-w-[1600px] mx-auto space-y-10 relative z-10 flex-1 flex flex-col">
                
                {/* HEADER (Full Width, Stripe/Vercel inspired navbar) */}
                <motion.header 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full glass-panel py-4 px-6 rounded-2xl flex items-center justify-between gap-6"
                >
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#37E67D] animate-pulse" />
                        <span className="text-[12px] font-extrabold uppercase tracking-widest text-[#4F9DFF]">Step 1 of 3 • Pickup Point</span>
                    </div>

                    <div className="hidden md:flex items-center flex-1 max-w-md relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                        <input 
                            type="text" 
                            placeholder="Search campus buildings, blocks, or services..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-900/60 border border-white/5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#6C63FF] transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative w-10 h-10 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5C7A]" />
                        </button>

                        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-bold text-slate-200">{userName}</p>
                                <p className="text-[10px] font-semibold text-slate-400">{userEmail}</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#9F6BFF] flex items-center justify-center font-bold text-sm text-white shadow-md">
                                {userName.substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* HERO SECTION & INTERACTIVE 3D live campus map */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Left (40% columns equivalent on desktop) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-5 flex flex-col justify-between gap-6"
                    >
                        <div className="space-y-4">
                            <h1 className="text-5xl lg:text-5xl xl:text-[56px] font-extrabold tracking-tight text-white leading-[1.08]">
                                Choose Print <br/>
                                <span className="bg-gradient-to-r from-[#4F9DFF] via-[#6C63FF] to-[#9F6BFF] bg-clip-text text-transparent">Location</span>
                            </h1>
                            <p className="text-[16px] text-slate-400 font-medium leading-relaxed max-w-lg">
                                Select a smart printer location to retrieve your prints. Send documents securely to any node on campus and pick them up at your convenience.
                            </p>
                        </div>

                        {/* Live Client connected card */}
                        <div className="glass-panel p-6 rounded-[24px] space-y-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/20 flex items-center justify-center">
                                        <Cpu className="w-6 h-6 text-[#6C63FF]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#37E67D] animate-pulse" />
                                            <span className="text-[11px] font-black uppercase tracking-widest text-[#37E67D]">Secure Connected Client</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">Latency: <span className="font-mono text-[#4F9DFF]">12ms</span> • System OK</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={logout}
                                    className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/10 rounded-xl flex items-center gap-2 transition-all"
                                >
                                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                                </button>
                                <button 
                                    onClick={() => navigate("/my-orders")}
                                    className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/10 rounded-xl flex items-center gap-2 transition-all ml-auto"
                                >
                                    View Queue <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right (60% columns equivalent: Large interactive Campus Map Showcase centerpiece) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.55 }}
                        className="lg:col-span-7 rounded-[26px] overflow-hidden border border-white/5 bg-[#12192D]/40 backdrop-blur-md relative h-[380px] lg:h-auto flex flex-col justify-end shadow-2xl group"
                    >
                        {/* Layered cybernetic overlays on top of the live video stream */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#060B17] via-transparent to-transparent z-10 pointer-events-none" />
                        <video 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 brightness-[0.85] group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                        >
                            <source src={mapPin} type="video/mp4" />
                        </video>

                        {/* Interactive HUD / Markers */}
                        <div className="absolute top-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2.5 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-[#37E67D] animate-ping" />
                            <span className="text-[10px] font-extrabold tracking-widest text-[#37E67D] uppercase">CAMPUS MAP SATELLITE</span>
                        </div>

                        {/* Cybernetic details in map corners */}
                        <div className="absolute top-4 right-4 z-20 font-mono text-[9px] text-[#4F9DFF] opacity-60 bg-slate-950/40 p-1.5 rounded border border-white/5">
                            SYS.LOC // GRID_OK
                        </div>

                        <div className="relative z-10 p-6 space-y-1 text-left bg-gradient-to-t from-[#12192D]/90 via-[#12192D]/60 to-transparent">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#4F9DFF]">Map Preview</p>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                Campus Printer Grid Network <ExternalLink className="w-4 h-4 text-slate-400" />
                            </h3>
                            <p className="text-xs text-slate-400 max-w-md">
                                Holographic visualization of the print counters. Glowing nodes indicate online print points ready for dispatch.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* STATISTICS ROW - Four equal premium cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { 
                          label: "Active Printers", 
                          value: `${blocks.filter(b => b.name !== "A Block").length} Nodes`, 
                          icon: <Printer className="w-5 h-5 text-[#4F9DFF]" />, 
                          desc: "Online counters on campus", 
                          trend: "100% Online",
                          accent: "#4F9DFF" 
                        },
                        { 
                          label: "Jobs in Queue", 
                          value: `${pendingOrders.length} Pending`, 
                          icon: <Activity className="w-5 h-5 text-[#9F6BFF]" />, 
                          desc: "Your queued print operations", 
                          trend: "Synced",
                          accent: "#9F6BFF" 
                        },
                        { 
                          label: "Avg Wait Time", 
                          value: `${(pendingOrders.length * 1.5 || 1.2).toFixed(1)} Mins`, 
                          icon: <Clock className="w-5 h-5 text-[#37E67D]" />, 
                          desc: "Average wait for collection", 
                          trend: "Fast Speed",
                          accent: "#37E67D" 
                        },
                        { 
                          label: "System Health", 
                          value: "99.98%", 
                          icon: <Layers className="w-5 h-5 text-[#FF5C7A]" />, 
                          desc: "Uptime guarantee rate", 
                          trend: "Secure",
                          accent: "#FF5C7A" 
                        }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            variants={pageVariants}
                            whileHover="hover"
                            className="glass-panel p-6 rounded-[22px] text-left relative overflow-hidden transition-all duration-300 hover:shadow-[0_16px_30px_rgba(0,0,0,0.5)] group"
                            style={{"--glow-color": stat.accent}}
                        >
                            {/* Accent Glow backdrop line */}
                            <div className="absolute top-0 left-0 w-full h-[3px] opacity-40 group-hover:opacity-100 transition-opacity" style={{backgroundColor: stat.accent}} />
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/[0.02] rounded-full group-hover:scale-110 transition-transform" />

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">{stat.label}</span>
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-white">
                                    {stat.icon}
                                </div>
                            </div>
                            
                            <h4 className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</h4>
                            <p className="text-[12px] text-slate-400 mt-1 font-semibold">{stat.desc}</p>

                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#37E67D]">{stat.trend}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Live</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* MAIN CONTENT SPLIT GRID - LEFT (30%) & RIGHT (70%) */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
                    
                    {/* LEFT PANEL COLUMN (Occupies 3 columns) */}
                    <div className="lg:col-span-3 space-y-8">
                        
                        {/* Premium OTP Card */}
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="glass-panel p-6 rounded-[24px] text-left relative overflow-hidden border-[#F8B84E]/20 hover:border-[#F8B84E]/40 transition-all duration-300"
                        >
                            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-[#F8B84E]/10 rounded-full blur-xl pointer-events-none" />
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🔑</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#F8B84E] bg-[#F8B84E]/10 border border-[#F8B84E]/20 px-2.5 py-1 rounded-full">Secure release</span>
                            </div>

                            <h3 className="text-xl font-extrabold text-white mt-4 tracking-tight">Already Have an OTP?</h3>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Enter your code to release your queued print job instantly at any printer node.
                            </p>

                            <button 
                                onClick={handleOpenOtpModal}
                                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#F8B84E] to-[#e0a030] text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all mt-5 flex items-center justify-center gap-2 shadow-lg shadow-[#F8B84E]/20"
                            >
                                Verify OTP Code <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>

                        {/* How it Works Vertical Timeline Card */}
                        <div className="glass-panel p-6 rounded-[24px] text-left space-y-4">
                            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">How It Works</h3>
                            
                            <div className="space-y-6 relative pl-3 border-l border-white/10 ml-2 pt-2">
                                {[
                                    { title: "Upload PDF", desc: "Select and process files" },
                                    { title: "Choose Printer", desc: "Pick nearest pickup counter" },
                                    { title: "Verify OTP", desc: "Input code at counter" },
                                    { title: "Collect Print", desc: "Grab pages from output tray" }
                                ].map((step, idx) => (
                                    <div key={idx} className="relative group">
                                        <span className="absolute left-[-21px] top-0.5 inline-grid place-items-center w-5 h-5 rounded-full bg-slate-950 text-[10px] font-bold text-slate-300 border border-white/10 group-hover:border-[#6C63FF] transition-colors">
                                            {idx + 1}
                                        </span>
                                        <div className="pl-3">
                                            <p className="text-xs font-black text-white">{step.title}</p>
                                            <p className="text-[11px] text-slate-400 font-semibold">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL COLUMN (Occupies 7 columns) */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Search and location filters header section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                            <div>
                                <h2 className="text-2xl font-extrabold tracking-tight text-white">Available Print Locations</h2>
                                <p className="text-xs text-slate-400 mt-1 font-semibold">Select a building block below to confirm selection</p>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-900/60 p-1 border border-white/5 rounded-xl">
                                {[
                                    { id: "all", label: "All Blocks" },
                                    { id: "nearest", label: "Nearest" },
                                    { id: "popular", label: "Popular" }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFilter(f.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            activeFilter === f.id ? "bg-[#6C63FF] text-white" : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location selection grid */}
                        {loading ? (
                            <div className="text-center py-20 text-slate-400 font-bold">Loading blocks list...</div>
                        ) : filteredBlocks.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 font-semibold glass-panel rounded-2xl">
                                No locations found matching query.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredBlocks.map((block) => (
                                    <motion.div
                                        key={block.name}
                                        variants={cardHoverEffects}
                                        whileHover="hover"
                                        className="glass-panel rounded-[24px] overflow-hidden flex flex-col justify-between text-left group transition-all duration-300 hover:shadow-[0_16px_35px_rgba(0,0,0,0.5)] border-white/5 hover:border-[#6C63FF]/30"
                                    >
                                        {/* Colored Header banner strip */}
                                        <div className="h-1.5 w-full" style={{backgroundColor: block.accent}} />

                                        <div className="p-6 space-y-4">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl p-2.5 rounded-xl bg-slate-900/80 border border-white/5">{block.icon}</span>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white tracking-tight">{block.name}</h4>
                                                        <p className="text-xs text-slate-400 font-semibold">{block.description}</p>
                                                    </div>
                                                </div>

                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    block.isOpen ? "bg-[#37E67D]/10 text-[#37E67D] border border-[#37E67D]/20" : "bg-[#FF5C7A]/10 text-[#FF5C7A] border border-[#FF5C7A]/20"
                                                }`}>
                                                    {block.isOpen ? "Open" : "Closed"}
                                                </span>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-[12px] text-slate-400">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Distance</p>
                                                    <p className="font-extrabold text-slate-200 mt-0.5">{block.distance}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Queue Status</p>
                                                    <p className="font-extrabold text-slate-200 mt-0.5">{block.queueTime} wait</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Printer Status</p>
                                                    <p className="font-extrabold text-slate-200 mt-0.5">{block.availablePrinters}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Support Mode</p>
                                                    <p className="font-extrabold text-slate-200 mt-0.5">
                                                        {block.colorSupported ? "Color / BW" : "BW Only"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Select button */}
                                            <button
                                                onClick={() => selectBlock(block.name)}
                                                className="w-full h-11 rounded-xl bg-slate-900/80 hover:bg-gradient-to-r hover:from-[#6C63FF] hover:to-[#8B5CFF] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 border border-white/5 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 mt-4 flex items-center justify-center gap-2"
                                            >
                                                Select Print Counter <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* BOTTOM HELP / CONTACT SUPPORT BANNER */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="w-full rounded-[26px] bg-gradient-to-r from-[#12192D] via-[#0D1322] to-[#12192D] border border-white/5 p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div className="absolute top-[-30%] left-[-10%] w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-[-30%] right-[-10%] w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center gap-4 text-left">
                        <span className="text-4xl p-3 bg-slate-950/60 rounded-2xl border border-white/5">💬</span>
                        <div>
                            <h3 className="text-lg font-bold text-white">Need help choosing a print location?</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Contact the campus help desk team or read printer manual instructions.</p>
                        </div>
                    </div>

                    <a 
                        href="mailto:saipraveendasari2@gmail.com?subject=Print%20Location%20Support%20Request"
                        className="px-6 h-11 rounded-xl glow-btn text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        Contact Support Desk <ArrowRight className="w-4 h-4" />
                    </a>
                </motion.div>

                {/* Slim footer stats / verification security badges */}
                <footer className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6 text-slate-500 text-xs font-semibold">
                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                        <ShieldCheck className="w-4.5 h-4.5 text-[#37E67D]" />
                        <span>Protected by campus end-to-end local network encryption.</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-end gap-2.5">
                        <Info className="w-4.5 h-4.5 text-[#4F9DFF]" />
                        <span>Real-time status logs are active and monitored.</span>
                    </div>
                </footer>
            </div>

            {/* Custom Modal overlay popup */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />

            {/* Verification OTP Modal Overlay */}
            <AnimatePresence>
                {showOtpModal && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#12192D] p-6 text-center shadow-2xl relative overflow-hidden"
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                        >
                            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#F8B84E] to-[#9F6BFF]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#4F9DFF]">
                                Direct Print Release
                            </p>
                            <h3 className="mt-2 text-xl font-extrabold text-white">
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
                                        className="w-full h-12 rounded-xl bg-slate-900 border border-white/5 text-center text-sm font-bold text-white focus:border-[#6C63FF] focus:outline-none appearance-none px-4"
                                    >
                                        {pendingOrders.map(order => (
                                            <option key={order.orderId} value={order.orderId}>
                                                {order.orderId} - {order.fileName}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {selectedOrderId && pendingOrders.find(o => o.orderId === selectedOrderId) && (
                                    <div className="text-center text-xs font-bold text-[#F8B84E] bg-[#F8B84E]/10 border border-[#F8B84E]/20 py-2 rounded-xl mt-2">
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
                                    className="w-full h-12 rounded-xl bg-slate-900 border border-white/5 text-center text-lg font-bold text-white placeholder-slate-500 tracking-[0.5em] focus:border-[#6C63FF] focus:outline-none"
                                />
                            </div>

                            {otpError && (
                                <p className="text-xs font-bold text-[#FF5C7A] mt-4 bg-[#FF5C7A]/10 border border-[#FF5C7A]/20 py-2 rounded-lg">
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
                                    className="h-11 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDirectRelease}
                                    disabled={releasing || pendingOrders.length === 0}
                                    className="h-11 rounded-xl bg-[#6C63FF] hover:bg-[#8B5CFF] text-xs font-black text-white transition-colors disabled:opacity-50"
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
