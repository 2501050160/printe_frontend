import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import introVideo from "../assets/intro.mp4";
import demoVideo from "../assets/demo.mp4";
import inVideo from "../assets/in.mp4";
import api from "../services/api";
import { 
  Printer, 
  UploadCloud, 
  CreditCard, 
  ShieldCheck, 
  MapPin, 
  Zap, 
  FileText, 
  Users, 
  TrendingUp,
  ChevronDown,
  Layers,
  Sparkles,
  Play,
  QrCode,
  Lock,
  Globe,
  Database,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

function Landing() {
  const [activeBuilding, setActiveBuilding] = useState("C Block");
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const introVideoRef = useRef(null);
  const [showDemo, setShowDemo] = useState(false);
  const statsRef = useRef(null);
  const statsStarted = useRef(false);
  const demoVideoRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Statistics counters
  const [stats, setStats] = useState({
    activePrinters: 27,
    pagesPrinted: 102540,
    studentsServed: 15420,
    successRate: 99.8
  });

  useEffect(() => {
    const introShown = sessionStorage.getItem("landingIntroShown");
    if (!introShown) {
      setShowIntro(true);
    }
  }, []);

  const handleSkipIntro = () => {
    sessionStorage.setItem("landingIntroShown", "true");
    setShowIntro(false);
  };

  // Load and refresh stats from database every 5 seconds
  useEffect(() => {
    const fetchStats = () => {
      const apiUrl = import.meta.env.VITE_API_URL || "https://printer-backend-34ih.onrender.com";
      fetch(`${apiUrl}/api/public/stats`)
        .then(res => res.json())
        .then(data => {
          setStats({
            activePrinters: data.activePrinters ?? 27,
            pagesPrinted: data.pagesPrinted ?? 102540,
            studentsServed: data.studentsServed ?? 15420,
            successRate: data.successRate ?? 99.8
          });
        })
        .catch(() => {
          // Fallback if backend is offline
          setStats({
            activePrinters: 27,
            pagesPrinted: 102540,
            studentsServed: 15420,
            successRate: 99.8
          });
        });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play demo video with audio when #how-it-works scrolls into view
  useEffect(() => {
    const video = demoVideoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Workflow auto-stepping effect for the 3D ecosystem column
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFlowStep((prev) => (prev + 1) % 6);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const faqData = [
    {
      q: "How does CloudPrint work?",
      a: "Simply upload your PDF to the web portal, customize your print options (such as color, paper size, and page range), make a cashless payment, and print. You will receive a unique OTP and QR code which you can use to instantly release the print job at your selected campus printer."
    },
    {
      q: "How secure is QR printing?",
      a: "CloudPrint utilizes point-to-point security. Your documents are stored encrypted on our server and are only decrypted when you walk up to the physical printer and scan your QR code or enter your 6-digit OTP. Your documents are automatically wiped from our cache after printing."
    },
    {
      q: "Can I pay using my wallet?",
      a: "Yes! Students can load money into their secure prepaid digital wallet using UPI, card, or net banking via Razorpay. Using the wallet allows for instantaneous checkouts and dynamic Happy Hours/Thesis discounts."
    },
    {
      q: "Can I print from my mobile?",
      a: "Absolutely. CloudPrint is a progressive web application. You don't need to install any app. Just open www.saipraveen.site on your iPhone or Android browser, upload your file, and pay."
    }
  ];

  const [buildingData, setBuildingData] = useState({
    "C Block": {
      status: "Online",
      statusColor: "text-emerald-500 bg-emerald-50 border-emerald-100",
      paper: "85%",
      wait: "2 mins",
      queue: 4,
      model: "Brother HL-L2320D"
    }
  });

  // Fetch real campus data
  useEffect(() => {
    let isMounted = true;
    const fetchBuildingData = async () => {
      try {
        const [blocksRes, printersRes] = await Promise.all([
          api.get("/blocks/all").catch(() => ({ data: [] })),
          api.get("/printer/all").catch(() => ({ data: [] }))
        ]);
        
        const blocks = blocksRes.data || [];
        const printers = printersRes.data || [];
        
        if (blocks.length === 0) return; // Keep fallback if backend fails
        
        const newBuildingData = {};
        
        await Promise.all(blocks.map(async (b) => {
          const printer = printers.find(p => p.blockLocation === b.name);
          let queueCount = 0;
          try {
             const queueRes = await api.get("/queue/pending", { params: { blockLocation: b.name } });
             queueCount = (queueRes.data || []).length;
          } catch (e) {
             // suppress error
          }
          
          let status = "Offline";
          let statusColor = "text-rose-500 bg-rose-50 border-rose-100";
          if (printer) {
             if (printer.active) {
                status = printer.maintenance ? "Busy" : "Online";
                statusColor = printer.maintenance 
                  ? "text-amber-500 bg-amber-50 border-amber-100" 
                  : "text-emerald-500 bg-emerald-50 border-emerald-100";
             }
          }
          
          let paperPercent = printer && printer.paperCount !== undefined ? Math.min(100, Math.round((printer.paperCount / 500) * 100)) : 0;
          
          newBuildingData[b.name] = {
            status,
            statusColor,
            paper: `${paperPercent}%${paperPercent < 20 ? " (Low Paper)" : ""}`,
            wait: queueCount > 0 ? `${queueCount * 2} mins` : "0 mins",
            queue: queueCount,
            model: printer && printer.printerName ? printer.printerName : "Standard Printer"
          };
        }));
        
        if (isMounted && Object.keys(newBuildingData).length > 0) {
          setBuildingData(newBuildingData);
          setActiveBuilding(current => {
             if (!newBuildingData[current]) return Object.keys(newBuildingData)[0];
             return current;
          });
        }
      } catch (err) {
        console.error("Error fetching building data:", err);
      }
    };
    
    fetchBuildingData();
    const interval = setInterval(fetchBuildingData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const flowSteps = [
    { name: "Student Laptop", color: "from-blue-500 to-indigo-500" },
    { name: "Upload PDF", color: "from-cyan-500 to-blue-500" },
    { name: "Cloud Server", color: "from-purple-500 to-indigo-500" },
    { name: "Payment Gateway", color: "from-amber-500 to-emerald-500" },
    { name: "Campus Printer", color: "from-purple-500 to-pink-500" },
    { name: "QR Collection", color: "from-emerald-500 to-teal-500" }
  ];

  return (
    <>
    <div className="min-h-screen bg-slate-950 text-white dot-grid relative overflow-hidden font-sans">
      {/* Inline SVG Clip Path definition */}
      <svg className="h-0 w-0 absolute pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="hero-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.38,0 Q 0.33,0.5 0.38,1 L 1.0,1 L 1.0,0 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Subtle Animated Background Mesh */}
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[40rem] h-[40rem] bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Transparent Navbar */}
      <header className="sticky top-0 z-50 w-full h-20 transition-all bg-transparent flex items-center" style={{ width: '100vw', left: 0, right: 0 }}>
        <nav className="w-full h-full px-[40px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CloudPrint
            </span>
          </div>

          <div className="hidden md:flex items-center gap-16 text-sm font-black text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#locations" className="hover:text-white transition-colors">Campus Locations</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center">
            <Link to="/login" className="btn success min-h-0 py-2.5 px-5 rounded-xl font-black text-sm shadow-md shadow-blue-500/10">
              ⚡ Upload Document
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-none px-0 pt-0 pb-24 relative z-10 -mt-20">
        <motion.div 
          className="relative w-full rounded-none min-h-[95vh] pt-28 pb-16 md:pb-24 bg-slate-950 border-b border-white/10 overflow-hidden flex items-center"
          initial={{ y: 0 }}
          animate={{ 
            y: [0, -4, 0],
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ transition: "all 0.3s ease" }}        >
          {/* Subtle Blue Ambient Glow Behind Arc */}
          <div className="absolute top-1/2 left-[40%] -translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

          {/* Background Video Showcase: occupies full hero area, clipped exactly to the curve on desktop */}
          <div 
            className="absolute inset-0 z-0 bg-transparent"
            style={isMobile ? {} : {
              clipPath: "url(#hero-clip)",
              WebkitClipPath: "url(#hero-clip)"
            }}
          >
            <video 
              src={inVideo}
              autoPlay 
              muted 
              loop 
              playsInline
              preload="auto"
              controls={false}
              controlsList="nodownload nofullscreen"
              disablePictureInPicture
              draggable="false"
              className={`w-full h-full object-cover object-center pointer-events-none select-none transition-all duration-300 ${isMobile ? 'blur-[4px] opacity-35' : 'opacity-100'}`}
            />
            {/* Soft feather overlay gradient where the arc meets the video (only on desktop) */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none hidden lg:block" />
          </div>

          {/* Massive Curved Glowing Arc Divider Stroke Overlay (rendered directly on 100% width, hidden on mobile) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible hidden lg:block" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* 2px glowing blue stroke */}
            <path d="M 38,0 Q 33,50 38,100" fill="none" stroke="#3B82F6" strokeWidth="2" className="filter drop-shadow-[0_0_20px_rgba(59,130,246,0.9)]" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Foreground Content Wrapper */}
          <div className="relative z-10 w-full px-8 md:px-12 lg:px-16 flex flex-col lg:flex-row justify-between items-center min-h-[90vh]">
            {/* Left Column: 40% width overlay with max-width 560px, vertically centered */}
            <div className="w-full lg:w-[40%] max-w-[560px] text-white text-left z-20 my-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60">
                <Sparkles className="w-3.5 h-3.5" /> Next-Gen Kiosk Printing
              </span>
              
              <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-white">
                Print Anywhere.<br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Collect Instantly.</span>
              </h1>
              
              <p className="mt-6 text-lg font-bold text-slate-300 leading-relaxed max-w-xl">
                Upload your PDF documents from anywhere on campus, pay securely online, and collect your prints instantly using secure OTP codes or QR verification from any CloudPrint-enabled printer.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login" className="btn success px-6 py-3.5 rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20">
                  ⚡ Upload Document
                </Link>
                <button
                  onClick={() => setShowDemo(true)}
                  className="btn secondary !bg-white/10 !text-white !border-white/10 hover:!bg-white/20 px-6 py-3.5 rounded-xl font-black text-sm flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-white" /> Watch Demo
                </button>
              </div>
              {/* Left-Side Trust Section */}
              <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 gap-4 text-slate-400">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-base">🖨️</span>
                  <span>{stats.activePrinters} Active Printers</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-base">📄</span>
                  <span>{stats.pagesPrinted.toLocaleString()} Pages Printed</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-base">👨‍🎓</span>
                  <span>{stats.studentsServed.toLocaleString()} Students Served</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-base">⚡</span>
                  <span>{stats.successRate}% Success Rate</span>
                </div>
              </div>
            </div>

            {/* Right Side: Empty div placeholder since video occupies full background of the right side */}
            <div className="hidden lg:block lg:w-[50%] h-[90vh] pointer-events-none relative" />
          </div>        </motion.div>
      </section>

      {/* Live Statistics Section */}
      <section className="bg-slate-900 text-white py-16 border-y border-slate-800" ref={statsRef}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-4xl font-black tracking-tight text-white">{stats.pagesPrinted.toLocaleString()}+</h3>
            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Pages Printed</p>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tight text-emerald-400">{stats.activePrinters}</h3>
            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Active Printers</p>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tight text-blue-400">{stats.successRate}%</h3>
            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tight text-purple-400">{stats.studentsServed.toLocaleString()}+</h3>
            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Students Served</p>
          </div>
        </div>
      </section>

      {/* How It Works — Demo Video Section */}
      <section id="how-it-works" className="bg-slate-950 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-950 border border-blue-800 px-3 py-1 rounded-full">
              Live Demo
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-white">
              See CloudPrint in Action
            </h2>
            <p className="mt-4 text-sm font-bold text-slate-400">
              Upload, pay, and collect prints in seconds — watch the full workflow.
            </p>
          </div>

          {/* Video player */}
          <div className="relative rounded-[20px] overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10">
            {/* macOS-style bar */}
            <div className="bg-slate-900 px-5 py-3 flex items-center gap-2 border-b border-white/10">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-black text-slate-400 ml-2 uppercase tracking-widest">CloudPrint — How It Works</span>
            </div>
            <video
              ref={demoVideoRef}
              src={demoVideo}
              autoPlay
              muted
              controls
              playsInline
              loop
              className="w-full aspect-video bg-black"
            />
          </div>
        </div>
      </section>

      {/* Trust Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 py-24" id="features">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm bg-[rgba(59,130,246,0.12)] border border-[rgba(96,165,250,0.35)] text-[#60A5FA]">
            Security & Trust
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl text-white font-[800] tracking-[-0.03em] [text-shadow:0_0_24px_rgba(59,130,246,0.18)]">
            Trusted Across Campus
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-[#FFFFFF] border border-[rgba(226,232,240,0.8)] rounded-[22px] shadow-[0_10px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_18px_50px_rgba(37,99,235,0.15)] flex items-start gap-4">
            <div className="p-3 bg-[#ECFDF5] rounded-2xl shadow-sm shadow-[#22C55E]/10 shrink-0">
              <Lock className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <h3 className="font-[700] text-[20px] text-[#111827]">Secure OTP Printing</h3>
              <p className="text-xs text-[#64748B] mt-1.5 leading-[1.7]">No unauthorized prints. Documents release only when you type in your OTP.</p>
            </div>
          </div>

          <div className="p-6 bg-[#FFFFFF] border border-[rgba(226,232,240,0.8)] rounded-[22px] shadow-[0_10px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_18px_50px_rgba(37,99,235,0.15)] flex items-start gap-4">
            <div className="p-3 bg-[#EFF6FF] rounded-2xl shadow-sm shadow-[#2563EB]/10 shrink-0">
              <QrCode className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="font-[700] text-[20px] text-[#111827]">QR Code Release</h3>
              <p className="text-xs text-[#64748B] mt-1.5 leading-[1.7]">Simply scan the QR sticker on the kiosk tray to immediately output pages.</p>
            </div>
          </div>

          <div className="p-6 bg-[#FFFFFF] border border-[rgba(226,232,240,0.8)] rounded-[22px] shadow-[0_10px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_18px_50px_rgba(37,99,235,0.15)] flex items-start gap-4">
            <div className="p-3 bg-[#F5F3FF] rounded-2xl shadow-sm shadow-[#8B5CF6]/10 shrink-0">
              <CreditCard className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <h3 className="font-[700] text-[20px] text-[#111827]">Razorpay Payments</h3>
              <p className="text-xs text-[#64748B] mt-1.5 leading-[1.7]">Fast checkouts using UPI, Credit Cards, or Net banking gateways.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Campus Map Section */}
      <section className="bg-slate-50 border-y border-slate-200/60 py-24" id="locations">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-[800] uppercase tracking-widest text-[#9333EA] bg-[#F3E8FF] border border-[#D8B4FE] px-3 py-1 rounded-full">
              Interactive Campus Map
            </span>
            <h2 className="mt-4 text-[48px] font-[800] text-[#111827] leading-tight">
              Find Active Campus Printers
            </h2>
            <p className="mt-4 text-[#475569] leading-[1.8]">
              Click on a building in the selector grid to check real-time queue states, hardware status, and paper load levels.
            </p>

            {/* Building Grid Selector */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {Object.keys(buildingData).map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveBuilding(name)}
                  className={`p-4 rounded-2xl border text-left transition-[0.3s] ${
                    activeBuilding === name
                      ? "bg-[#EFF6FF] border-[#2563EB] border-[2px] text-[#1D4ED8] shadow-[0_0_30px_rgba(37,99,235,0.18)] scale-[1.02] font-[800]"
                      : "bg-[#FFFFFF] border-[#E2E8F0] text-[#334155] hover:border-[#2563EB] hover:shadow-[0_12px_30px_rgba(37,99,235,0.12)] font-[700]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{name}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      buildingData[name].status === "Online"
                        ? "bg-[#22C55E] animate-pulse"
                        : buildingData[name].status === "Busy"
                        ? "bg-[#F59E0B]"
                        : "bg-[#EF4444]"
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Building Live Status Panel */}
          <div className="p-8 rounded-[24px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] flex flex-col gap-6 relative overflow-hidden transition-[0.3s]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Selected Hub</span>
                <h3 className="text-2xl font-[800] text-[#111827] mt-1">{activeBuilding}</h3>
              </div>
              {buildingData[activeBuilding].status === "Online" ? (
                <span className="px-3 py-1 rounded-full text-xs font-[800] uppercase bg-[#DCFCE7] text-[#16A34A] animate-[float_3s_ease-in-out_infinite]">
                  {buildingData[activeBuilding].status}
                </span>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-[800] uppercase border ${buildingData[activeBuilding].statusColor}`}>
                  {buildingData[activeBuilding].status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold text-[#64748B]">Paper Level</p>
                  <p className="text-lg font-[700] text-[#111827]">{buildingData[activeBuilding].paper}</p>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] transition-all duration-1000 ease-out"
                    style={{ width: buildingData[activeBuilding].paper }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#64748B]">Estimated Wait</p>
                <p className="text-lg font-[700] text-[#2563EB] mt-1">{buildingData[activeBuilding].wait}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-[#64748B]">Active Queue</p>
                <p className="text-lg font-[700] text-[#111827] mt-1">{buildingData[activeBuilding].queue} orders pending</p>
              </div>
              <span className="text-xs font-bold text-[#64748B]">Model: {buildingData[activeBuilding].model}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Dashboard Perspective Previews */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            Modern SaaS Interfaces
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
            Interactive Dashboard Ecosystems
          </h2>
        </div>

        {/* Perspective stacked cards */}
        <div className="relative h-[480px] w-full flex items-center justify-center overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-tr from-slate-100 to-white shadow-inner p-8">
          
          {/* Admin Dashboard Mock Card */}
          <div 
            className="absolute left-10 md:left-24 w-[360px] md:w-[460px] h-[300px] rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 hidden sm:flex flex-col gap-4"
            style={{
              transform: "perspective(1000px) rotateY(15deg) rotateX(8deg) translateZ(50px)",
              opacity: 0.85
            }}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs font-black text-slate-500">SaaS Admin Control</span>
              <span className="h-2 w-2 rounded-full bg-blue-600" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold">Revenue</span>
                <p className="text-sm font-black mt-1">₹4,290.00</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold">Online</span>
                <p className="text-sm font-black mt-1">6 Printers</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold">Queue</span>
                <p className="text-sm font-black mt-1">4 Active</p>
              </div>
            </div>
            <div className="h-24 bg-slate-50 rounded-xl border flex items-center justify-center text-xs font-bold text-slate-400">
              Interactive charts (ApexCharts/Recharts)
            </div>
          </div>

          {/* Student Dashboard Mock Card (Top/Front) */}
          <div 
            className="w-[380px] md:w-[480px] h-[320px] rounded-2xl bg-slate-950 text-white shadow-2xl p-6 flex flex-col gap-4 z-20"
            style={{
              transform: "perspective(1000px) rotateY(-15deg) rotateX(10deg) translateZ(80px)"
            }}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-black text-slate-400">www.saipraveen.site</span>
              </div>
              <span className="text-[10px] font-black uppercase text-cyan-300">Active</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Wallet balance</p>
              <h3 className="text-3xl font-black mt-1">₹120.00</h3>
            </div>
            
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate">thesis_report_v2.pdf</p>
                  <p className="text-[10px] text-slate-400">Ready to collect · OTP: 892718</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between gap-3 mt-2">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex-1">
                <span className="text-[9px] text-slate-500 font-bold block">SAVED</span>
                <span className="text-xs font-black text-emerald-400">₹85.00</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex-1">
                <span className="text-[9px] text-slate-500 font-bold block">REWARDS</span>
                <span className="text-xs font-black text-purple-400">420 pts</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="bg-white py-24 border-t border-slate-200/80" id="faq">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              Questions & Answers
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {faqData.map((faq, index) => (
              <div 
                key={faq.q} 
                className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50 hover:bg-white transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full p-6 flex justify-between items-center text-left font-black text-slate-900 text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${
                    activeFaq === index ? "rotate-180" : ""
                  }`} />
                </button>
                
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100"
                    >
                      <p className="p-6 text-sm font-bold text-slate-500 leading-relaxed bg-white">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="p-12 md:p-16 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-2xl text-center">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-[54px] text-white font-[800] tracking-tight leading-tight">
              Ready to Experience Smart Campus Printing?
            </h2>
            <p className="mt-6 text-[20px] text-[#E2E8F0] leading-relaxed">
              Upload your documents, skip the queues, and experience printing made smart. Sign up for a free student wallet and print today.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/login" className="px-8 py-4 rounded-xl font-[800] text-white bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:-translate-y-[3px] hover:shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-[1.03] transition-all duration-300 relative">
                <span className="relative z-10">Sign In & Upload ⚡</span>
                <div className="absolute inset-0 bg-white/20 blur-md rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
              </Link>
              <Link to="/login" className="px-8 py-4 rounded-xl font-[800] bg-white text-[#111827] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:scale-[1.03] transition-all duration-300 shadow-sm relative">
                <span className="relative z-10">Sign In with Google</span>
                <div className="absolute inset-0 bg-white/30 blur-md rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-16 text-sm">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#2563EB] text-white shadow-sm">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-[16px] font-[800] tracking-tight text-[#2563EB]">
                CloudPrint
              </span>
            </div>
            <p className="text-[#64748B] leading-[1.7]">
              Automating university printing hubs through dynamic cloud systems, safe collections, and dynamic Student discounts.
            </p>
          </div>

          <div>
            <h4 className="text-[#111827] font-[700] uppercase tracking-widest mb-4 text-xs">Features</h4>
            <div className="flex flex-col gap-2.5 font-[500]">
              <a href="#features" className="text-[#334155] hover:text-[#2563EB] transition-[0.3s]">OTP Safe Printing</a>
              <a href="#locations" className="text-[#334155] hover:text-[#2563EB] transition-[0.3s]">Campus Map</a>
              <Link to="/blocks" className="text-[#334155] hover:text-[#2563EB] transition-[0.3s]">Location Selector</Link>
            </div>
          </div>

          <div>
            <h4 className="text-[#111827] font-[700] uppercase tracking-widest mb-4 text-xs">Support & Documentation</h4>
            <div className="flex flex-col gap-2.5 font-[500]">
              <Link to="/admin-login" className="text-[#334155] hover:text-[#2563EB] transition-[0.3s]">Admin Login</Link>
              <span className="normal-case font-[700] text-[#2563EB] block">🌐 {window.location.host || 'saipraveen.soye'}</span>
            </div>
          </div>

          <div>
            <h4 className="text-[#111827] font-[700] uppercase tracking-widest mb-4 text-xs">CloudPrint Ecosystem</h4>
            <p className="text-[#64748B] leading-[1.7]">
              Designed for high-performance kiosk TVs, student notebooks, and campus admins.
            </p>
            <p className="mt-4 text-[11px] text-[#94A3B8] font-[500]">
              © {new Date().getFullYear()} CloudPrint Inc. All rights reserved.
            </p>
          </div>

        </div>
      </footer>
    </div>

      {/* Intro Video Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <video
              ref={introVideoRef}
              autoPlay
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover absolute inset-0 z-0"
              onEnded={handleSkipIntro}
            >
              <source src={introVideo} type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10 pointer-events-none" />

            {/* Tap to Start splash */}
            <AnimatePresence>
              {isMuted && (
                <motion.div
                  className="absolute inset-0 z-30 flex flex-col items-start justify-end pb-10 pl-10 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => {
                    const v = introVideoRef.current;
                    if (!v) return;
                    v.muted = false;
                    v.play().catch(() => {});
                    setIsMuted(false);
                  }}
                >
                  <motion.div
                    className="flex flex-row items-center gap-3"
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-2xl">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    </div>
                    <p className="text-white font-black text-xs tracking-widest uppercase">Tap to Unmute</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skip button */}
            <button
              onClick={handleSkipIntro}
              className="absolute bottom-10 right-10 z-40 px-6 py-3 bg-white/10 hover:bg-white/25 text-white font-black text-sm tracking-wider uppercase rounded-full border border-white/25 backdrop-blur-md transition-all shadow-2xl hover:scale-105 active:scale-95"
            >
              Skip Intro →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Video Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              initial={{ scale: 0.92, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 30 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowDemo(false)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-lg flex items-center justify-center border border-white/20 backdrop-blur-sm transition-all"
              >
                ✕
              </button>

              {/* Header bar */}
              <div className="bg-slate-950 px-5 py-3 flex items-center gap-2 border-b border-white/10">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-black text-slate-400 ml-2 uppercase tracking-widest">CloudPrint — How It Works</span>
              </div>

              <video
                src={demoVideo}
                autoPlay
                controls
                className="w-full aspect-video bg-black"
                onEnded={() => setShowDemo(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Landing;
