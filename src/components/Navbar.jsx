import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Navbar({ title, subtitle, actions = [], badge }) {
    const navigate = useNavigate();

    return (
        <motion.div
            className="top-bar panel top-bar-glass px-6 py-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
        >
            <div className="flex items-start gap-4">
                <div className="brand-mark brand-mark-sm">CP</div>
                <div>
                    {subtitle && (
                        <p className="eyebrow">{subtitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="title !mt-1">{title}</h1>
                        {badge && (
                            <span className="status-pill status-created">
                                {badge}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {actions.map((action) => {
                    if (action.to) {
                        return (
                            <Link
                                key={action.label}
                                to={action.to}
                                className={action.className || "btn secondary"}
                            >
                                {action.label}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={action.label}
                            onClick={action.onClick || (() => navigate(action.path))}
                            className={action.className || "btn secondary"}
                        >
                            {action.label}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

export default Navbar;
