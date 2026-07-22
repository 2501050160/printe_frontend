import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

function PopupManager({ page }) {
    const [activePopups, setActivePopups] = useState([]);
    const [currentPopup, setCurrentPopup] = useState(null);

    useEffect(() => {
        const fetchActivePopups = async () => {
            try {
                const response = await api.get("/popups/active", {
                    params: { page }
                });
                
                // Filter out popups that the user has already dismissed in this browser session
                const filtered = (response.data || []).filter(pop => {
                    const isDismissed = sessionStorage.getItem(`dismissed_popup_${pop.id}`);
                    return !isDismissed;
                });
                
                setActivePopups(filtered);
                if (filtered.length > 0) {
                    setCurrentPopup(filtered[0]);
                }
            } catch (err) {
                console.error("Failed to load active popups", err);
            }
        };

        fetchActivePopups();
    }, [page]);

    const handleDismiss = () => {
        if (!currentPopup) return;
        
        // Save dismissal status in sessionStorage
        sessionStorage.setItem(`dismissed_popup_${currentPopup.id}`, "true");
        
        // Find next popup in queue
        const remaining = activePopups.filter(pop => pop.id !== currentPopup.id);
        setActivePopups(remaining);
        if (remaining.length > 0) {
            setCurrentPopup(remaining[0]);
        } else {
            setCurrentPopup(null);
        }
    };

    return (
        <AnimatePresence>
            {currentPopup && (
                <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
                    {/* Toast / Banner Card */}
                    <motion.div 
                        className="relative w-full max-w-sm rounded-2xl border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur-xl pointer-events-auto"
                        initial={{ opacity: 0, x: 100, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    >
                        {/* Decorative background glow */}
                        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-500/20 blur-xl pointer-events-none" />
                        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />

                        {/* Header: Title and Close button */}
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {currentPopup.title}
                            </h3>
                            {currentPopup.dismissible && (
                                <button 
                                    onClick={handleDismiss}
                                    className="text-slate-400 hover:text-slate-700 transition-colors bg-white/50 hover:bg-slate-100 p-1.5 rounded-full"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Message Content */}
                        <p className="text-sm font-semibold text-slate-600 leading-relaxed mb-4 whitespace-pre-wrap">
                            {currentPopup.message}
                        </p>

                        {/* Actions (if not dismissible) */}
                        {!currentPopup.dismissible && (
                            <div className="flex justify-start">
                                <span className="text-xs text-rose-500 font-bold bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
                                    ⚠️ Required Notice - Please Read
                                </span>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default PopupManager;
