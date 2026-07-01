import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getStoredWalletBalance, getWalletBalance } from "../services/auth";

function MyOrders() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");

    const [orders, setOrders] = useState([]);
    const [walletBalance, setWalletBalance] = useState(getStoredWalletBalance());

    useEffect(() => {
        fetchOrders();

        if (userId) {
            getWalletBalance(userId).then(setWalletBalance);
        }

        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get("/pdf/userOrders", {
                params: { userId }
            });

            setOrders(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const statusClass = (status) => {
        if (status === "CANCELLED") {
            return "status-pill status-unpaid";
        }

        if (status === "CANCEL_WINDOW" || status === "QUEUE") {
            return "status-pill status-created";
        }

        if (status === "COMPLETED") {
            return "status-pill status-completed";
        }

        if (status === "PRINTING") {
            return "status-pill status-printing";
        }

        return "status-pill status-created";
    };

    return (
        <main className="page-shell page-shell-decorated">
            <div className="content-wrap">
                <Navbar
                    title="My Orders"
                    subtitle="Order History"
                    badge={`Wallet Rs. ${walletBalance}`}
                    actions={[
                        { label: "New Print", path: "/dashboard" },
                        { label: "Back", path: "/dashboard", className: "btn secondary" }
                    ]}
                />

                <motion.section
                    className="panel overflow-x-auto"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                >
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Pages</th>
                                <th>Copies</th>
                                <th>Price</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders.map((order, index) => (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <td className="font-black">{order.orderId}</td>
                                    <td className="font-bold">
                                        {order.customerName || "Customer"}
                                    </td>
                                    <td>{order.blockLocation || "C Block"}</td>
                                    <td>{order.selectedPages}</td>
                                    <td>{order.copies}</td>
                                    <td className="font-black">Rs. {order.price}</td>
                                    <td className="flex items-center gap-2">
                                        <span className={statusClass(order.status)}>
                                            {order.status}
                                        </span>
                                        {(order.status === "PRINTING" || order.status === "QUEUE") && (
                                            <div className="flex items-center justify-center text-sky-500">
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}

                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📄</div>
                                            <p>No orders yet</p>
                                            <button
                                                onClick={() => navigate("/dashboard")}
                                                className="btn mt-4"
                                            >
                                                Start Printing
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </motion.section>
            </div>
        </main>
    );
}

export default MyOrders;
