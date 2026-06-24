import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { loginUser, persistUser } from "../services/auth";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const response = await loginUser(email, password);

            persistUser(response);

            navigate("/blocks");

        } catch (error) {

            console.error(error);

            setError(
                "Invalid email or password"
            );
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

                    <div>
                        <div className="brand-mark">CP</div>
                    </div>

                    <div>
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

                        <form
                            onSubmit={handleLogin}
                            className="mt-8 space-y-4"
                        >

                            <input
                                type="email"
                                placeholder="Email address"
                                className="field"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                className="field"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />

                            {error && (
                                <motion.p
                                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                type="submit"
                                className="btn w-full"
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
