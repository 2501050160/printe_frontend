import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { loginUser, persistUser } from "../services/auth";
import api from "../services/api";
import PopupManager from "../components/PopupManager";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [dbOffline, setDbOffline] = useState(false);
    const [resending, setResending] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
            // Clear location state to avoid showing again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        const checkDb = async () => {
            try {
                const response = await api.get("/system/db-status");
                if (response.data && response.data.databaseConnected) {
                    setDbOffline(false);
                } else {
                    setDbOffline(true);
                }
            } catch (err) {
                setDbOffline(true);
            }
        };
        checkDb();
        const interval = setInterval(checkDb, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (dbOffline) return;
        setError("");
        setSuccessMessage("");

        try {
            const response = await loginUser(email, password);
            persistUser(response);
            navigate("/blocks");
        } catch (error) {
            console.error(error);
            setError(
                error.response?.data || "Invalid email or password"
            );
        }
    };

    const handleResendLink = async () => {
        if (!email) {
            setError("Please type your email address first.");
            return;
        }
        setResending(true);
        setError("");
        setSuccessMessage("");
        try {
            await api.post("/resend-otp", null, {
                params: { email }
            });
            setSuccessMessage("A new verification OTP has been sent to your email!");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data || "Failed to resend OTP.");
        } finally {
            setResending(false);
        }
    };

    return (

        <main className="auth-shell">
            <PopupManager page="LOGIN" />

            <motion.section
                className="auth-grid"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
            >

                <div className="auth-visual overflow-hidden relative">
                    {/* Premium Animated Aurora Gradient Background */}
                    <div className="absolute inset-0 bg-slate-950 z-0" />
                    <div className="absolute inset-0 z-10 opacity-45 blur-[100px] animate-[pulse_6s_infinite_alternate]" style={{
                        background: "radial-gradient(circle at 10% 20%, #7c3aed 0%, transparent 45%), radial-gradient(circle at 90% 80%, #0284c7 0%, transparent 45%)"
                    }} />
                    <div className="absolute inset-0 z-10 opacity-35 blur-[80px] animate-[pulse_10s_infinite_alternate_reverse]" style={{
                        background: "radial-gradient(circle at 80% 10%, #db2777 0%, transparent 40%), radial-gradient(circle at 20% 90%, #0f766e 0%, transparent 40%)"
                    }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/60 to-slate-950/90 z-20 pointer-events-none" />

                    <div className="z-20 relative">
                        <div className="brand-mark">CP</div>
                    </div>

                    <div className="z-20 relative">
                        <p className="text-sm uppercase tracking-[0.18em] text-sky-100 font-bold">
                            Shop print console
                        </p>
 
                        <h1 className="mt-3 text-4xl font-black leading-tight text-white">
                            Upload anywhere. Print here. Collect in minutes.
                        </h1>
                    </div>

                </div>

                <div className="auth-card">

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.45 }}
                    >

                        <p className="eyebrow">Customer Login</p>

                        <h2 className="title">
                            Welcome back
                        </h2>

                        <p className="subtitle">
                            Sign in to upload PDF files and track print orders.
                        </p>

                        {dbOffline && (
                            <div style={{
                                background: "#ef4444",
                                color: "#ffffff",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "bold",
                                marginTop: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)"
                            }}>
                                <span style={{ animation: "pulse 1s infinite" }}>⚠️</span>
                                <marquee scrollamount="4">connection is not available</marquee>
                            </div>
                        )}

                        <form
                            onSubmit={handleLogin}
                            className="mt-8 space-y-4"
                        >

                            <input
                                type="text"
                                placeholder="Username"
                                className="field"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                disabled={dbOffline}
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                className="field"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                disabled={dbOffline}
                            />

                            <div className="flex justify-end text-xs font-bold -mt-2 mb-2">
                                <Link to="/forgot-password" className="text-sky-600 hover:text-sky-700 transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>

                            {successMessage && (
                                <motion.p
                                    className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    ✓ {successMessage}
                                </motion.p>
                            )}

                             {error && (
                                <motion.div
                                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 space-y-1"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <p>⚠️ {error}</p>
                                    {error.includes("Email not verified") && (
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/verify-otp?email=${encodeURIComponent(email)}`)}
                                                className="text-sky-600 hover:text-sky-700 underline block font-bold text-left bg-transparent border-0 p-0 cursor-pointer"
                                            >
                                                Verify Email First. Click here to enter your OTP.
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleResendLink}
                                                disabled={resending}
                                                className="text-xs text-slate-500 hover:text-slate-700 underline block text-left bg-transparent border-0 p-0 cursor-pointer"
                                            >
                                                {resending ? "Resending OTP..." : "Didn't receive code? Resend OTP."}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                className="btn w-full"
                                disabled={dbOffline}
                                style={dbOffline ? { opacity: 0.5, cursor: "not-allowed", background: "#64748b" } : {}}
                            >
                                Login
                            </button>

                        </form>

                        <div className="mt-6 flex flex-col gap-3 text-center text-sm text-slate-600">

                            <p>
                                New customer?{" "}
                                <Link
                                    to="/register"
                                    className="link-action"
                                >
                                    Create an account
                                </Link>
                            </p>

                            <Link
                                to="/admin-login"
                                className="btn secondary w-full"
                            >
                                Admin Login
                            </Link>

                        </div>

                    </motion.div>

                </div>

            </motion.section>

        </main>
    );
}

export default Login;
