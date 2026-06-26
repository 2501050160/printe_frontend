import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import adminVisualBg from "../assets/admin_visual_bg.png";

function AdminLogin() {

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const response =
                await api.post("/admin/login", {
                        username,
                        password
                    });

            localStorage.setItem(
                "adminId",
                response.data.id
            );

            localStorage.setItem(
                "adminUser",
                response.data.username
            );

            navigate("/admin");

        } catch (error) {

            console.error(error);

            alert(
                "Invalid Admin Credentials"
            );
        }
    };

    return (

        <main className="auth-shell-admin">

            <motion.section
                className="auth-grid-admin"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
            >

                <div className="auth-visual" style={{
                    background: `linear-gradient(145deg, rgba(13, 20, 35, 0.8), rgba(9, 13, 22, 0.95)), url(${adminVisualBg}) center/cover`
                }}>

                    <div>
                        <div className="brand-mark btn-admin-glow">AD</div>
                    </div>

                    <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-pink-300 font-bold">
                            Control Panel
                        </p>

                        <h1 className="mt-3 text-4xl font-black leading-tight text-white">
                            Monitor live prints, set rates, and manage local shops.
                        </h1>
                    </div>

                </div>

                <div className="auth-card-admin">

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.45 }}
                    >

                        <p className="eyebrow text-pink-400">Admin Console</p>

                        <h2 className="title">
                            Shop Dashboard
                        </h2>

                        <p className="subtitle">
                            Sign in on the print PC to manage rates and printer mappings.
                        </p>

                        <form
                            onSubmit={handleLogin}
                            className="mt-8 space-y-4"
                        >

                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(
                                        e.target.value
                                    )
                                }
                                className="field"
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                className="field"
                            />

                            <button
                                type="submit"
                                className="btn btn-admin-glow w-full"
                            >
                                Login to Console
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="btn secondary w-full"
                                style={{
                                    borderColor: "rgba(255, 255, 255, 0.1)",
                                    color: "#cbd5e1"
                                }}
                            >
                                Customer Login
                            </button>

                        </form>

                    </motion.div>

                </div>

            </motion.section>

        </main>
    );
}

export default AdminLogin;
