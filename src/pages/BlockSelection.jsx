import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { clearUserSession } from "../services/auth";
import PopupManager from "../components/PopupManager";

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
            <PopupManager page="LOCATION_SELECTION" />
            <div className="content-wrap">
                <Navbar
                    title="Choose Print Location"
                    subtitle="Step 1 · Pickup Point"
                    badge="Required"
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

                <motion.div 
                    className="mb-8 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/40 backdrop-blur-md shadow-lg"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                >
                    <div className="w-full h-48 sm:h-64 bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                        {/* Map Grid Gridlines */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />
                        
                        {/* Glowing Radar Waves */}
                        <div className="absolute w-72 h-72 rounded-full border border-sky-500/20 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                        <div className="absolute w-48 h-48 rounded-full border border-sky-500/10 animate-ping opacity-15" style={{ animationDuration: '4s' }} />

                        {/* Connected Pins */}
                        <div className="relative z-10 flex items-center gap-12 sm:gap-20">
                            {['C Block', 'R Block', 'L Block'].map((block, idx) => (
                                <div key={block} className="flex flex-col items-center gap-2">
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute w-8 h-8 rounded-full bg-sky-500/30 animate-pulse" />
                                        <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-[0_0_12px_#0ea5e9]" />
                                    </div>
                                    <span className="text-xs font-black text-slate-300 bg-slate-900/85 px-2.5 py-1 rounded-full border border-slate-800 shadow-md">
                                        {block}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-4">
                        <div>
                            <h4 className="font-black text-sm">Autonomous Print Counters</h4>
                            <p className="text-xs text-slate-300">Each campus block features a fully configured smart printer terminal.</p>
                        </div>
                        <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
                            Live Status
                        </span>
                    </div>
                </motion.div>

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
