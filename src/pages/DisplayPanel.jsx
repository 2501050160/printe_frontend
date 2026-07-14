import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";
import QueueCard from "../components/QueueCard";
import { getBlockTheme } from "../config/blockThemes";

function DisplayPanel() {
    const [orders, setOrders] = useState([]);
    const [displayBlock, setDisplayBlock] = useState("C Block");
    const [blocks, setBlocks] = useState([]);
    const [slideIndex, setSlideIndex] = useState(0);
    const [pickupQueue, setPickupQueue] = useState([]);
    const [activePickup, setActivePickup] = useState(null);
    const [queuePageIndex, setQueuePageIndex] = useState(0);

    const theme = getBlockTheme(displayBlock);
    const welcomeSlides = theme.slides;

    const previousStatusesRef = useRef(new Map());
    const timersRef = useRef([]);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const response = await api.get("/blocks/all");
                setBlocks(response.data);
                if (response.data.length > 0) {
                    const names = response.data.map(b => b.name);
                    if (!names.includes(displayBlock)) {
                        setDisplayBlock(names[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch blocks", err);
            }
        };
        fetchBlocks();
    }, []);

    useEffect(() => {
        setSlideIndex(0);
    }, [displayBlock]);

    useEffect(() => {
        fetchOrders();

        const interval = setInterval(fetchOrders, 3000);

        return () => {
            clearInterval(interval);
            timersRef.current.forEach(clearTimeout);
        };
    }, [displayBlock]);

    useEffect(() => {
        const interval = setInterval(() => {
            setSlideIndex((current) =>
                (current + 1) % welcomeSlides.length
            );
        }, 3000);

        return () => clearInterval(interval);
    }, [welcomeSlides.length]);

    useEffect(() => {
        if (activePickup || pickupQueue.length === 0) {
            return;
        }

        const [nextPickup, ...remaining] = pickupQueue;

        setActivePickup(nextPickup);
        setPickupQueue(remaining);

        const timer = setTimeout(() => {
            setActivePickup(null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [pickupQueue, activePickup]);

    const fetchOrders = async () => {
        try {
            const response = await api.get("/pdf/orders", {
                params: { t: Date.now() }
            });
            const incomingOrders = response.data || [];

            detectCompletedOrders(incomingOrders);
            setOrders(incomingOrders);
        } catch (error) {
            console.error(error);
        }
    };

    const detectCompletedOrders = (incomingOrders) => {
        const nextStatuses = new Map();

        incomingOrders.forEach((order) => {
            const location = order.blockLocation || "C Block";

            if (location !== displayBlock) {
                return;
            }

            const previousStatus =
                previousStatusesRef.current.get(order.id);

            if (
                previousStatus &&
                previousStatus !== "COMPLETED" &&
                order.status === "COMPLETED" &&
                order.paymentStatus === "PAID"
            ) {
                setPickupQueue((currentQueue) => [
                    ...currentQueue,
                    order
                ]);
            }

            nextStatuses.set(order.id, order.status);
        });

        previousStatusesRef.current = nextStatuses;
    };



    const queueOrders = orders
        .filter(
            (order) =>
                order.paymentStatus === "PAID" &&
                ["PENDING_SCAN", "CANCEL_WINDOW", "QUEUE", "PRINTING"].includes(
                    order.status
                ) &&
                (order.blockLocation || "C Block") === displayBlock
        )
        .sort((a, b) => a.id - b.id);

    const currentOrder =
        queueOrders.find((order) => order.status === "PRINTING") ||
        queueOrders.find((order) => order.status === "QUEUE");

    const waitingOrders = queueOrders.filter(
        (order) => order.id !== currentOrder?.id
    );

    const hasActiveOrPendingOrders = queueOrders.length > 0;

    useEffect(() => {
        setQueuePageIndex(0);
        if (waitingOrders.length <= 8) {
            return;
        }
        const interval = setInterval(() => {
            setQueuePageIndex((prev) => {
                const totalPages = Math.ceil(waitingOrders.length / 8);
                return (prev + 1) % totalPages;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [waitingOrders.length, displayBlock]);

    const currentSlide = welcomeSlides[slideIndex];

    return (
        <main
            className="display-shell min-h-screen overflow-hidden text-white"
            style={{ background: theme.background }}
        >
            <motion.div
                className="display-orb display-orb-one"
                style={{ background: theme.accentSoft }}
                animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="display-orb display-orb-two"
                style={{ background: theme.glow, opacity: 0.16 }}
                animate={{ x: [0, -50, 0], y: [0, 35, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="display-grid-overlay" />

            <section className="relative z-10 flex min-h-screen flex-col p-6 md:p-8">
                <motion.header
                    className="flex flex-wrap items-center justify-between gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <p
                            className="text-sm font-black uppercase tracking-[0.22em]"
                            style={{ color: theme.accent }}
                        >
                            {theme.label}
                        </p>
                        <h1 className="mt-2 text-4xl font-black md:text-6xl">
                            {displayBlock}
                        </h1>
                    </div>

                    <div className="display-select-wrap">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-200">
                            Block
                        </span>
                        <select
                            value={displayBlock}
                            onChange={(e) => setDisplayBlock(e.target.value)}
                            className="display-select"
                        >
                            {blocks.map((block) => (
                                <option key={block.id} value={block.name}>
                                    {block.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </motion.header>

                <div className="grid flex-1 place-items-center py-8">
                    <AnimatePresence mode="wait">
                        {activePickup ? (
                            <motion.div
                                key={`pickup-${activePickup.id}`}
                                className="display-glass w-full max-w-5xl p-10 text-center"
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                            >
                                <p className="text-lg font-black uppercase tracking-[0.25em] text-green-300">
                                    Ready for collection
                                </p>
                                <h2 className="mt-5 text-6xl font-black md:text-8xl">
                                    {activePickup.orderId}
                                </h2>
                                <p className="mt-5 text-4xl font-black text-cyan-100 md:text-6xl">
                                    {activePickup.customerName || "Customer"}
                                </p>
                                <motion.div
                                    className="mx-auto mt-8 max-w-3xl rounded-2xl border border-green-300/40 bg-green-400/15 p-8"
                                    animate={{
                                        boxShadow: [
                                            "0 0 0 rgba(74,222,128,0)",
                                            "0 0 44px rgba(74,222,128,0.32)",
                                            "0 0 0 rgba(74,222,128,0)"
                                        ]
                                    }}
                                    transition={{ duration: 1.8, repeat: Infinity }}
                                >
                                    <p className="text-3xl font-black md:text-5xl">
                                        Please collect your pages
                                    </p>
                                </motion.div>
                            </motion.div>
                        ) : hasActiveOrPendingOrders ? (
                            <motion.div
                                key="queue"
                                className="grid w-full max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]"
                                initial={{ opacity: 0, y: 28 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -28 }}
                            >
                                {currentOrder ? (
                                    <section className="display-glass p-8">
                                        <p
                                            className="text-sm font-black uppercase tracking-[0.25em]"
                                            style={{ color: theme.accent }}
                                        >
                                            {currentOrder.status === "PRINTING"
                                                ? "Printing Now"
                                                : currentOrder.status ===
                                                    "CANCEL_WINDOW"
                                                  ? "Confirming Payment"
                                                  : "Up Next"}
                                        </p>

                                        <motion.h2
                                            key={currentOrder.orderId}
                                            className="mt-5 text-6xl font-black md:text-8xl"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {currentOrder.orderId}
                                        </motion.h2>

                                        <p className="mt-4 text-4xl font-black text-white/90">
                                            {currentOrder.customerName || "Customer"}
                                        </p>

                                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                                            {[
                                                ["Pages", currentOrder.selectedPages],
                                                ["Copies", currentOrder.copies],
                                                ["Type", currentOrder.printType]
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="rounded-xl bg-white/10 p-4 backdrop-blur"
                                                >
                                                    <p className="text-sm font-bold text-slate-300">
                                                        {label}
                                                    </p>
                                                    <p className="mt-1 text-2xl font-black">
                                                        {value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ background: theme.accent }}
                                                animate={{ x: ["-100%", "120%"] }}
                                                transition={{
                                                    duration: 1.6,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        </div>
                                    </section>
                                ) : (
                                    <section className="display-glass p-8 flex flex-col justify-center items-center text-center">
                                        <span className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '3s' }}>🖨️</span>
                                        <h2 className="text-3xl font-black">
                                            Printer Ready
                                        </h2>
                                        <p className="mt-4 text-lg font-bold text-slate-300 max-w-md">
                                            Locate your order ID on the list and enter its corresponding OTP code on your mobile device to release physical printing.
                                        </p>
                                    </section>
                                )}

                                <section className="display-glass p-8">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p
                                                className="text-sm font-black uppercase tracking-[0.25em]"
                                                style={{ color: theme.accent }}
                                            >
                                                Queue
                                            </p>
                                            <h3 className="mt-2 text-3xl font-black">
                                                Next Orders
                                            </h3>
                                        </div>
                                        <span
                                            className="rounded-full px-4 py-2 text-lg font-black text-slate-950"
                                            style={{ background: theme.accent }}
                                        >
                                            {queueOrders.length}
                                        </span>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        {waitingOrders.slice(queuePageIndex * 8, (queuePageIndex + 1) * 8).map((order, index) => (
                                            <QueueCard
                                                key={order.id}
                                                order={order}
                                                index={index}
                                            />
                                        ))}

                                        {waitingOrders.length === 0 && (
                                            <div className="col-span-2 rounded-xl bg-white/10 p-10 text-center text-2xl font-black text-slate-300">
                                                No waiting orders
                                            </div>
                                        )}
                                    </div>

                                    {waitingOrders.length > 8 && (
                                        <div className="mt-4 flex justify-center gap-2">
                                            {Array.from({ length: Math.ceil(waitingOrders.length / 8) }).map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={`h-2.5 rounded-full transition-all duration-300 ${
                                                        i === queuePageIndex ? "w-8 bg-sky-400" : "w-2.5 bg-white/20"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`welcome-${displayBlock}-${slideIndex}`}
                                className="display-glass w-full max-w-5xl p-10 text-center"
                                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -24, scale: 0.98 }}
                                transition={{ duration: 0.55 }}
                            >
                                <motion.p
                                    className="text-lg font-black uppercase tracking-[0.25em]"
                                    style={{ color: theme.accent }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    Welcome
                                </motion.p>

                                <motion.h2
                                    className="mt-5 text-5xl font-black leading-tight md:text-7xl"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08 }}
                                >
                                    {currentSlide.title}
                                </motion.h2>

                                <motion.p
                                    className="mx-auto mt-7 max-w-3xl text-xl font-bold leading-relaxed text-slate-200 md:text-2xl"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.16 }}
                                >
                                    {currentSlide.text}
                                </motion.p>

                                <div className="mt-10 flex justify-center gap-3">
                                    {welcomeSlides.map((slide, index) => (
                                        <motion.span
                                            key={slide.title}
                                            className="rounded-full"
                                            style={{
                                                background:
                                                    index === slideIndex
                                                        ? theme.accent
                                                        : "rgba(255,255,255,0.25)"
                                            }}
                                            animate={{
                                                width:
                                                    index === slideIndex
                                                        ? 48
                                                        : 12,
                                                height: 12
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm font-bold uppercase tracking-[0.18em] text-slate-300">
                    <span>Cloud Print · {displayBlock}</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                </footer>
            </section>
        </main>
    );
}

export default DisplayPanel;
