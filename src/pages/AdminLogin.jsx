import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

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

        <main className="auth-shell">

            <motion.section
                className="auth-grid"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
            >

                <div className="auth-visual">

                    <div>
                        <div className="brand-mark">AD</div>
                    </div>

                    <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-sky-100 font-bold">
                            Display panel
                        </p>

                        <h1 className="mt-3 text-4xl font-black leading-tight text-white">
                            Watch paid jobs arrive and manage the print counter.
                        </h1>
                    </div>

                </div>

                <div className="auth-card">

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.45 }}
                    >

                        <p className="eyebrow">Admin Login</p>

                        <h2 className="title">
                            Shop console
                        </h2>

                        <p className="subtitle">
                            Sign in on the PC connected to the printer.
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
                                className="btn danger w-full"
                            >
                                Login
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="btn secondary w-full"
                            >
                                User Login
                            </button>

                        </form>

                    </motion.div>

                </div>

            </motion.section>

        </main>
    );
}

export default AdminLogin;
