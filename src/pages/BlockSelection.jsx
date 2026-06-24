import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { clearUserSession } from "../services/auth";

const defaultIcons = ["🏛️", "⚡", "📘", "🏛️", "⚡", "📘"];
const defaultAccents = ["#0891b2", "#059669", "#7c3aed", "#e11d48", "#ea580c", "#db2777"];

function BlockSelection() {
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const response = await api.get("/blocks/all");
                const mapped = response.data.map((b, idx) => ({
                    name: b.name,
                    description: `${b.name} print counter`,
                    icon: defaultIcons[idx % defaultIcons.length],
                    accent: defaultAccents[idx % defaultAccents.length]
                }));
                setBlocks(mapped);
            } catch (err) {
                console.error("Failed to load blocks", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBlocks();
    }, []);

    const logout = () => {
        clearUserSession();
        navigate("/");
    };

    const selectBlock = (blockName) => {
        localStorage.setItem("selectedBlock", blockName);
        navigate("/dashboard");
    };

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="Choose Print Location"
                    subtitle="Step 1 · Pickup Point"
                    badge="Required"
                    actions={[
                        { label: "Logout", onClick: logout, className: "btn secondary" }
                    ]}
                />

                <motion.p
                    className="subtitle mb-6 max-w-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    Select where you will collect your printed documents. Orders are
                    routed to the printer at that location automatically.
                </motion.p>

                {loading ? (
                    <div className="text-center font-bold text-slate-500 py-12">Loading locations...</div>
                ) : (
                    <div className="block-grid">
                        {blocks.map((block, index) => (
                            <motion.button
                                key={block.name}
                                type="button"
                                className="block-card"
                                style={{ "--block-accent": block.accent }}
                                onClick={() => selectBlock(block.name)}
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 * index, duration: 0.45 }}
                                whileHover={{ y: -6, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="block-card-glow" />
                                <span className="block-card-icon">{block.icon}</span>
                                <h3 className="block-card-title">{block.name}</h3>
                                <p className="block-card-text">{block.description}</p>
                                <span className="block-card-cta">Select location →</span>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default BlockSelection;
