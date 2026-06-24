import React from "react";
import { motion, AnimatePresence } from "framer-motion";

function CustomModal({
    isOpen,
    onClose,
    title,
    message,
    type = "info", // "success" | "error" | "warning" | "info" | "confirm"
    onConfirm,
    confirmText = "OK",
    cancelText = "Cancel"
}) {
    if (!isOpen) return null;

    const iconMap = {
        success: "✓",
        error: "✕",
        warning: "⚠",
        info: "ℹ",
        confirm: "?"
    };

    const gradientMap = {
        success: "from-emerald-500 to-teal-600 shadow-emerald-500/30 text-emerald-100",
        error: "from-rose-500 to-red-600 shadow-rose-500/30 text-rose-100",
        warning: "from-amber-500 to-orange-600 shadow-amber-500/30 text-amber-100",
        info: "from-sky-500 to-blue-600 shadow-sky-500/30 text-sky-100",
        confirm: "from-slate-700 to-slate-900 shadow-slate-700/30 text-slate-100"
    };

    const iconColorMap = {
        success: "text-emerald-500 bg-emerald-50 border-emerald-100",
        error: "text-rose-500 bg-rose-50 border-rose-100",
        warning: "text-amber-500 bg-amber-50 border-amber-100",
        info: "text-sky-500 bg-sky-50 border-sky-100",
        confirm: "text-slate-600 bg-slate-50 border-slate-100"
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                {/* Backdrop Click */}
                <div className="absolute inset-0" onClick={type === "confirm" ? null : onClose} />

                <motion.div
                    className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10"
                    initial={{ scale: 0.93, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.93, opacity: 0, y: 15 }}
                    transition={{ type: "spring", duration: 0.4 }}
                >
                    <div className="flex flex-col items-center text-center">
                        {/* Icon Header */}
                        <div className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black shadow-inner mb-4 ${iconColorMap[type]}`}>
                            {iconMap[type]}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black text-slate-900 mb-2">
                            {title}
                        </h3>

                        {/* Message */}
                        <p className="text-sm font-semibold text-slate-500 mb-6 whitespace-pre-wrap leading-relaxed">
                            {message}
                        </p>

                        {/* Buttons Footer */}
                        <div className="flex w-full gap-3">
                            {type === "confirm" ? (
                                <>
                                    <button
                                        onClick={onClose}
                                        className="btn secondary flex-1"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="btn success flex-1"
                                    >
                                        {confirmText}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className={`btn w-full ${
                                        type === "error"
                                            ? "danger"
                                            : type === "warning"
                                            ? "warning"
                                            : type === "success"
                                            ? "success"
                                            : ""
                                    }`}
                                >
                                    {confirmText}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default CustomModal;
