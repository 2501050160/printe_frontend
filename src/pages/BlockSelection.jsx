import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";

const blocks = [
    {
        name: "C Block",
        description: "C Block print counter",
        icon: "🏛️",
        accent: "#0891b2"
    },
    {
        name: "R Block",
        description: "R Block print counter",
        icon: "⚡",
        accent: "#059669"
    },
    {
        name: "L Block",
        description: "L Block print counter",
        icon: "📘",
        accent: "#7c3aed"
    }
];

import { clearUserSession } from "../services/auth";

function BlockSelection() {
    const navigate = useNavigate();

    const logout = () => {
        clearUserSession();
        navigate("/");
    };

    const selectBlock = (block) => {
        localStorage.setItem("selectedBlock", block);
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
            </div>
        </main>
    );
}

export default BlockSelection;
