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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Dark Glassmorphic Backdrop */}
                    <motion.div 
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={currentPopup.dismissible ? handleDismiss : undefined}
                    />

                    {/* Popup Card */}
                    <motion.div 
                        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-6 text-center shadow-2xl backdrop-blur-xl"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    >
                        {/* Decorative background glow */}
                        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-500/20 blur-xl pointer-events-none" />
                        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />

                        {/* Title */}
                        <h3 className="text-xl font-black tracking-tight text-slate-900 mb-3">
                            📢 {currentPopup.title}
                        </h3>

                        {/* Message Content */}
                        <p className="text-sm font-semibold text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">
                            {currentPopup.message}
                        </p>

                        {/* Actions */}
                        <div className="flex justify-center">
                            {currentPopup.dismissible ? (
                                <button 
                                    onClick={handleDismiss}
                                    className="btn w-full py-2.5 font-bold shadow-lg"
                                >
                                    Dismiss Announcement
                                </button>
                            ) : (
                                <span className="text-xs text-rose-500 font-bold bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
                                    ⚠️ Required Notice - Please Read
                                </span>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default PopupManager;
