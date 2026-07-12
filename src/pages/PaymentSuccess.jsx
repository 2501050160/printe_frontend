import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { getWalletBalance } from "../services/auth";
import Navbar from "../components/Navbar";

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

    const otpRef = useRef("");
    const fileNameRef = useRef("");
    const blockLocationRef = useRef("");

    const proceedOrder = async () => {
        if (proceeding) return;
        setProceeding(true);
        try {
            await api.post("/queue/proceed", null, {
                params: { orderId }
            });
            navigate(`/blocks?orderId=${orderId}&otp=${otpRef.current}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
        } catch (error) {
            console.error("Failed to proceed order:", error);
            navigate(`/blocks?orderId=${orderId}&otp=${otpRef.current}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
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
                    navigate(`/blocks?orderId=${orderId}&otp=${otpRef.current}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
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
                    navigate(`/blocks?orderId=${orderId}&otp=${otpRef.current}&fileName=${encodeURIComponent(fileNameRef.current)}&block=${encodeURIComponent(blockLocationRef.current)}`);
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
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="Payment Success"
                    subtitle="Order Confirmation"
                />
                <motion.div
                    className="panel success-panel mx-auto max-w-2xl p-8 text-center mt-6"
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="success-check-wrapper flex justify-center mb-6"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
                    >
                        <div className="w-24 h-24 mx-auto mb-6 relative flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100/50 shadow-[0_8px_24px_rgba(16,185,129,0.2)] animate-bounce" style={{ animationDuration: '2s' }}>
                            <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </motion.div>

                    <p className="eyebrow">Payment Successful</p>
                    <h1 className="title">Order Confirmed</h1>
                    <p className="subtitle mx-auto max-w-lg">
                        Order <strong>{orderId}</strong> is paid. You can cancel
                        within the countdown and the amount will be credited to your
                        wallet.
                        {otpCode && (
                            <span className="block mt-4 text-xl text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/10 border border-emerald-500/20 py-3 px-6 rounded-2xl">
                                OTP Code: <span className="font-mono font-black text-2xl tracking-[0.2em]">{otpCode}</span>
                            </span>
                        )}
                    </p>

                    <div className="mx-auto mt-8 flex flex-col items-center">
                        <div
                            className="countdown-ring"
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
                        <p className="mt-4 text-sm font-bold text-slate-500">
                            Status: {status}
                        </p>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <button
                            onClick={cancelOrder}
                            disabled={cancelling || proceeding}
                            className="btn danger"
                        >
                            {cancelling ? "Cancelling..." : "Cancel Print"}
                        </button>
                        <button
                            onClick={proceedOrder}
                            disabled={proceeding || cancelling}
                            className="btn success"
                        >
                            {proceeding ? "Proceeding..." : "Proceed to Print"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}

export default PaymentSuccess;
