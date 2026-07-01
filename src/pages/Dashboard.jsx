import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getWalletBalance, clearUserSession } from "../services/auth";
import CustomModal from "../components/CustomModal";
import fileUploading from "../assets/file_uploading.mp4";
import howToUpload from "../assets/how_to_upload.mp4";
import walletVideo from "../assets/wallet_video.mp4";
import myOrdersVideo from "../assets/my_orders_video.mp4";
import ordersLoading from "../assets/orders_loading.mp4";

function Dashboard() {
    const [bwPrice, setBwPrice] = useState(2);
    const [colorPrice, setColorPrice] = useState(5);
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");
    const referralCode = localStorage.getItem("referralCode") || "";

    const [printType, setPrintType] = useState("BW");
    const blockLocation = localStorage.getItem("selectedBlock");
    
    // Multiple files support
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [totalPages, setTotalPages] = useState(0);
    const [orderId, setOrderId] = useState("");
    const [uploaded, setUploaded] = useState(false);
    const [copies, setCopies] = useState(1);
    const [pageOption, setPageOption] = useState("ALL");
    const [startPage, setStartPage] = useState("");
    const [endPage, setEndPage] = useState("");

    // Custom PDF Previews and Page list
    const [selectedPagesList, setSelectedPagesList] = useState([]);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [renderedPreviews, setRenderedPreviews] = useState([]);

    // Wallet transaction ledger
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    // Queue wait time and load balancing suggestions
    const [estimates, setEstimates] = useState({});
    const [suggestions, setSuggestions] = useState([]);

    // 10-Minute PENDING_SCAN OTP Release Countdown
    const [scanCountdown, setScanCountdown] = useState("");

    useEffect(() => {
        const orderPendingScan = orders.find(o => o.status === "PENDING_SCAN");
        if (!orderPendingScan || !orderPendingScan.cancelWindowEndsAt) {
            setScanCountdown("");
            return;
        }

        const updateTimer = () => {
            const ends = new Date(orderPendingScan.cancelWindowEndsAt).getTime();
            const timeoutTime = ends + 10 * 60 * 1000; // 10-minute scan limit
            const now = Date.now();
            const diff = timeoutTime - now;

            if (diff <= 0) {
                setScanCountdown("Expired");
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setScanCountdown(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        };

        updateTimer();
        const timerId = setInterval(updateTimer, 1000);

        return () => clearInterval(timerId);
    }, [orders]);

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState("print");

    // Additional States
    const [uploading, setUploading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [showWalletModal, setShowWalletModal] = useState(false);
    
    // Support Desk
    const [supportName, setSupportName] = useState(userName || "");
    const [supportEmail, setSupportEmail] = useState(userEmail || "");
    const [supportMessage, setSupportMessage] = useState("");
    const [supportSubmitting, setSupportSubmitting] = useState(false);

    // Rewards & Claim Codes
    const [rewardCode, setRewardCode] = useState("");
    const [claimingReward, setClaimingReward] = useState(false);

    // Dynamic state
    const [paperCount, setPaperCount] = useState(0);
    const [sections, setSections] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [settings, setSettings] = useState({
        referralEnabled: true,
        referrerAmount: 10.0,
        refereeAmount: 5.0,
        popupEnabled: true,
        popupMessage: "",
        adEnabled: true,
        adText: "",
        generalPopupEnabled: false,
        generalPopupMessage: ""
    });

    // Welcome Privacy Modal States
    const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // General Announcement Modal States
    const [showGeneralPopup, setShowGeneralPopup] = useState(false);
    const [dontShowGeneralPopupAgain, setDontShowGeneralPopupAgain] = useState(false);

    // Custom Modal config
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const showAlert = (title, message, type = "info") => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: null
        });
    };

    const [systemStatus, setSystemStatus] = useState({
        databaseConnected: true,
        agentOnline: true,
        printerConfigured: true
    });

    // Check Privacy Notice on mount
    useEffect(() => {
        const dontShow = localStorage.getItem("dontShowPrivacyNotice") === "true";
        if (!dontShow) {
            setShowPrivacyNotice(true);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            getWalletBalance(userId).then(setWalletBalance);
        }
    }, [userId]);

    useEffect(() => {
        fetchPrices();
        fetchActiveSections();
    }, []);

    // PDF.js worker setup and local preview generation
    useEffect(() => {
        if (selectedFiles.length > 0 && selectedFiles[0].type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = function() {
                const arrayBuffer = this.result;
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                
                pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(pdf => {
                    setPdfDoc(pdf);
                    const allPages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
                    setSelectedPagesList(allPages);
                    
                    const previewsCount = Math.min(pdf.numPages, 12);
                    const previews = [];
                    for (let i = 1; i <= previewsCount; i++) {
                        previews.push(i);
                    }
                    setRenderedPreviews(previews);
                }).catch(err => {
                    console.error("Error loading PDF for preview:", err);
                });
            };
            reader.readAsArrayBuffer(selectedFiles[0]);
        } else {
            setPdfDoc(null);
            setRenderedPreviews([]);
            setSelectedPagesList([]);
        }
    }, [selectedFiles]);

    // SSE EventSource implementation
    useEffect(() => {
        if (!userId) return;
        
        const url = `${api.defaults.baseURL || "http://localhost:8080"}/api/queue/stream/${userId}`;
        const eventSource = new EventSource(url);

        eventSource.addEventListener("progress", (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.status === "COMPLETED") {
                    showAlert("Order Completed! 🎉", `Your order ${data.orderId} is printed and ready for collection!`, "success");
                }
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.orderId === data.orderId 
                            ? { ...order, status: data.status, printProgress: data.progress } 
                            : order
                    )
                );
            } catch (err) {
                console.error("Error parsing progress update:", err);
            }
        });

        eventSource.addEventListener("queue-update", () => {
            fetchOrders();
            getWalletBalance(userId).then(setWalletBalance);
            fetchPaperCount();
        });

        eventSource.onerror = (err) => {
            console.error("SSE connection error:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [userId]);

    // Fetch wallet transaction ledger when modal opens
    useEffect(() => {
        if (showWalletModal && userId) {
            setLoadingTransactions(true);
            api.get("/wallet/transactions", { params: { userId } })
                .then(res => {
                    setTransactions(res.data || []);
                })
                .catch(err => {
                    console.error("Failed to load transactions", err);
                })
                .finally(() => {
                    setLoadingTransactions(false);
                });
        }
    }, [showWalletModal, userId]);

    // Queue wait time and traffic load balancing suggestions
    const activeOrder = orders.find(o => o.status !== "COMPLETED" && o.status !== "CANCELLED");

    useEffect(() => {
        if (activeOrder) {
            api.get("/queue/estimate", { params: { orderId: activeOrder.orderId } })
                .then(res => {
                    setEstimates(prev => ({ ...prev, [activeOrder.orderId]: res.data }));
                    const waitMin = res.data.estimatedWaitTimeMinutes || 0;
                    if (waitMin > 10 || paperCount < (activeOrder.totalPages * activeOrder.copies) || !systemStatus.agentOnline) {
                        api.get("/printer/suggestions", { params: { currentBlock: activeOrder.blockLocation } })
                            .then(sugRes => {
                                setSuggestions(sugRes.data || []);
                            });
                    } else {
                        setSuggestions([]);
                    }
                })
                .catch(err => console.error(err));
        } else {
            setSuggestions([]);
        }
    }, [activeOrder, paperCount, systemStatus]);

    // Helper functions for page selection
    const handlePageOptionChange = (option) => {
        setPageOption(option);
        if (option === "ALL") {
            setSelectedPagesList(Array.from({ length: totalPages }, (_, i) => i + 1));
        } else if (option === "ODD") {
            setSelectedPagesList(Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 !== 0));
        } else if (option === "EVEN") {
            setSelectedPagesList(Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p % 2 === 0));
        }
    };

    const togglePageSelection = (pageNum) => {
        setPageOption("CUSTOM");
        setSelectedPagesList(prev => {
            if (prev.includes(pageNum)) {
                return prev.filter(p => p !== pageNum);
            } else {
                return [...prev, pageNum];
            }
        });
    };

    const extractOrderId = (desc) => {
        if (!desc) return null;
        const match = desc.match(/ORD-[A-Z0-9]+/i);
        return match ? match[0] : null;
    };

    const downloadReceipt = async (ordId) => {
        try {
            const response = await api.get(`/pdf/receipt/${ordId}`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt_${ordId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to download receipt:", err);
            showAlert("Download Failed", "Unable to download the receipt for this order.", "error");
        }
    };

    // Orders Polling (Every 3 seconds)
    const fetchOrders = async () => {
        if (!userId) {
            setLoadingOrders(false);
            return;
        }
        try {
            const response = await api.get("/pdf/userOrders", {
                params: { userId }
            });
            setOrders(response.data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 3000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    const fetchActiveSections = async () => {
        try {
            const response = await api.get("/sections/active");
            setSections(response.data || []);
        } catch (err) {
            console.error("Failed to fetch active sections", err);
        }
    };

    const fetchPaperCount = async () => {
        if (!blockLocation) return;
        try {
            const response = await api.get("/printer/paper", {
                params: { blockLocation }
            });
            setPaperCount(response.data != null ? response.data : 0);
        } catch (err) {
            console.error("Failed to fetch paper count", err);
        }
    };

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await api.get("/system/status", {
                    params: { blockLocation }
                });
                setSystemStatus(response.data);
            } catch (err) {
                setSystemStatus({
                    databaseConnected: false,
                    agentOnline: false,
                    printerConfigured: false
                });
            }
            fetchPaperCount();
        };

        if (blockLocation) {
            checkStatus();
            const interval = setInterval(checkStatus, 8000);
            return () => clearInterval(interval);
        }
    }, [blockLocation]);

    // Check Welcome Referral Popup
    useEffect(() => {
        const checkReferralPopup = async () => {
            if (!userId) return;
            try {
                // Fetch public settings
                const settingsRes = await api.get("/system/settings");
                const publicSettings = settingsRes.data;
                setSettings(publicSettings);

                // Check General Announcement Popup
                if (publicSettings.generalPopupEnabled === true || publicSettings.generalPopupEnabled === "true") {
                    const dismissedMsg = localStorage.getItem("dismissedGeneralPopupMessage");
                    if (publicSettings.generalPopupMessage && dismissedMsg !== publicSettings.generalPopupMessage) {
                        setShowGeneralPopup(true);
                    }
                }

                // Fetch user orders to see if this is their first order
                const ordersRes = await api.get("/pdf/userOrders", { params: { userId } });
                const userOrders = ordersRes.data || [];
                const hasPaidOrders = userOrders.some(o => o.paymentStatus === "PAID");

                const shown = sessionStorage.getItem("referralWelcomeShown");
                if (publicSettings.referralEnabled && publicSettings.popupEnabled && !hasPaidOrders && !shown) {
                    sessionStorage.setItem("referralWelcomeShown", "true");
                    showAlert(
                        "🎉 Welcome Offer!",
                        publicSettings.popupMessage || `Refer your friends and earn rewards! Your code is: ${referralCode}`,
                        "success"
                    );
                }
            } catch (err) {
                console.error("Error checking welcome popup", err);
            }
        };
        checkReferralPopup();
    }, [userId, referralCode]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        setUploaded(false); // Reset if new files selected
    };

    const uploadPdf = async () => {
        if (selectedFiles.length === 0) {
            showAlert("No Files Selected", "Please select PDF or image files to upload.", "warning");
            return;
        }

        const formData = new FormData();
        if (selectedFiles.length === 1) {
            formData.append("file", selectedFiles[0]);
        } else {
            selectedFiles.forEach((file) => {
                formData.append("files", file);
            });
        }
        formData.append("userId", userId);
        formData.append("customerName", userName || "Customer");
        formData.append("blockLocation", blockLocation);

        setUploading(true);
        try {
            const response = await api.post(
                "/pdf/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setTotalPages(response.data.totalPages);
            setOrderId(response.data.orderId);
            setUploaded(true);
            showAlert("Success", "Files processed and uploaded successfully!", "success");
        } catch (error) {
            console.error(error);
            showAlert("Upload Failed", "Could not upload and process the files.", "error");
        } finally {
            setUploading(false);
        }
    };

    const fetchPrices = async () => {
        try {
            const response = await api.get("/pricing/all", {
                params: { blockLocation }
            });

            response.data.forEach((p) => {
                if (p.printType === "BW") {
                    setBwPrice(p.pricePerPage);
                }
                if (p.printType === "COLOR") {
                    setColorPrice(p.pricePerPage);
                }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const proceedToOrder = async () => {
        if (!uploaded) {
            showAlert("Files Not Uploaded", "Please upload selected files first.", "warning");
            return;
        }

        if (selectedPagesList.length === 0) {
            showAlert("No Pages Selected", "Please select at least one page to print.", "warning");
            return;
        }

        if (isLowPaper) {
            showAlert("Low Paper Level", "Print cannot be done due to low paper levels in this block.", "error");
            return;
        }

        let selectedPagesStr = "ALL";
        if (selectedPagesList.length !== totalPages) {
            const sorted = [...selectedPagesList].sort((a, b) => a - b);
            selectedPagesStr = sorted.join(",");
        }

        try {
            await api.post(
                "/pdf/updateOrder",
                null,
                {
                    params: {
                        orderId,
                        copies,
                        printType,
                        blockLocation,
                        selectedPages: selectedPagesStr
                    }
                }
            );

            localStorage.setItem(
                "order",
                JSON.stringify({
                    orderId,
                    copies,
                    printType,
                    blockLocation,
                    totalPages,
                    price: estimatedTotal,
                    selectedPages: selectedPagesStr
                })
            );

            navigate("/checkout");
        } catch (error) {
            console.error(error);
            showAlert("Order Failed", "Unable to create order.", "error");
        }
    };

    const handleSupportSubmit = async (e) => {
        e.preventDefault();
        if (!supportName || !supportEmail || !supportMessage) {
            showAlert("Required Fields Missing", "Please fill in all fields.", "warning");
            return;
        }

        setSupportSubmitting(true);
        try {
            // 1. Save in Database
            await api.post("/support/create", {
                name: supportName,
                email: supportEmail,
                message: supportMessage
            });

            // 2. Send free email using formsubmit.co
            await axios.post("https://formsubmit.co/ajax/saipraveendasari2@gmail.com", {
                name: supportName,
                email: supportEmail,
                message: supportMessage,
                _subject: "New Cloud Print Support Request"
            });

            showAlert("Ticket Created", "Support request submitted successfully! We will get back to you via email.", "success");
            setSupportMessage("");
        } catch (err) {
            console.error(err);
            showAlert("Error", "Failed to submit support request. Please try again.", "error");
        } finally {
            setSupportSubmitting(false);
        }
    };

    const handleClaimReward = async (e) => {
        e.preventDefault();
        if (!rewardCode.trim()) {
            showAlert("Required Code", "Please enter a reward claim code.", "warning");
            return;
        }

        setClaimingReward(true);
        try {
            const response = await api.post("/rewards/claim", null, {
                params: {
                    userId,
                    claimCode: rewardCode.trim()
                }
            });

            if (response.data.success) {
                showAlert("Claim Successful 🎉", response.data.message || "Wallet balance credited successfully!", "success");
                setRewardCode("");
                getWalletBalance(userId).then(setWalletBalance);
            } else {
                showAlert("Failed", response.data.message || "Invalid claim code", "error");
            }
        } catch (error) {
            console.error(error);
            showAlert("Claim Failed", error.response?.data?.message || "Invalid or already claimed reward code.", "error");
        } finally {
            setClaimingReward(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            await api.post("/pdf/cancelOrder", null, {
                params: { orderId, userId }
            });
            showAlert("Order Cancelled", "Your order has been cancelled successfully. Refund has been credited to your wallet.", "success");
            fetchOrders();
            getWalletBalance(userId).then(setWalletBalance);
        } catch (err) {
            console.error(err);
            showAlert("Cancellation Failed", err.response?.data?.message || "Could not cancel the order.", "error");
        }
    };

    const handleLogout = () => {
        clearUserSession();
        navigate("/");
    };

    const rate = printType === "COLOR" ? Number(colorPrice) : Number(bwPrice);
    const selectedPageCount = selectedPagesList.length;
    const estimatedTotalPages = selectedPageCount * Number(copies || 1);
    const isLowPaper = uploaded && estimatedTotalPages > paperCount;
    const estimatedTotal = selectedPageCount * Number(copies || 1) * rate;
    const isPrintingDisabled = !systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured || isLowPaper || systemStatus.maintenance;

    const displayAdText = settings.adEnabled && settings.adText ? settings.adText.replace("{referralCode}", referralCode) : "";

    const tabs = [
        { id: "print", label: "Print Dashboard", icon: "🖨️" },
        { id: "orders", label: "My Orders", icon: "📄" },
        { id: "coupons", label: "Coupons & Rewards", icon: "🎁" },
        { id: "support", label: "Support Desk", icon: "📞" }
    ];

    const orderStatusClass = (status) => {
        if (status === "CANCELLED") return "status-pill status-unpaid";
        if (status === "CANCEL_WINDOW" || status === "QUEUE") return "status-pill status-created";
        if (status === "COMPLETED") return "status-pill status-completed";
        if (status === "PRINTING") return "status-pill status-printing";
        return "status-pill status-created";
    };

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="Cloud Print Dashboard"
                    subtitle="Customer Workspace"
                    badge={blockLocation || "No block"}
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    actions={[
                        { label: `Wallet: ₹${walletBalance}`, onClick: () => setShowWalletModal(true), className: "btn success cursor-pointer !border-emerald-500 !bg-emerald-600/20 !text-emerald-400" },
                        { label: "Change Location", path: "/blocks", className: "btn secondary" }
                    ]}
                />

                {/* Non-intrusive Referral Advertisement Banner */}
                {displayAdText && (
                    <div style={{
                        background: "linear-gradient(90deg, #1e293b, #0f172a)",
                        border: "1px solid #0284c7",
                        color: "#cbd5e1",
                        padding: "8px 20px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        marginTop: "16px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 15px rgba(2, 132, 199, 0.15)"
                    }}>
                        <marquee scrollamount="4">
                            {displayAdText}
                        </marquee>
                    </div>
                )}

                {/* Maintenance mode marquee alert */}
                {systemStatus.maintenance && (
                    <div style={{
                        background: "#f97316",
                        color: "#ffffff",
                        padding: "10px 16px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        marginBottom: "16px",
                        boxShadow: "0 0 15px rgba(249, 115, 22, 0.3)"
                    }}>
                        <marquee scrollamount="4">
                            ⚠️ Please try again later as the machine is under maintenance.
                        </marquee>
                    </div>
                )}

                {/* Connectivity guards marquee alert */}
                {(!systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured) && (
                    <div style={{
                        background: "#ef4444",
                        color: "#ffffff",
                        padding: "10px 16px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        marginBottom: "16px",
                        boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)"
                    }}>
                        <marquee scrollamount="5">
                            connection is not available
                        </marquee>
                    </div>
                )}

                <motion.p
                    className="subtitle mb-6 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {userName ? `Signed in as ${userName}` : `User ID: ${userId}`}
                </motion.p>

                {/* TAB CONTENT: PRINT DASHBOARD */}
                {activeTab === "print" && (
                    <div className="flex flex-col gap-6">
                        {/* Real-time Active Order Tracking Card */}
                        {activeOrder && (
                            <motion.div 
                                className="panel p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-xl"
                                initial={{ opacity: 0, y: -15 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-700/60">
                                    <div>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                                            Active Order Live Tracking
                                        </span>
                                        <h3 className="text-xl font-black mt-2 text-white">{activeOrder.orderId}</h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{activeOrder.fileName}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`status-pill inline-block ${
                                            activeOrder.status === 'PRINTING' ? '!bg-emerald-500/20 !text-emerald-400 !border-emerald-500/30' :
                                            activeOrder.status === 'QUEUE' ? '!bg-amber-500/20 !text-amber-400 !border-amber-500/30' :
                                            '!bg-sky-500/20 !text-sky-400 !border-sky-500/30'
                                        }`}>
                                            {activeOrder.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar & Status Message */}
                                <div className="my-6">
                                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                                        <span>Status: {activeOrder.printProgress || "Waiting to release print"}</span>
                                        <span>{
                                            activeOrder.status === 'CANCEL_WINDOW' ? '15%' :
                                            activeOrder.status === 'PENDING_SCAN' ? '40%' :
                                            activeOrder.status === 'QUEUE' ? '65%' :
                                            activeOrder.status === 'PRINTING' ? '85%' : '0%'
                                        }</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500" 
                                            style={{
                                                width: 
                                                    activeOrder.status === 'CANCEL_WINDOW' ? '15%' :
                                                    activeOrder.status === 'PENDING_SCAN' ? '40%' :
                                                    activeOrder.status === 'QUEUE' ? '65%' :
                                                    activeOrder.status === 'PRINTING' ? '85%' : '0%'
                                            }} 
                                        />
                                    </div>
                                </div>

                                {/* PENDING_SCAN OTP Release Alert with 10-min Countdown */}
                                {activeOrder.status === 'PENDING_SCAN' && (
                                    <div className="mt-4 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                        <div>
                                            <span className="block text-[10px] font-black uppercase tracking-widest text-sky-400">Scan Kiosk QR or Enter OTP</span>
                                            <p className="text-xs font-semibold text-slate-300 mt-1 leading-relaxed">
                                                Please scan the QR code at the printer kiosk or enter your OTP code on the display panel. If your print job is not released within 10 minutes, the order will be automatically cancelled and all funds refunded back to your wallet.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-start md:items-end shrink-0 bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 rounded-xl">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Release Time Left</span>
                                            <span className="text-2xl font-mono font-black text-rose-400 mt-0.5 animate-pulse">
                                                {scanCountdown || "10:00"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Queue Wait Time & Estimations */}
                                {estimates[activeOrder.orderId] && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-850 border border-slate-800 rounded-xl p-4 my-4">
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-slate-400">Queue Position</span>
                                            <p className="text-lg font-black text-white mt-0.5">
                                                #{estimates[activeOrder.orderId].queuePosition} of {estimates[activeOrder.orderId].queuePosition + estimates[activeOrder.orderId].totalPagesAhead / 5}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-slate-400">Pages Ahead</span>
                                            <p className="text-lg font-black text-white mt-0.5">
                                                {estimates[activeOrder.orderId].totalPagesAhead} pages
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-slate-400">Your Sheets</span>
                                            <p className="text-lg font-black text-white mt-0.5">
                                                {(() => {
                                                    let pageCount = activeOrder.totalPages || 0;
                                                    if (activeOrder.selectedPages && activeOrder.selectedPages !== "ALL") {
                                                        let count = 0;
                                                        const parts = activeOrder.selectedPages.split(",");
                                                        for (const part of parts) {
                                                            const pagePart = part.trim();
                                                            if (!pagePart) continue;
                                                            if (pagePart.includes("-")) {
                                                                const range = pagePart.split("-").map(Number);
                                                                if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
                                                                    count += Math.max(0, range[1] - range[0] + 1);
                                                                } else {
                                                                    count += 1;
                                                                }
                                                            } else {
                                                                if (!isNaN(Number(pagePart))) {
                                                                    count += 1;
                                                                }
                                                            }
                                                        }
                                                        pageCount = count > 0 ? count : 1;
                                                    }
                                                    return pageCount * (activeOrder.copies || 1);
                                                })()} sheets
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-slate-400">Est. Wait Time</span>
                                            <p className="text-lg font-black text-emerald-400 mt-0.5">
                                                ~{estimates[activeOrder.orderId].estimatedWaitTimeMinutes} min
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Automatic Traffic Load Balancing Suggestions */}
                                {suggestions.length > 0 && (
                                    <div className="mt-4 border-t border-slate-850 pt-4">
                                        <span className="block text-xs font-black uppercase text-rose-400 tracking-wider mb-2">
                                            ⚠️ Traffic Alert & Alternative Printers
                                        </span>
                                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                                            The selected printer is busy or low on paper. For faster printing, consider submitting your file to these locations:
                                        </p>
                                        <div className="grid gap-2">
                                            {suggestions.slice(0, 2).map((sug, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-slate-800 p-2.5 rounded-lg border border-slate-700/60 text-xs">
                                                    <div>
                                                        <span className="font-black text-white">{sug.blockLocation}</span>
                                                        <span className="text-slate-400 ml-2">({sug.printerName})</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-emerald-400 font-bold">~{sug.estimatedWaitTimeMinutes} min wait</span>
                                                        <button
                                                            onClick={() => {
                                                                localStorage.setItem("selectedBlock", sug.blockLocation);
                                                                window.location.reload();
                                                            }}
                                                            className="btn secondary !py-1 !px-2.5 !text-[10px] !min-h-[22px] !border-slate-650 !bg-slate-800 text-white"
                                                        >
                                                            Switch Location
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <motion.section
                            className="panel p-6"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="section-header">
                                <div>
                                    <p className="eyebrow">Step 1</p>
                                    <h2 className="text-2xl font-black text-slate-900">
                                        Upload PDFs / Images
                                    </h2>
                                </div>

                                <span className={uploaded ? "status-pill status-created" : "status-pill status-unpaid"}>
                                    {uploaded ? "Uploaded" : "Waiting"}
                                </span>
                            </div>

                            <div className="mb-4 text-left">
                                <span className="mb-2 block text-sm font-black text-slate-700">
                                    Printing Location
                                </span>
                                <div className="field">
                                    {blockLocation}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                {/* Left side: How to Upload Video */}
                                <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-slate-50 relative flex items-center justify-center p-1.5 h-[220px]">
                                    <video 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover rounded-lg shadow-sm"
                                    >
                                        <source src={howToUpload} type="video/mp4" />
                                    </video>
                                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/75 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-[10px] font-black uppercase tracking-wider text-center">
                                        🎬 Tutorial: How to Upload
                                    </div>
                                </div>

                                {/* Right side: Existing Upload Dropzone */}
                                <label 
                                    className="upload-zone block !mt-0 h-[220px] flex flex-col items-center justify-center p-4 cursor-pointer" 
                                    style={(!systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured) ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={(!systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured) || uploading}
                                    />

                                    <div className="flex flex-col items-center gap-2 text-center">
                                        {selectedFiles.length === 0 && (
                                            <div className="w-14 h-14 mb-2 flex items-center justify-center bg-slate-100 text-sky-500 rounded-2xl border border-slate-200/50 shadow-sm animate-bounce" style={{ animationDuration: '2.5s' }}>
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                                </svg>
                                            </div>
                                        )}
                                        <span className="text-sm font-black text-slate-900 leading-tight">
                                            {selectedFiles.length > 0 
                                                ? `${selectedFiles.length} file(s) selected`
                                                : "Choose files (PDF, PNG, JPG)"
                                            }
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500 leading-normal">
                                            Click here to select multiple files.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={uploadPdf}
                                className="btn mt-5 w-full"
                                disabled={(!systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured) || uploading || selectedFiles.length === 0}
                                style={((!systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured) || uploading || selectedFiles.length === 0) ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                            >
                                {uploading ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Processing and merging files, please wait...</span>
                                    </div>
                                ) : "Upload & Merge Files"}
                            </button>

                            <AnimatePresence>
                                {uploaded && (
                                    <motion.div
                                        className="mt-6 grid gap-4 rounded-lg border border-green-200 bg-green-50 p-4 sm:grid-cols-2"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                                Order ID
                                            </p>
                                            <p className="mt-1 text-xl font-black text-green-950">
                                                {orderId}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                                Customer
                                            </p>
                                            <p className="mt-1 text-xl font-black text-green-950">
                                                {userName || "Customer"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                                Total Pages
                                            </p>
                                            <p className="mt-1 text-xl font-black text-green-950">
                                                {totalPages}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                                Location
                                            </p>
                                            <p className="mt-1 text-xl font-black text-green-950">
                                                {blockLocation}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.section>

                        <motion.aside
                            className="panel p-6"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                        >
                            <p className="eyebrow">Live Pricing</p>
                            <h2 className="mt-2 text-2xl font-black text-slate-900">
                                Estimate
                            </h2>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-slate-100 p-4">
                                    <p className="text-sm font-bold text-slate-500">BW</p>
                                    <p className="mt-1 text-2xl font-black text-slate-900">Rs. {bwPrice}</p>
                                </div>

                                <div className="rounded-lg bg-slate-100 p-4">
                                    <p className="text-sm font-bold text-slate-500">Color</p>
                                    <p className="mt-1 text-2xl font-black text-slate-900">Rs. {colorPrice}</p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-lg bg-slate-900 p-5 text-white">
                                <p className="text-sm font-bold text-slate-300">Estimated Total</p>
                                <motion.p
                                    key={estimatedTotal}
                                    className="mt-2 text-4xl font-black"
                                    initial={{ scale: 0.96, opacity: 0.5 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    Rs. {estimatedTotal || 0}
                                </motion.p>
                            </div>

                            {/* Wallet Visual Card */}
                            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 flex items-center gap-4">
                                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm animate-pulse" style={{ animationDuration: '2s' }}>
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h1a2 2 0 012 2v2a2 2 0 01-2 2h-1m2-6h1a2 2 0 012 2v2a2 2 0 01-2 2h-1m-4-6v10m-3-3h12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="eyebrow">Your Wallet</p>
                                    <p className="text-xl font-black text-slate-900">₹{walletBalance}</p>
                                </div>
                            </div>

                            {/* Printer Info Panel */}
                            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <p className="eyebrow">Printer Details</p>
                                <h3 className="mt-1 text-sm font-black text-slate-900">
                                    {blockLocation} Status
                                </h3>
                                
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-500">Connection</span>
                                        <span className={`status-pill ${systemStatus.agentOnline ? 'status-completed' : 'status-unpaid'}`} style={{ minHeight: '20px', fontSize: '9px', padding: '2px 8px' }}>
                                            {systemStatus.agentOnline ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-500">Configured</span>
                                        <span className={`status-pill ${systemStatus.printerConfigured ? 'status-completed' : 'status-unpaid'}`} style={{ minHeight: '20px', fontSize: '9px', padding: '2px 8px' }}>
                                            {systemStatus.printerConfigured ? 'YES' : 'NO'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2 mt-2">
                                        <span className="font-bold text-slate-500">Paper Remaining</span>
                                        <span className={`font-black ${paperCount < 50 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                            {paperCount} sheets
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>

                        <AnimatePresence>
                            {uploaded && (
                                <motion.section
                                    className="panel mt-6 p-6 lg:col-span-2"
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 18 }}
                                >
                                    <div className="section-header">
                                        <div>
                                            <p className="eyebrow">Step 2</p>
                                            <h2 className="text-2xl font-black text-slate-900">
                                                Print Settings
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Low paper notification banner on dashboard */}
                                    {isLowPaper && (
                                        <div style={{
                                            background: "#ef4444",
                                            color: "#ffffff",
                                            padding: "10px 16px",
                                            borderRadius: "10px",
                                            fontSize: "13px",
                                            fontWeight: "bold",
                                            marginBottom: "16px",
                                            boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)"
                                        }}>
                                            <marquee scrollamount="4">⚠️ Print cannot be done due to low paper levels. Selected pages ({estimatedTotalPages}) exceed printer sheets ({paperCount}).</marquee>
                                        </div>
                                    )}

                                    <div className="grid gap-4 md:grid-cols-4">
                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-700">
                                                Copies
                                            </span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={copies}
                                                onChange={(e) => setCopies(e.target.value)}
                                                className="field"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-700">
                                                Print Type
                                            </span>
                                            <select
                                                value={printType}
                                                onChange={(e) => setPrintType(e.target.value)}
                                                className="field"
                                            >
                                                <option value="BW">Black & White</option>
                                                <option value="COLOR">Color</option>
                                            </select>
                                        </label>

                                        <label className="block">
                                            <span className="mb-2 block text-sm font-black text-slate-700">
                                                Pages
                                            </span>
                                            <select
                                                value={pageOption}
                                                onChange={(e) => handlePageOptionChange(e.target.value)}
                                                className="field"
                                            >
                                                <option value="ALL">All Pages</option>
                                                <option value="ODD">Odd Pages Only</option>
                                                <option value="EVEN">Even Pages Only</option>
                                                <option value="CUSTOM">Custom Selection</option>
                                            </select>
                                        </label>

                                        <div className="flex items-end">
                                            <button
                                                onClick={proceedToOrder}
                                                className="btn success w-full"
                                                disabled={isPrintingDisabled}
                                                style={isPrintingDisabled ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                                            >
                                                Proceed To Order
                                            </button>
                                        </div>
                                    </div>

                                    {/* Canvas Thumbnail Preview & Click-to-Select Page Selector */}
                                    {pdfDoc && (
                                        <div className="mt-6 border-t border-slate-100 pt-6">
                                            <span className="block text-sm font-black text-slate-700 mb-3">
                                                📄 Interactive Document Page Selector (Click pages to select/deselect)
                                            </span>
                                            <div className="flex gap-4 overflow-x-auto py-4 bg-slate-50 border border-slate-200/60 rounded-xl px-4 select-none">
                                                {renderedPreviews.map(pageNum => (
                                                    <PdfPageThumbnail
                                                        key={pageNum}
                                                        pdfDoc={pdfDoc}
                                                        pageNumber={pageNum}
                                                        isSelected={selectedPagesList.includes(pageNum)}
                                                        onToggle={() => togglePageSelection(pageNum)}
                                                    />
                                                ))}
                                                {totalPages > 12 && (
                                                    <div className="flex items-center justify-center p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300 text-slate-400 font-bold text-xs min-w-[100px]">
                                                        + {totalPages - 12} more pages
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <AnimatePresence>
                                        {pageOption === "CUSTOM" && (
                                            <motion.div
                                                className="mt-4"
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                            >
                                                <span className="block text-xs font-bold text-slate-500 mb-2">
                                                    Selected Page List (comma-separated or range format, e.g. "1,3,5" or "1-4,7")
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Enter custom selection (e.g. 1,3,5-7,9)"
                                                    value={selectedPagesList.join(",")}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        let list = [];
                                                        const parts = val.split(",");
                                                        for (const part of parts) {
                                                            const pagePart = part.trim();
                                                            if (!pagePart) continue;
                                                            if (pagePart.includes("-")) {
                                                                const range = pagePart.split("-").map(Number);
                                                                if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
                                                                    for (let p = range[0]; p <= range[1]; p++) {
                                                                        list.push(p);
                                                                    }
                                                                }
                                                            } else {
                                                                const num = Number(pagePart);
                                                                if (!isNaN(num)) {
                                                                    list.push(num);
                                                                }
                                                            }
                                                        }
                                                        setSelectedPagesList(list);
                                                    }}
                                                    className="field font-mono font-bold"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* Dynamic Announcements & Banners */}
                        {sections.length > 0 && (
                            <motion.section 
                                className="panel mt-6 p-6 lg:col-span-2"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header">
                                    <div>
                                        <p className="eyebrow">Announcements & Services</p>
                                        <h2 className="text-2xl font-black text-slate-900">Featured Updates & Promotions</h2>
                                    </div>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                                    {sections.map((sec, idx) => (
                                        <motion.div
                                            key={sec.id}
                                            className="block-card flex flex-col justify-between"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{
                                                borderColor: sec.sectionType === 'ADVERTISING' ? '#0ea5e9' : sec.sectionType === 'NEW_BLOCK' ? '#10b981' : '#8b5cf6',
                                                '--block-accent': sec.sectionType === 'ADVERTISING' ? '#0ea5e9' : sec.sectionType === 'NEW_BLOCK' ? '#10b981' : '#8b5cf6'
                                            }}
                                        >
                                            <div>
                                                <span className="status-pill mb-3" style={{
                                                    color: sec.sectionType === 'ADVERTISING' ? '#0284c7' : sec.sectionType === 'NEW_BLOCK' ? '#047857' : '#6d28d9',
                                                    background: sec.sectionType === 'ADVERTISING' ? '#e0f2fe' : sec.sectionType === 'NEW_BLOCK' ? '#d1fae5' : '#f3e8ff',
                                                    fontSize: '10px',
                                                    minHeight: '20px',
                                                    padding: '2px 8px'
                                                }}>
                                                    {sec.sectionType}
                                                </span>
                                                <h3 className="block-card-title mt-2 text-xl font-bold text-slate-900">{sec.title}</h3>
                                                <p className="block-card-text text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">{sec.content}</p>
                                            </div>
                                            {sec.redirectUrl && (
                                                <a href={sec.redirectUrl} target="_blank" rel="noopener noreferrer" className="block-card-cta mt-4 inline-block hover:underline">
                                                    Learn More →
                                                </a>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}
                    </div>
                    </div>
                )}

                {/* TAB CONTENT: MY ORDERS */}
                {activeTab === "orders" && (
                    <div className="relative">
                        {loadingOrders && (
                            <div className="absolute inset-0 z-30 min-h-[300px] flex flex-col items-center justify-center bg-white/95 rounded-2xl border border-slate-100 flex-1 py-12">
                                <div className="w-24 h-24 mb-4 relative rounded-xl overflow-hidden shadow-md border border-slate-100 bg-slate-50 flex items-center justify-center">
                                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                        <source src={ordersLoading} type="video/mp4" />
                                    </video>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-1">Loading Order History...</h3>
                                <p className="text-xs font-semibold text-slate-500">Checking physical queue spooler status</p>
                            </div>
                        )}
                        
                        <div className="grid lg:grid-cols-[1.45fr_0.55fr] gap-6 items-start" style={loadingOrders ? { filter: 'blur(3px)', opacity: 0.65, pointerEvents: 'none' } : {}}>
                            {/* Left Side: Order History Table */}
                            <motion.section
                                className="panel p-6 overflow-x-auto !mb-0"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="section-header mb-6">
                                    <div>
                                        <p className="eyebrow">Track Status</p>
                                        <h2 className="text-2xl font-black text-slate-900">Order History</h2>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                        Auto-refreshing every 3s
                                    </span>
                                </div>

                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Location</th>
                                            <th>Pages</th>
                                            <th>Copies</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, index) => (
                                            <motion.tr
                                                key={order.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <td className="font-black">{order.orderId}</td>
                                                <td>{order.blockLocation || "C Block"}</td>
                                                <td>{order.selectedPages}</td>
                                                <td>{order.copies}</td>
                                                <td className="font-black">Rs. {order.price}</td>
                                                <td className="flex items-center gap-2">
                                                     <span className={orderStatusClass(order.status)}>
                                                         {order.status}
                                                     </span>
                                                     {order.status === "PRINTING" && (
                                                         <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                                                             <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                             </svg>
                                                             <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">printing</span>
                                                         </div>
                                                     )}
                                                 </td>
                                                <td>
                                                    {order.status === "CANCEL_WINDOW" && (
                                                        <button
                                                            onClick={() => handleCancelOrder(order.orderId)}
                                                            className="btn danger"
                                                            style={{ padding: "4px 8px", fontSize: "12px", minHeight: "28px" }}
                                                        >
                                                            Cancel Print
                                                        </button>
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
                                                            onClick={() => setActiveTab("print")}
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

                            {/* Right Side: Visual Queue tracking video panel */}
                            <motion.section 
                                className="panel p-6 flex flex-col items-center justify-center text-center !mb-0"
                                initial={{ opacity: 0, x: 18 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                            >
                                <p className="eyebrow">Realtime Queue</p>
                                <h3 className="text-lg font-black text-slate-900 mb-4">Print Hub Status</h3>
                                
                                <div className="w-full max-w-[200px] h-[200px] rounded-xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 relative flex items-center justify-center p-1">
                                    <video 
                                        autoPlay 
                                        loop 
                                        muted 
                                        playsInline 
                                        className="w-full h-full object-cover rounded-lg shadow-sm"
                                    >
                                        <source src={myOrdersVideo} type="video/mp4" />
                                    </video>
                                </div>
                                
                                <p className="text-xs font-bold text-slate-500 mt-4 leading-relaxed">
                                    Your orders are automatically sent to the physical print spooler queue. Refresh status occurs automatically.
                                </p>
                            </motion.section>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: COUPONS & REWARDS */}
                {activeTab === "coupons" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Referral Stats Panel */}
                        <motion.section
                            className="panel p-6 flex flex-col justify-between"
                            initial={{ opacity: 0, x: -18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div>
                                <p className="eyebrow">Refer & Earn</p>
                                <h2 className="text-2xl font-black text-slate-900 mt-1 mb-4">Share the Service</h2>
                                
                                <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
                                    Invite your friends to try Cloud Print! When they register using your custom link or enter your referral customer ID on their first checkout, you earn <span className="text-emerald-500 font-bold">Rs. 10</span> and they get <span className="text-cyan-500 font-bold">Rs. 5</span> in wallet balance credits.
                                </p>

                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Referral ID / Code</span>
                                    <div className="flex items-center justify-between mt-2 gap-3">
                                        <code className="text-2xl font-black text-slate-900 select-all tracking-wider">
                                            {referralCode || userId || "N/A"}
                                        </code>
                                        {referralCode && (
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(referralCode);
                                                    showAlert("Copied!", "Referral code copied to clipboard", "success");
                                                }}
                                                className="btn secondary"
                                                style={{ minHeight: "36px", padding: "6px 12px" }}
                                            >
                                                Copy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200/60 p-3 rounded-lg">
                                ℹ️ Note: Credits are added instantly after the referred customer places their first paid print order.
                            </div>
                        </motion.section>

                        {/* Claim Promo Code Panel */}
                        <motion.section
                            className="panel p-6"
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <p className="eyebrow">Claim Credit</p>
                            <h2 className="text-2xl font-black text-slate-900 mt-1 mb-4">Redeem Rewards</h2>
                            
                            <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
                                Received a promo card, code, or special administrator voucher? Enter the claim code below to deposit reward balance directly into your wallet.
                            </p>

                             <div className="flex justify-center mb-5">
                                 <div className="w-16 h-16 flex items-center justify-center bg-purple-50 text-purple-600 rounded-2xl border border-purple-100/50 shadow-sm animate-bounce" style={{ animationDuration: '2s' }}>
                                     <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                         <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125V8.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                     </svg>
                                 </div>
                             </div>

                             <form onSubmit={handleClaimReward} className="space-y-4">
                                <label className="block">
                                    <span className="block text-sm font-bold text-slate-700 mb-2">Claim Code / Voucher Code</span>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. SAVE100, FREE50, ADMINREWARD" 
                                        className="field uppercase tracking-wider font-mono font-black"
                                        value={rewardCode}
                                        onChange={(e) => setRewardCode(e.target.value)}
                                        required
                                    />
                                </label>

                                <button 
                                    type="submit" 
                                    className="btn success w-full mt-2" 
                                    disabled={claimingReward}
                                >
                                    {claimingReward ? "Verifying code..." : "Redeem Code"}
                                </button>
                            </form>
                        </motion.section>
                    </div>
                )}

                {/* TAB CONTENT: SUPPORT DESK */}
                {activeTab === "support" && (
                    <motion.section
                        className="panel p-6 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="eyebrow">Help & Feedback</p>
                        <h2 className="text-2xl font-black text-slate-900 mt-1 mb-2">📞 Support Desk</h2>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Submit your request below. Tickets will be processed by our administration. Once solved, work related mails are dispatched to <span className="font-bold text-sky-600">saipraveendasari2@gmail.com</span>, and we will contact you back immediately.
                        </p>

                        <form onSubmit={handleSupportSubmit} className="space-y-4">
                            <label className="block">
                                <span className="block text-sm font-bold text-slate-700 mb-1">Your Name</span>
                                <input 
                                    type="text" 
                                    className="field w-full font-bold" 
                                    value={supportName} 
                                    onChange={(e) => setSupportName(e.target.value)}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-bold text-slate-700 mb-1">Email Address</span>
                                <input 
                                    type="email" 
                                    className="field w-full font-bold" 
                                    value={supportEmail} 
                                    onChange={(e) => setSupportEmail(e.target.value)}
                                    required
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-bold text-slate-700 mb-1">Inquiry / Message</span>
                                <textarea 
                                    className="field w-full min-h-[120px]" 
                                    placeholder="Explain your problem, request refunds, or query order details..."
                                    value={supportMessage} 
                                    onChange={(e) => setSupportMessage(e.target.value)}
                                    required
                                />
                            </label>

                            <button 
                                type="submit" 
                                className="btn success w-full mt-4" 
                                disabled={supportSubmitting}
                            >
                                {supportSubmitting ? "Submitting request, please wait..." : "Submit Support Request"}
                            </button>
                        </form>
                    </motion.section>
                )}
            </div>

            {/* Privacy Policy Modal */}
            <AnimatePresence>
                {showPrivacyNotice && (
                    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
                        <motion.div
                            className="relative my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 cursor-grab active:cursor-grabbing touch-none"
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.6}
                            onDragEnd={(event, info) => {
                                if (Math.abs(info.offset.y) > 140 || Math.abs(info.offset.x) > 140) {
                                    if (dontShowAgain) {
                                        localStorage.setItem("dontShowPrivacyNotice", "true");
                                    }
                                    setShowPrivacyNotice(false);
                                }
                            }}
                            initial={{ scale: 0.93, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        >
                            <div className="w-12 h-1.5 bg-slate-200 hover:bg-slate-300 transition-colors rounded-full mx-auto mb-4 cursor-grab" />
                            <div className="text-[10px] text-center font-bold tracking-wider uppercase text-slate-400 mb-2 select-none">
                                Swipe or drag away to dismiss
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black shadow-inner mb-4 text-sky-500 bg-sky-50 border-sky-100">
                                    🔒
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2">
                                    Privacy & Data Policy
                                </h3>

                                <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
                                    Your data safety is our top priority. Only order IDs and configurations are saved in our database. To protect your privacy and reduce storage, all uploaded PDF and image files are completely and permanently deleted from our servers immediately after printing.
                                </p>

                                <label className="flex items-center gap-2 mb-6 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                                        checked={dontShowAgain}
                                        onChange={(e) => setDontShowAgain(e.target.checked)}
                                    />
                                    <span className="text-xs font-bold text-slate-600">Don't show this message again</span>
                                </label>

                                <button
                                    onClick={() => {
                                        if (dontShowAgain) {
                                            localStorage.setItem("dontShowPrivacyNotice", "true");
                                        }
                                        setShowPrivacyNotice(false);
                                    }}
                                    className="btn w-full success"
                                >
                                    I Understand
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* General Announcement Modal */}
            <AnimatePresence>
                {showGeneralPopup && (
                    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
                        <motion.div
                            className="relative my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 cursor-grab active:cursor-grabbing touch-none"
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.6}
                            onDragEnd={(event, info) => {
                                if (Math.abs(info.offset.y) > 140 || Math.abs(info.offset.x) > 140) {
                                    if (dontShowGeneralPopupAgain) {
                                        localStorage.setItem("dismissedGeneralPopupMessage", settings.generalPopupMessage);
                                    }
                                    setShowGeneralPopup(false);
                                }
                            }}
                            initial={{ scale: 0.93, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        >
                            <div className="w-12 h-1.5 bg-slate-200 hover:bg-slate-300 transition-colors rounded-full mx-auto mb-4 cursor-grab" />
                            <div className="text-[10px] text-center font-bold tracking-wider uppercase text-slate-400 mb-2 select-none">
                                Swipe or drag away to dismiss
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black shadow-inner mb-4 text-indigo-500 bg-indigo-50 border-indigo-100">
                                    📢
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2">
                                    Announcement
                                </h3>

                                <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed whitespace-pre-line">
                                    {settings.generalPopupMessage}
                                </p>

                                <label className="flex items-center gap-2 mb-6 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                        checked={dontShowGeneralPopupAgain}
                                        onChange={(e) => setDontShowGeneralPopupAgain(e.target.checked)}
                                    />
                                    <span className="text-xs font-bold text-slate-600">Don't show this announcement again</span>
                                </label>

                                <button
                                    onClick={() => {
                                        if (dontShowGeneralPopupAgain) {
                                            localStorage.setItem("dismissedGeneralPopupMessage", settings.generalPopupMessage);
                                        }
                                        setShowGeneralPopup(false);
                                    }}
                                    className="btn w-full success"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Uploading Status Popup Modal */}
            <AnimatePresence>
                {uploading && (
                    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full my-auto shadow-2xl border border-slate-100 flex flex-col items-center text-center"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Uploading Video Loop */}
                            <div className="w-32 h-32 mb-6 relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
                                <video 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                >
                                    <source src={fileUploading} type="video/mp4" />
                                </video>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-950 mb-2">Processing & Uploading...</h3>
                            <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
                                Please wait while your files are uploaded, compiled, and merged. Do not close or refresh this tab.
                            </p>
                            
                            {/* Animated Loading Bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                                <div className="absolute top-0 bottom-0 left-0 bg-sky-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Wallet Details Popup Modal */}
            <AnimatePresence>
                {showWalletModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div 
                            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full my-auto shadow-2xl border border-slate-100 flex flex-col items-center text-center relative"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.3 }}
                        >
                            <button 
                                onClick={() => setShowWalletModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xl font-bold"
                            >
                                ✕
                            </button>

                            {/* Wallet Coins Video Loop */}
                            <div className="w-32 h-32 mb-6 relative rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
                                <video 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                >
                                    <source src={walletVideo} type="video/mp4" />
                                </video>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-955 mb-2">My Printing Wallet</h3>
                            <p className="text-sm font-semibold text-slate-500 mb-6 leading-relaxed">
                                Deposit funds to pay for your print orders instantly.
                            </p>
                            
                            {/* Balance Card */}
                            <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex flex-col items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Available Balance</span>
                                <span className="text-3xl font-black text-emerald-950 mt-1">₹{walletBalance}</span>
                            </div>

                            {/* Transaction History Section */}
                            <div className="w-full text-left my-4 border-t border-slate-100 pt-4 flex flex-col flex-1">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Transaction Ledger
                                </span>
                                
                                {loadingTransactions ? (
                                    <div className="text-center py-6 text-xs text-slate-400 font-bold">
                                        Loading ledger...
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                                        No recent transactions.
                                    </div>
                                ) : (
                                    <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                                        {transactions.map((tx) => {
                                            const orderId = extractOrderId(tx.description);
                                            return (
                                                <div key={tx.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                                                    <div>
                                                        <div className="flex items-center gap-1.5 font-black text-slate-800">
                                                            <span className={`w-2 h-2 rounded-full ${
                                                                tx.amount > 0 ? "bg-emerald-505" : "bg-rose-500"
                                                            }`} />
                                                            {tx.type}
                                                        </div>
                                                        <p className="text-[10px] text-slate-505 text-slate-500 font-semibold mt-0.5">{tx.description}</p>
                                                        <p className="text-[9px] text-slate-400 mt-0.5">
                                                            {new Date(tx.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-right pl-2 whitespace-nowrap">
                                                        <span className={`font-black ${
                                                            tx.amount > 0 ? "text-emerald-600" : "text-rose-600"
                                                        }`}>
                                                            {tx.amount > 0 ? "+" : ""}₹{tx.amount}
                                                        </span>
                                                        {orderId && (
                                                            <button
                                                                onClick={() => downloadReceipt(orderId)}
                                                                title="Download Invoice/Receipt"
                                                                className="p-1 rounded bg-slate-200 hover:bg-slate-350 hover:bg-slate-300 text-slate-700 font-bold cursor-pointer transition-colors"
                                                            >
                                                                📥
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Add Balance Mockup Action */}
                            <div className="w-full space-y-3">
                                <button
                                    onClick={() => {
                                        setShowWalletModal(false);
                                        setActiveTab("coupons");
                                    }}
                                    className="btn w-full"
                                >
                                    Redeem Reward Vouchers
                                </button>
                                <button 
                                    onClick={() => setShowWalletModal(false)}
                                    className="btn secondary w-full"
                                >
                                    Close Wallet
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Premium Modal */}
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

function PdfPageThumbnail({ pdfDoc, pageNumber, isSelected, onToggle }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!pdfDoc) return;
        pdfDoc.getPage(pageNumber).then(page => {
            const viewport = page.getViewport({ scale: 0.25 });
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            page.render(renderContext);
        });
    }, [pdfDoc, pageNumber]);

    return (
        <div 
            onClick={onToggle}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all cursor-pointer select-none min-w-[90px] ${
                isSelected 
                    ? "border-sky-500 bg-sky-500/5 shadow-md" 
                    : "border-slate-200 bg-white opacity-60 hover:opacity-100"
            }`}
        >
            <canvas ref={canvasRef} className="rounded border border-slate-200 bg-white w-16 h-20 object-cover" />
            <span className="text-[10px] font-bold text-slate-500">Page {pageNumber}</span>
        </div>
    );
}

export default Dashboard;
