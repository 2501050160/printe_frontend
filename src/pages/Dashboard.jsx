import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getWalletBalance } from "../services/auth";

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
    const [file, setFile] = useState(null);

    const [totalPages, setTotalPages] = useState(0);
    const [orderId, setOrderId] = useState("");
    const [uploaded, setUploaded] = useState(false);
    const [copies, setCopies] = useState(1);
    const [pageOption, setPageOption] = useState("ALL");
    const [startPage, setStartPage] = useState("");
    const [endPage, setEndPage] = useState("");

    // Additional States
    const [uploading, setUploading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportName, setSupportName] = useState(userName || "");
    const [supportEmail, setSupportEmail] = useState(userEmail || "");
    const [supportMessage, setSupportMessage] = useState("");
    const [supportSubmitting, setSupportSubmitting] = useState(false);

    const [systemStatus, setSystemStatus] = useState({
        databaseConnected: true,
        agentOnline: true,
        printerConfigured: true
    });

    useEffect(() => {
        if (userId) {
            getWalletBalance(userId).then(setWalletBalance);
        }
    }, [userId]);

    useEffect(() => {
        fetchPrices();
    }, []);

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
        };
        if (blockLocation) {
            checkStatus();
            const interval = setInterval(checkStatus, 8000);
            return () => clearInterval(interval);
        }
    }, [blockLocation]);

    const uploadPdf = async () => {
        if (!file) {
            alert("Please select a PDF");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
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
            alert("PDF Uploaded Successfully");
        } catch (error) {
            console.error(error);
            alert("Upload Failed");
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
            alert("Upload PDF First");
            return;
        }

        if (pageOption === "CUSTOM") {
            const start = parseInt(startPage);
            const end = parseInt(endPage);

            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                alert(`Pages must be between 1 and ${totalPages}`);
                return;
            }
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
                        selectedPages:
                            pageOption === "ALL"
                                ? "ALL"
                                : `${startPage}-${endPage}`
                    }
                }
            );

            let pagesToPrint = pageOption === "ALL" ? totalPages : (parseInt(endPage) - parseInt(startPage) + 1);
            const rate = printType === "COLOR" ? Number(colorPrice) : Number(bwPrice);
            const price = pagesToPrint * Number(copies) * rate;

            localStorage.setItem(
                "order",
                JSON.stringify({
                    orderId,
                    copies,
                    printType,
                    blockLocation,
                    totalPages,
                    price,
                    selectedPages:
                        pageOption === "ALL"
                            ? "ALL"
                            : `${startPage}-${endPage}`
                })
            );

            navigate("/checkout");
        } catch (error) {
            console.error(error);
            alert("Unable to Create Order");
        }
    };

    const handleSupportSubmit = async (e) => {
        e.preventDefault();
        if (!supportName || !supportEmail || !supportMessage) {
            alert("Please fill in all fields");
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

            alert("Support request submitted successfully! We will get back to you via email.");
            setSupportMessage("");
            setShowSupportModal(false);
        } catch (err) {
            console.error(err);
            alert("Failed to submit support request. Please try again.");
        } finally {
            setSupportSubmitting(false);
        }
    };

    const rate = printType === "COLOR" ? Number(colorPrice) : Number(bwPrice);
    const selectedPageCount = pageOption === "ALL" ? totalPages : (startPage && endPage ? Math.max(0, Number(endPage) - Number(startPage) + 1) : 0);
    const estimatedTotal = selectedPageCount * Number(copies || 1) * rate;
    const isPrintingDisabled = !systemStatus.databaseConnected || !systemStatus.agentOnline || !systemStatus.printerConfigured;

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="Cloud Print Dashboard"
                    subtitle="Customer Workspace"
                    badge={blockLocation || "No block"}
                    actions={[
                        { label: `Wallet: ₹${walletBalance}`, path: "#", className: "btn success cursor-default !border-emerald-500 !bg-emerald-600/20 !text-emerald-400" },
                        { label: "📞 Support", onClick: () => setShowSupportModal(true), className: "btn info !border-cyan-500 !bg-cyan-600/20 !text-cyan-400" },
                        { label: "My Orders", path: "/my-orders" },
                        { label: "Change Block", path: "/blocks", className: "btn secondary" }
                    ]}
                />

                {/* Non-intrusive Referral Advertisement Banner */}
                <div style={{
                    background: "linear-gradient(90deg, #1e293b, #0f172a)",
                    border: "1px solid #0284c7",
                    color: "#cbd5e1",
                    padding: "8px 20px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 15px rgba(2, 132, 199, 0.15)"
                }}>
                    <marquee scrollamount="4">
                        🎉 REFER & EARN: Share your referral code <span style={{ color: "#38bdf8", background: "#0c4a6e", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace" }}>{referralCode}</span> with friends! They get ₹5 wallet credit on payment, and you get ₹10 directly in your wallet! 🎉
                    </marquee>
                </div>

                {/* Connectivity guards marquee alert */}
                {isPrintingDisabled && (
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
                            {!systemStatus.databaseConnected && "⚠️ Warning: Database connection is offline. System is currently disabled."}
                            {systemStatus.databaseConnected && !systemStatus.agentOnline && `⚠️ Warning: Print Agent for ${blockLocation} is currently OFFLINE. Printing is temporarily disabled.`}
                            {systemStatus.databaseConnected && systemStatus.agentOnline && !systemStatus.printerConfigured && `⚠️ Warning: No active printer is assigned to ${blockLocation}. Printing is temporarily disabled.`}
                        </marquee>
                    </div>
                )}

                <motion.p
                    className="subtitle mb-6 -mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {userName ? `Signed in as ${userName}` : `User ID: ${userId}`}
                </motion.p>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <motion.section
                        className="panel p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.45 }}
                    >
                        <div className="section-header">
                            <div>
                                <p className="eyebrow">Step 1</p>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Upload PDF
                                </h2>
                            </div>

                            <span className={uploaded ? "status-pill status-created" : "status-pill status-unpaid"}>
                                {uploaded ? "Uploaded" : "Waiting"}
                            </span>
                        </div>

                        <label 
                            className="upload-zone block" 
                            style={isPrintingDisabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                        >
                            <div className="mb-5 text-left">
                                <span className="mb-2 block text-sm font-black text-slate-700">
                                    Printing Location
                                </span>
                                <div className="field">
                                    {blockLocation}
                                </div>
                            </div>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => !isPrintingDisabled && setFile(e.target.files[0])}
                                className="hidden"
                                disabled={isPrintingDisabled || uploading}
                            />

                            <div className="flex flex-col gap-2 text-center">
                                <span className="text-lg font-black text-slate-900">
                                    {file ? file.name : "Choose a PDF file"}
                                </span>
                                <span className="text-sm font-semibold text-slate-500">
                                    Click this area to select the document.
                                </span>
                            </div>
                        </label>

                        <button
                            onClick={uploadPdf}
                            className="btn mt-5 w-full"
                            disabled={isPrintingDisabled || uploading || !file}
                            style={(isPrintingDisabled || uploading || !file) ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                        >
                            {uploading ? "Uploading document, please wait..." : "Upload PDF"}
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
                        transition={{ delay: 0.16, duration: 0.45 }}
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
                    </motion.aside>
                </div>

                <AnimatePresence>
                    {uploaded && (
                        <motion.section
                            className="panel mt-6 p-6"
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
                                        onChange={(e) => setPageOption(e.target.value)}
                                        className="field"
                                    >
                                        <option value="ALL">All Pages</option>
                                        <option value="CUSTOM">Custom Range</option>
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

                            <AnimatePresence>
                                {pageOption === "CUSTOM" && (
                                    <motion.div
                                        className="mt-4 grid gap-4 md:grid-cols-2"
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                    >
                                        <input
                                            type="number"
                                            min="1"
                                            max={totalPages}
                                            placeholder="Start Page"
                                            value={startPage}
                                            onChange={(e) => setStartPage(e.target.value)}
                                            className="field"
                                        />

                                        <input
                                            type="number"
                                            min="1"
                                            max={totalPages}
                                            placeholder="End Page"
                                            value={endPage}
                                            onChange={(e) => setEndPage(e.target.value)}
                                            className="field"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            {/* Support Modal */}
            <AnimatePresence>
                {showSupportModal && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="panel w-full max-w-lg p-6 mx-4 relative"
                            initial={{ scale: 0.95, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 16 }}
                            style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
                        >
                            <h3 className="text-2xl font-black text-slate-900 mb-2">📞 Customer Support</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Submit a request to the administrator. We will receive your message and respond directly via email.
                            </p>

                            <form onSubmit={handleSupportSubmit} className="space-y-4">
                                <label className="block">
                                    <span className="block text-sm font-bold text-slate-700 mb-1">Your Name</span>
                                    <input 
                                        type="text" 
                                        className="field w-full" 
                                        value={supportName} 
                                        onChange={(e) => setSupportName(e.target.value)}
                                        required
                                    />
                                </label>

                                <label className="block">
                                    <span className="block text-sm font-bold text-slate-700 mb-1">Email Address</span>
                                    <input 
                                        type="email" 
                                        className="field w-full" 
                                        value={supportEmail} 
                                        onChange={(e) => setSupportEmail(e.target.value)}
                                        required
                                    />
                                </label>

                                <label className="block">
                                    <span className="block text-sm font-bold text-slate-700 mb-1">Inquiry / Message</span>
                                    <textarea 
                                        className="field w-full min-h-[100px]" 
                                        placeholder="Explain your problem or request..."
                                        value={supportMessage} 
                                        onChange={(e) => setSupportMessage(e.target.value)}
                                        required
                                    />
                                </label>

                                <div className="flex gap-3 justify-end mt-6">
                                    <button 
                                        type="button" 
                                        className="btn secondary" 
                                        onClick={() => setShowSupportModal(false)}
                                        disabled={supportSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn success" 
                                        disabled={supportSubmitting}
                                    >
                                        {supportSubmitting ? "Submitting..." : "Submit Ticket"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default Dashboard;

