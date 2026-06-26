import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setError("");
        setMessage("");
        setLoading(true);

        try {
            await api.post("/forgot-password", null, {
                params: {
                    email: email.trim()
                }
            });

            setMessage("Password reset OTP generated! Redirecting to password reset page...");
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || "Failed to generate password reset request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-shell">
            <motion.section
                className="auth-grid"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
            >
                <div className="auth-visual">
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
                    >
                        <source src="/login_video.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-sky-950/75 to-slate-950/85 z-10 pointer-events-none" />

                    <div className="z-20 relative">
                        <div className="brand-mark">CP</div>
                    </div>

                    <div className="z-20 relative">
                        <p className="text-sm uppercase tracking-[0.18em] text-sky-100 font-bold">
                            Reset Password
                        </p>

                        <h1 className="mt-3 text-4xl font-black leading-tight text-white">
                            Recover your account password easily in seconds.
                        </h1>
                    </div>
                </div>

                <div className="auth-card">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.45 }}
                        className="text-center"
                    >
                        <img 
                            src="/forgot_password_illustration.png" 
                            alt="Forgot Password" 
                            className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-[0_8px_24px_rgba(168,85,247,0.35)]"
                        />
                        <p className="eyebrow mx-auto">Account Recovery</p>
                        <h2 className="title">Forgot Password</h2>
                        <p className="subtitle">
                            Enter the email address associated with your Cloud Print account.
                        </p>

                        {error && (
                            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold">
                                ⚠️ {error}
                            </div>
                        )}

                        {message && (
                            <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold">
                                ✓ {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />

                            <button
                                type="submit"
                                className="btn w-full py-3"
                                disabled={loading}
                            >
                                {loading ? "Generating OTP..." : "Send Reset Code"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-600">
                            Remember your password?{" "}
                            <Link to="/" className="link-action">
                                Login here
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.section>
        </main>
    );
}

export default ForgotPassword;
