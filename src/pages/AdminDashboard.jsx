import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { getPdfDownloadUrl } from "../services/api";

function AdminDashboard() {

    const navigate = useNavigate();

const [coupons, setCoupons] =
    useState([]);

    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [revenuePeriod, setRevenuePeriod] = useState("all");

    const [bwPrice, setBwPrice] = useState(0);
    const [colorPrice, setColorPrice] = useState(0);

    const [couponCode, setCouponCode] = useState("");

const [discountPercentage,
    setDiscountPercentage] =
    useState("");

const [expiryDate,
    setExpiryDate] =
    useState("");

const [maxUses,
    setMaxUses] =
    useState("");

    useEffect(() => {

        const adminId =
            localStorage.getItem("adminId");

        if (!adminId) {

            navigate("/admin-login");
            return;
        }
        fetchCoupons();

        fetchOrders();
        fetchStats();
        fetchPrices();

        const interval =
            setInterval(() => {

                fetchOrders();
                fetchStats();

            }, 3000);

        return () =>
            clearInterval(interval);
    }, [revenuePeriod]);

    useEffect(() => {
        fetchStats();
    }, [revenuePeriod]);

const deleteCoupon = async (
    id
) => {

    try {

        await api.post(
            "/coupon/delete",
            null,
            {
                params: {
                    id
                }
            }
        );

        fetchCoupons();

        alert(
            "Coupon Deleted"
        );

    } catch (error) {

        console.error(error);
    }
};

        const fetchCoupons = async () => {

    try {

        const response =
            await api.get(
                "/coupon/all"
            );

        setCoupons(
            response.data
        );

    } catch (error) {

        console.error(error);
    }
};

    const fetchOrders = async () => {

        try {

            const response =
                await api.get(
                    "/pdf/orders"
                );

            setOrders(response.data);

        } catch (error) {

            console.error(error);
        }
    };

    const fetchStats = async () => {

        try {

            const response =
                await api.get(
                    "/pdf/stats",
                    {
                        params: {
                            period: revenuePeriod
                        }
                    }
                );

            setStats(response.data);

        } catch (error) {

            console.error(error);
        }
    };

    const fetchPrices = async () => {

        try {

            const response =
                await api.get(
                    "/pricing/all"
                );

            response.data.forEach((p) => {

                if (p.printType === "BW") {

                    setBwPrice(
                        p.pricePerPage
                    );
                }

                if (p.printType === "COLOR") {

                    setColorPrice(
                        p.pricePerPage
                    );
                }

            });

        } catch (error) {

            console.error(error);
        }
    };

    const savePrices = async () => {

        try {

            await api.post(
                "/pricing/update",
                null,
                {
                    params: {
                        printType: "BW",
                        pricePerPage: bwPrice
                    }
                }
            );

            await api.post(
                "/pricing/update",
                null,
                {
                    params: {
                        printType: "COLOR",
                        pricePerPage: colorPrice
                    }
                }
            );

            alert(
                "Prices Updated Successfully"
            );

        } catch (error) {

            console.error(error);

            alert(
                "Unable to Update Prices"
            );
        }
    };

    const createCoupon = async () => {

    try {

        await api.post(
            "/coupon/create",
            {
                couponCode,
                discountPercentage,
                expiryDate,
                maxUses
            }
        );

        alert(
            "Coupon Created Successfully"
        );
        fetchCoupons();
        setCouponCode("");
        setDiscountPercentage("");
        setExpiryDate("");
        setMaxUses("");

    } catch (error) {

        console.error(error);

        alert(
            "Unable To Create Coupon"
        );
    }
};

    const updateStatus = async (
    id,
    status
) => {

    try {

        await api.post(
            "/pdf/updateStatus",
            null,
            {
                params: {
                    id,
                    status
                }
            }
        );

        fetchOrders();
        fetchStats();

    } catch (error) {

        console.error(error);
    }
};

const downloadPdf = (
    id
) => {

    window.open(
        getPdfDownloadUrl(id),
        "_blank"
    );
};

    const logout = () => {

        localStorage.removeItem(
            "adminId"
        );

        localStorage.removeItem(
            "adminUser"
        );

        navigate(
            "/admin-login"
        );
    };

    const statusClass = (status) => {

    if (status === "CANCELLED") {
        return "status-pill status-unpaid";
    }

    if (status === "CANCEL_WINDOW") {
        return "status-pill status-unpaid";
    }

    if (status === "QUEUE") {
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
    const paymentClass = (status) =>
        status === "PAID"
            ? "status-pill status-paid"
            : "status-pill status-unpaid";

    const revenueFilters = [
        ["all", "All Time"],
        ["today", "Today"],
        ["week", "This Week"],
        ["month", "This Month"]
    ];

    const revenueCards = [
        ["Gross Revenue", stats.grossRevenue || 0, "linear-gradient(135deg, #2563eb, #1d4ed8)"],
        ["Coupon Discounts", stats.totalDiscounts || 0, "linear-gradient(135deg, #b45309, #c2410c)"],
        ["Net Revenue", stats.netRevenue || 0, "linear-gradient(135deg, #16865b, #0f766e)"]
    ];

    const statCards = [
        ["Today's Revenue", `Rs. ${stats.todayRevenue || 0}`, "linear-gradient(135deg, #0f766e, #16865b)"],
        ["Total Orders", stats.totalOrders || 0, "linear-gradient(135deg, #1677b7, #334155)"],
        ["Total Pages", stats.totalPages || 0, "linear-gradient(135deg, #5b6f95, #111827)"],
        ["Pending", stats.pendingOrders || 0, "linear-gradient(135deg, #b7791f, #805ad5)"],
        ["Printing", stats.printingOrders || 0, "linear-gradient(135deg, #ca8a04, #c2413d)"],
        ["Completed", stats.completedOrders || 0, "linear-gradient(135deg, #2563eb, #16865b)"]
    ];

    return (

        <main className="page-shell page-shell-decorated">

            <div className="content-wrap">

                <motion.div
                    className="top-bar panel top-bar-glass px-6 py-5"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                >

                    <div>
                        <p className="eyebrow">Shop Display Panel</p>
                        <h1 className="title">
                            Admin Dashboard
                        </h1>
                        <p className="subtitle">
                            Orders and stats refresh every 3 seconds.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate("/printer-settings")}
                            className="btn"
                        >
                            Printer Settings
                        </button>

                        <button
                            onClick={() => navigate("/display-panel")}
                            className="btn secondary"
                        >
                            Display Panel
                        </button>

                        <button
                            onClick={logout}
                            className="btn danger"
                        >
                            Logout
                        </button>
                    </div>

                </motion.div>

                <motion.section
                    className="panel p-6"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="section-header">
                        <div>
                            <p className="eyebrow">Revenue Analytics</p>
                            <h2 className="text-2xl font-black text-slate-900">
                                Gross vs Net After Coupons
                            </h2>
                            <p className="subtitle">
                                Net revenue = gross revenue − coupon discounts
                            </p>
                        </div>

                        <div className="revenue-filter">
                            {revenueFilters.map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setRevenuePeriod(value)}
                                    className={
                                        revenuePeriod === value
                                            ? "revenue-filter-btn active"
                                            : "revenue-filter-btn"
                                    }
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {revenueCards.map(([label, value, background], index) => (
                            <motion.div
                                key={label}
                                className="revenue-card"
                                style={{ background }}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                            >
                                <p className="relative z-10 text-sm font-bold text-white/80">
                                    {label}
                                </p>
                                <p className="relative z-10 mt-3 text-4xl font-black">
                                    Rs. {Number(value).toFixed(2)}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {statCards.map(([label, value, background], index) => (
                        <motion.div
                            key={label}
                            className="stat-card"
                            style={{ background }}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                        >
                            <p className="text-sm font-bold text-white/80">
                                {label}
                            </p>
                            <p className="text-2xl font-black">
                                {value}
                            </p>
                        </motion.div>
                    ))}
                </section>

                <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">

                    <motion.section
                        className="panel p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                    >

                        <div className="section-header">
                            <div>
                                <p className="eyebrow">Pricing</p>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Price Management
                                </h2>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label>
                                <span className="mb-2 block text-sm font-black text-slate-700">
                                    BW Price
                                </span>
                                <input
                                    type="number"
                                    value={bwPrice}
                                    onChange={(e) =>
                                        setBwPrice(
                                            e.target.value
                                        )
                                    }
                                    className="field"
                                />
                            </label>

                            <label>
                                <span className="mb-2 block text-sm font-black text-slate-700">
                                    Color Price
                                </span>
                                <input
                                    type="number"
                                    value={colorPrice}
                                    onChange={(e) =>
                                        setColorPrice(
                                            e.target.value
                                        )
                                    }
                                    className="field"
                                />
                            </label>
                        </div>

                        <button
                            onClick={savePrices}
                            className="btn success mt-5 w-full"
                        >
                            Save Prices
                        </button>

                    </motion.section>

                    <motion.section
                        className="panel p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16 }}
                    >

                        <div className="section-header">
                            <div>
                                <p className="eyebrow">Discounts</p>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Coupon Generator
                                </h2>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-5">
                            <input
                                type="text"
                                placeholder="Coupon Code"
                                value={couponCode}
                                onChange={(e) =>
                                    setCouponCode(
                                        e.target.value
                                    )
                                }
                                className="field"
                            />

                            <input
                                type="number"
                                placeholder="Discount %"
                                value={discountPercentage}
                                onChange={(e) =>
                                    setDiscountPercentage(
                                        e.target.value
                                    )
                                }
                                className="field"
                            />

                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) =>
                                    setExpiryDate(
                                        e.target.value
                                    )
                                }
                                className="field"
                            />

                            <input
                                type="number"
                                placeholder="Max Uses"
                                value={maxUses}
                                onChange={(e) =>
                                    setMaxUses(
                                        e.target.value
                                    )
                                }
                                className="field"
                            />

                            <button
                                onClick={createCoupon}
                                className="btn"
                            >
                                Create
                            </button>
                        </div>

                    </motion.section>

                </div>

                <motion.section
                    className="panel mt-6 overflow-x-auto"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >

                    <div className="section-header p-6 pb-0">
                        <div>
                            <p className="eyebrow">Coupons</p>
                            <h2 className="text-2xl font-black text-slate-900">
                                Active Coupons
                            </h2>
                        </div>
                    </div>

                    <table className="data-table mt-4">

                        <thead>

                            <tr>

                               <th>Code</th>
<th>Discount</th>
<th>Expiry</th>
<th>Used</th>
<th>Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            {coupons.map((coupon, index) => (

                                <motion.tr
                                    key={coupon.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >

                                   <td className="font-black">
                                        {coupon.couponCode}
                                    </td>

                                    <td>
                                        {coupon.discountPercentage}%
                                    </td>

                                   <td>
                                        {coupon.expiryDate}
                                    </td>
<td>
                                        {coupon.usedCount}
                                        /
                                        {coupon.maxUses}
                                    </td>

                                   <td>

                                        <button
                                            onClick={() =>
                                                deleteCoupon(
                                                    coupon.id
                                                )
                                            }
                                            className="btn danger min-h-0 px-3 py-2 text-sm"
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </motion.tr>

                            ))}

                            {coupons.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center font-bold text-slate-500">
                                        No coupons found
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </motion.section>

                <motion.section
                    className="panel mt-6 overflow-x-auto"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 }}
                >

                    <div className="section-header p-6 pb-0">
                        <div>
                            <p className="eyebrow">Live Queue</p>
                            <h2 className="text-2xl font-black text-slate-900">
                                Orders
                            </h2>
                        </div>
                    </div>

                    <table className="data-table mt-4">

                        <thead>

                            <tr>

                                <th>Order ID</th>
                                <th>Name</th>
                                <th>Location</th>
                                <th>User ID</th>
                                <th>File</th>
                                <th>Pages</th>
                                <th>Copies</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>PDF</th>

                            </tr>

                        </thead>

                        <tbody>

                            {orders.map((order, index) => (

                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.025 }}
                                >

                                    <td className="font-black">
                                        {order.orderId}
                                    </td>

                                    <td className="font-bold">
                                        {order.customerName || "Customer"}
                                    </td>

                                    <td>
                                        {order.blockLocation || "C Block"}
                                    </td>

                                    <td>
                                        {order.userId}
                                    </td>

                                    <td className="max-w-[220px] truncate font-bold">
                                        {order.fileName}
                                    </td>

                                    <td>
                                        {order.selectedPages}
                                    </td>

                                    <td>
                                        {order.copies}
                                    </td>

                                    <td>
                                        {order.printType}
                                    </td>

                                    <td className="font-black">
                                        Rs. {order.price}
                                    </td>

                                    <td>
                                        <span className={paymentClass(order.paymentStatus)}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="flex flex-col items-start gap-2">
                                            <span className={statusClass(order.status)}>
                                                {order.status}
                                            </span>

                                            {order.status ===
                                                "QUEUE" && (

                                                <button
                                                    onClick={() =>
                                                        updateStatus(
                                                            order.id,
                                                            "PRINTING"
                                                        )
                                                    }
                                                    className="btn warning min-h-0 px-3 py-2 text-sm"
                                                >
                                                    Printing
                                                </button>

                                            )}

                                            {order.status ===
                                                "PRINTING" && (

                                                <button
                                                    onClick={() =>
                                                        updateStatus(
                                                            order.id,
                                                            "COMPLETED"
                                                        )
                                                    }
                                                    className="btn success min-h-0 px-3 py-2 text-sm"
                                                >
                                                    Completed
                                                </button>

                                            )}
                                        </div>
                                    </td>

                                    <td>

                                        <button
                                            onClick={() =>
                                                downloadPdf(
                                                    order.id
                                                )
                                            }
                                            className="btn secondary min-h-0 px-3 py-2 text-sm"
                                        >
                                            Download
                                        </button>

                                    </td>

                                </motion.tr>

                            ))}

                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="12" className="text-center font-bold text-slate-500">
                                        No orders found
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

export default AdminDashboard;
