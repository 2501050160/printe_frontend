import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser, persistUser } from "../services/auth";
import api, { API_BASE } from "../services/api";
import PopupManager from "../components/PopupManager";
import loginHero from "../assets/login_hero.mp4";
import introVideo from "../assets/intro_video1.mp4";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [dbOffline, setDbOffline] = useState(false);
    const [resending, setResending] = useState(false);
    const [oauthRedirecting, setOauthRedirecting] = useState(null);
    
    // States for setting OAuth passwords
    const [oauthNewUser, setOauthNewUser] = useState(null);
    const [oauthPassword, setOauthPassword] = useState("");
    const [oauthPasswordConfirm, setOauthPasswordConfirm] = useState("");
    const [settingPasswordLoading, setSettingPasswordLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleOAuth = (provider) => {
        setOauthRedirecting(provider);
        setTimeout(() => {
            const endpoint = provider.toLowerCase() === "google" ? "google" : "azure";
            window.location.href = `${API_BASE}/oauth2/authorization/${endpoint}`;
        }, 1500);
    };

    const navigate = useNavigate();
    const location = useLocation();
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const oauthSuccess = params.get("oauth_success");
        if (oauthSuccess === "true") {
            const isNew = params.get("is_new_user") === "true";
            const user = {
                id: params.get("id"),
                name: params.get("name"),
                email: params.get("email"),
                walletBalance: parseFloat(params.get("walletBalance") || "0.0")
            };
            if (isNew) {
                setOauthNewUser(user);
            } else {
                persistUser(user);
                navigate("/blocks");
            }
        }
    }, [location, navigate]);

    const handleSetOauthPassword = async (e) => {
        e.preventDefault();
        if (!oauthPassword || oauthPassword.length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            return;
        }
        if (oauthPassword !== oauthPasswordConfirm) {
            setErrorMessage("Passwords do not match.");
            return;
        }
        setSettingPasswordLoading(true);
        setErrorMessage("");
        try {
            const formData = new URLSearchParams();
            formData.append("email", oauthNewUser.email);
            formData.append("newPassword", oauthPassword);

            await api.post("/oauth/set-password", formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            persistUser(oauthNewUser);
            navigate("/blocks");
        } catch (err) {
            console.error(err);
            setErrorMessage(err.response?.data || "Failed to set password.");
        } finally {
            setSettingPasswordLoading(false);
        }
    };

    useEffect(() => {
        const introShown = sessionStorage.getItem("introShown");
        if (!introShown) {
            setShowIntro(true);
        }
    }, []);

    const handleSkipIntro = () => {
        sessionStorage.setItem("introShown", "true");
        setShowIntro(false);
    };

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
            const redirectPath = localStorage.getItem("redirectAfterLogin");
            if (redirectPath) {
                localStorage.removeItem("redirectAfterLogin");
                navigate(redirectPath);
            } else {
                navigate("/blocks");
            }
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

        <main className="auth-shell relative">
            <AnimatePresence>
                {oauthRedirecting && (
                    <motion.div
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md text-white text-center p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin mb-6" />
                        <h3 className="text-xl font-black">🔄 Redirecting to {oauthRedirecting}...</h3>
                        <p className="mt-3 text-sm text-slate-300 max-w-sm font-bold">
                            Please choose your {oauthRedirecting} account to continue. This will only take a moment.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile/Tablet Fullscreen Background Video Fallback */}
            <div className="absolute inset-0 z-0 lg:hidden pointer-events-none overflow-hidden">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover opacity-25"
                >
                    <source src={loginHero} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 to-slate-950/80" />
            </div>

            <PopupManager page="LOGIN" />

            <motion.section
                className="auth-grid"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
            >

                <div className="auth-visual overflow-hidden relative">
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                    >
                        <source src={loginHero} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-sky-950/75 to-slate-950/85 z-10 pointer-events-none" />

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

                        {/* Social OAuth Sign-ins */}
                        <div className="relative flex items-center justify-center my-6">
                            <span className="h-px bg-slate-200 w-full absolute" />
                            <span className="bg-white px-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">
                                or continue with
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleOAuth("Google")}
                                className="btn secondary py-2.5 px-4 min-h-0 text-xs font-black flex items-center justify-center gap-2 rounded-xl"
                            >
                                Google
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOAuth("Microsoft")}
                                className="btn secondary py-2.5 px-4 min-h-0 text-xs font-black flex items-center justify-center gap-2 rounded-xl"
                            >
                                Microsoft
                            </button>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 text-center text-sm text-slate-600">

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

            {/* Intro Video Overlay with Skip Button */}
            <AnimatePresence>
                {showIntro && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <video 
                            autoPlay 
                            muted
                            playsInline 
                            className="w-full h-full object-cover absolute inset-0 z-0"
                            onEnded={handleSkipIntro}
                        >
                            <source src={introVideo} type="video/mp4" />
                        </video>
                        
                        <button
                            onClick={handleSkipIntro}
                            className="absolute bottom-10 right-10 z-10 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wider uppercase rounded-full border border-white/25 backdrop-blur-md transition-all shadow-2xl hover:scale-105 active:scale-95"
                        >
                            Skip Intro
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New OAuth User Set Password Modal */}
            <AnimatePresence>
                {oauthNewUser && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative text-slate-800"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <h2 className="text-2xl font-black tracking-tight text-slate-900">
                                Complete Registration 🔑
                            </h2>
                            <p className="mt-2.5 text-xs text-slate-500 font-bold leading-relaxed">
                                Welcome, <span className="text-blue-600 font-black">{oauthNewUser.name}</span>! Since this is your first time logging in with Google, please set a password. 
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400 font-bold">
                                You can log in in the future using either Google Sign-In or this email & password.
                            </p>

                            <form onSubmit={handleSetOauthPassword} className="mt-6 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Choose Password</label>
                                    <input 
                                        type="password" 
                                        required 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:border-blue-600 transition-colors" 
                                        placeholder="Min 6 characters"
                                        value={oauthPassword}
                                        onChange={(e) => setOauthPassword(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        required 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:border-blue-600 transition-colors" 
                                        placeholder="Repeat password"
                                        value={oauthPasswordConfirm}
                                        onChange={(e) => setOauthPasswordConfirm(e.target.value)}
                                    />
                                </div>

                                {errorMessage && (
                                    <p className="text-xs font-bold text-red-600">
                                        ⚠️ {errorMessage}
                                    </p>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn w-full mt-2"
                                    disabled={settingPasswordLoading}
                                >
                                    {settingPasswordLoading ? "Setting Password..." : "Complete & Log In"}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}

export default Login;
