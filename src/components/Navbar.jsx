import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Navbar({ title, subtitle, actions = [], badge, tabs = [], activeTab, onTabChange }) {
    const navigate = useNavigate();

    return (
        <motion.div
            className="top-bar panel top-bar-glass px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
        >
            <div className="flex items-center gap-4">
                <div className="brand-mark brand-mark-sm">CP</div>
                <div>
                    {subtitle && (
                        <p className="eyebrow !mb-0">{subtitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="title !mt-0 !mb-0">{title}</h1>
                        {badge && (
                            <span className="status-pill status-created">
                                {badge}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            {tabs && tabs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 bg-slate-950/5 p-1.5 rounded-xl border border-slate-200/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange && onTabChange(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-1.5 ${
                                activeTab === tab.id
                                    ? "bg-white text-sky-600 shadow-sm border border-slate-100"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                            }`}
                        >
                            {tab.icon && <span>{tab.icon}</span>}
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-3 items-center">
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
