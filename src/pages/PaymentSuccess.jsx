import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { getWalletBalance } from "../services/auth";
import Navbar from "../components/Navbar";
import documentCloudVideo from "../assets/doccument_cloud.mp4";

function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("orderId");
    const userId = localStorage.getItem("userId");

    const [secondsLeft, setSecondsLeft] = useState(30);
    const [totalSeconds, setTotalSeconds] = useState(30);
    const [status, setStatus] = useState("CANCEL_WINDOW");
    const [cancelling, setCancelling] = useState(false);
    const [proceeding, setProceeding] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [fileName, setFileName] = useState("");
    const [blockLocation, setBlockLocation] = useState("");
    const [orderDetails, setOrderDetails] = useState(null);

    const otpRef = useRef("");
    const fileNameRef = useRef("");
    const blockLocationRef = useRef("");

    useEffect(() => {
        if (!orderId) return;
        const fetchOrderDetails = async () => {
            try {
                const response = await api.get("/pdf/details", {
                    params: { orderId }
                });
                setOrderDetails(response.data);
            } catch (err) {
                console.error("Failed to fetch order details for invoice:", err);
            }
        };
        fetchOrderDetails();
    }, [orderId]);

    const proceedOrder = async () => {
        if (proceeding) return;
        setProceeding(true);
        try {
            await api.post("/queue/proceed", null, {
                params: { orderId }
            });
            navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
        } catch (error) {
            console.error("Failed to proceed order:", error);
            navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
        } finally {
            setProceeding(false);
        }
    };

    useEffect(() => {
        if (!userId) {
            navigate("/");
            return;
        }

        if (!orderId) {
            navigate("/my-orders");
            return;
        }

        fetchWindowInfo();

        const interval = setInterval(() => {
            setSecondsLeft((current) => {
                if (current <= 1) {
                    clearInterval(interval);
                    navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
                    return 0;
                }
                return current - 1;
            });
        }, 1000);

        const poll = setInterval(fetchWindowInfo, 2000);

        return () => {
            clearInterval(interval);
            clearInterval(poll);
        };
    }, [orderId]);

    const fetchWindowInfo = async () => {
        try {
            const response = await api.get("/pdf/cancelWindow", {
                params: { orderId }
            });

            if (response.data.found) {
                setStatus(response.data.status);
                
                if (response.data.otpCode) {
                    setOtpCode(response.data.otpCode);
                    otpRef.current = response.data.otpCode;
                }
                if (response.data.fileName) {
                    setFileName(response.data.fileName);
                    fileNameRef.current = response.data.fileName;
                }
                if (response.data.blockLocation) {
                    setBlockLocation(response.data.blockLocation);
                    blockLocationRef.current = response.data.blockLocation;
                }

                if (response.data.secondsLeft != null) {
                    setSecondsLeft(response.data.secondsLeft);
                }

                if (response.data.cancelWindowSeconds) {
                    setTotalSeconds(response.data.cancelWindowSeconds);
                }

                if (response.data.status !== "CANCEL_WINDOW") {
                    navigate(`/blocks?orderId=${orderId}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const cancelOrder = async () => {
        if (cancelling) return;

        setCancelling(true);

        try {
            const response = await api.post("/pdf/cancelOrder", null, {
                params: { orderId, userId }
            });

            if (response.data.success) {
                await getWalletBalance(userId);
                alert(response.data.message);
                navigate("/my-orders");
                return;
            }

            alert(response.data.message || "Unable to cancel order");
        } catch (error) {
            console.error(error);
            alert("Unable to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    const progress =
        totalSeconds > 0
            ? ((totalSeconds - secondsLeft) / totalSeconds) * 100
            : 0;

    return (
        <main className="min-h-screen w-full flex flex-col bg-slate-50 m-0 p-0 overflow-hidden">
            {/* Navbar Area */}
            <div className="w-full px-4 py-4 z-50 absolute top-0 left-0 right-0">
                <Navbar
                    title="Payment Success"
                    subtitle="Order Confirmation"
                />
            </div>
            
            <div className="flex-1 w-full flex flex-col md:flex-row h-screen pt-24 md:pt-0">
                {/* Video Side (Full Width/Height of its container) */}
                <div className="w-full md:w-1/2 h-[40vh] md:h-full bg-black">
                    <video 
                        src={documentCloudVideo} 
                        autoPlay 
                        playsInline 
                        controls
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Details & Actions Side */}
                <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-center p-8 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-10 relative overflow-y-auto pb-24 md:pb-8">
                    <motion.div
                        className="w-full max-w-sm flex flex-col items-center text-center mt-4 md:mt-16"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="success-check-wrapper flex justify-center mb-6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
                        >
                            <div className="w-20 h-20 mx-auto relative flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100/50 shadow-[0_8px_24px_rgba(16,185,129,0.2)] animate-bounce" style={{ animationDuration: '2s' }}>
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </motion.div>

                        <p className="eyebrow">Payment Successful</p>
                        <h1 className="title text-3xl">Order Confirmed</h1>
                        <p className="subtitle mx-auto max-w-sm text-sm mt-2">
                            Order <strong>{orderId}</strong> is paid. You can cancel
                            within the countdown and the amount will be credited to your
                            wallet.
                        </p>

                        <div className="mx-auto mt-6 flex flex-col items-center">
                            <div
                                className="countdown-ring scale-90"
                                style={{
                                    background: `conic-gradient(#16865b ${progress}%, #e2e8f0 0)`
                                }}
                            >
                                <div className="countdown-ring-inner">
                                    <motion.span
                                        key={secondsLeft}
                                        className="countdown-number"
                                        initial={{ scale: 0.88, opacity: 0.5 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                    >
                                        {secondsLeft}
                                    </motion.span>
                                    <span className="countdown-label">seconds left</span>
                                </div>
                            </div>
                            <p className="mt-2 text-xs font-bold text-slate-500">
                                Status: {status}
                            </p>
                        </div>

                        <div className="mt-6 grid gap-3 grid-cols-2 w-full max-w-sm">
                            <button
                                onClick={cancelOrder}
                                disabled={cancelling || proceeding}
                                className="btn danger py-3 text-sm"
                            >
                                {cancelling ? "Cancelling..." : "Cancel"}
                            </button>
                            <button
                                onClick={proceedOrder}
                                disabled={proceeding || cancelling}
                                className="btn success py-3 text-sm"
                            >
                                {proceeding ? "Proceeding..." : "Proceed"}
                            </button>
                        </div>

                        {orderDetails && (
                            <button
                                onClick={() => window.print()}
                                className="btn secondary mt-4 w-full max-w-sm flex items-center justify-center gap-2 py-3 text-sm"
                            >
                                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Invoice
                            </button>
                        )}
                    </motion.div>
                </div>
            </div>

            {orderDetails && (
                <div id="printable-invoice">
                    <div className="invoice-box">
                        <div className="invoice-watermark">{orderDetails.orderId}</div>
                        <div className="invoice-stamp">VERIFIED</div>
                        
                        <div className="invoice-header">
                            <div className="invoice-logo">🖨️ CLOUD PRINT</div>
                            <div className="invoice-title">PAYMENT RECEIPT</div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <div className="invoice-row">
                                <span className="invoice-label">Order ID:</span>
                                <span className="invoice-val font-bold">{orderDetails.orderId}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Receipt Date:</span>
                                <span className="invoice-val">{new Date(orderDetails.uploadTime).toLocaleString()}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Transaction ID:</span>
                                <span className="invoice-val">{orderDetails.razorpayPaymentId || "N/A"}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Payment Method:</span>
                                <span className="invoice-val">{orderDetails.razorpayPaymentId === "WALLET" ? "Wallet Balance" : "Razorpay Online"}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Block Location:</span>
                                <span className="invoice-val font-bold">{orderDetails.blockLocation || "C Block"}</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <p className="invoice-subtitle">Document Info</p>
                            <div className="invoice-row">
                                <span className="invoice-label">File Name:</span>
                                <span className="invoice-val">{orderDetails.fileName}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Print Option:</span>
                                <span className="invoice-val">{orderDetails.printType}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Total Pages:</span>
                                <span className="invoice-val">{orderDetails.totalPages} pages</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Copies:</span>
                                <span className="invoice-val">{orderDetails.copies} copies</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-section">
                            <div className="invoice-row">
                                <span className="invoice-label">Original Price:</span>
                                <span className="invoice-val">Rs. {Number(orderDetails.originalPrice || orderDetails.price).toFixed(2)}</span>
                            </div>
                            <div className="invoice-row">
                                <span className="invoice-label">Discount Applied:</span>
                                <span className="invoice-val text-green-600">- Rs. {Number(orderDetails.discountAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="invoice-row invoice-total">
                                <span className="invoice-label">Total Paid:</span>
                                <span className="invoice-val">Rs. {Number(orderDetails.price).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="invoice-divider"></div>

                        <div className="invoice-footer">
                            <p>Thank you for using Cloud Print Self-Service Kiosk!</p>
                            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '8px' }}>This is a system generated digital receipt and does not require a physical signature.</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                #printable-invoice {
                    display: none;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible;
                    }
                    #printable-invoice {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #ffffff;
                        color: #000000;
                        padding: 20px;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .invoice-box {
                        max-width: 600px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        padding: 30px;
                        border-radius: 12px;
                        position: relative;
                        overflow: hidden;
                    }
                    .invoice-watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 60px;
                        font-weight: 900;
                        color: rgba(0, 0, 0, 0.04);
                        pointer-events: none;
                        white-space: nowrap;
                        z-index: 0;
                    }
                    .invoice-stamp {
                        position: absolute;
                        top: 60px;
                        right: 40px;
                        border: 4px solid #10b981;
                        color: #10b981;
                        font-size: 28px;
                        font-weight: 900;
                        font-family: 'Impact', sans-serif;
                        letter-spacing: 4px;
                        padding: 8px 16px;
                        transform: rotate(15deg);
                        border-radius: 8px;
                        opacity: 0.8;
                        pointer-events: none;
                        z-index: 10;
                    }
                    .invoice-header, .invoice-section, .invoice-divider, .invoice-total-row {
                        position: relative;
                        z-index: 1;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .invoice-logo {
                        font-size: 20px;
                        font-weight: 900;
                        color: #0f172a;
                    }
                    .invoice-title {
                        font-size: 14px;
                        font-weight: 800;
                        letter-spacing: 0.1em;
                        color: #64748b;
                    }
                    .invoice-divider {
                        border-top: 2px dashed #cbd5e1;
                        margin: 20px 0;
                    }
                    .invoice-section {
                        margin-bottom: 15px;
                    }
                    .invoice-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        font-size: 12px;
                        color: #334155;
                    }
                    .invoice-label {
                        font-weight: 600;
                        color: #64748b;
                    }
                    .invoice-val {
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .invoice-subtitle {
                        font-size: 12px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: #0f172a;
                        margin-bottom: 10px;
                    }
                    .invoice-total {
                        font-size: 16px;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid #e2e8f0;
                    }
                    .invoice-total .invoice-label {
                        color: #0f172a;
                        font-weight: 900;
                    }
                    .invoice-total .invoice-val {
                        color: #10b981;
                        font-weight: 900;
                    }
                    .invoice-footer {
                        text-align: center;
                        font-size: 11px;
                        color: #64748b;
                        margin-top: 30px;
                        font-weight: 500;
                    }
                }
            `}</style>
        </main>
    );
}

export default PaymentSuccess;
