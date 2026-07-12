import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { getPdfDownloadUrl } from "../services/api";
import CustomModal from "../components/CustomModal";

function AdminDashboard() {
    const navigate = useNavigate();

    const [coupons, setCoupons] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [revenuePeriod, setRevenuePeriod] = useState("all");

    const [bwPrice, setBwPrice] = useState(0);
    const [colorPrice, setColorPrice] = useState(0);

    const [couponCode, setCouponCode] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [maxUses, setMaxUses] = useState("");

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedCoupons, setSelectedCoupons] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [selectedPricingBlock, setSelectedPricingBlock] = useState("C Block");
    const [activeTab, setActiveTab] = useState("queue");

    // Dynamic settings & blocks
    const [blocks, setBlocks] = useState([]);
    const [newBlockName, setNewBlockName] = useState("");
    const [printers, setPrinters] = useState([]);
    const [printerPapers, setPrinterPapers] = useState({});
    const [sections, setSections] = useState([]);
    const [systemSettings, setSystemSettings] = useState({
        referralEnabled: true,
        referrerAmount: 10.0,
        refereeAmount: 5.0,
        popupEnabled: true,
        popupMessage: "",
        adEnabled: true,
        adText: "",
        generalPopupEnabled: false,
        generalPopupMessage: ""
    });

    // Rewards & Voucher creator states
    const [rewards, setRewards] = useState([]);
    const [rewardTitle, setRewardTitle] = useState("");
    const [rewardDesc, setRewardDesc] = useState("");
    const [rewardAmt, setRewardAmt] = useState("");
    const [rewardCode, setRewardCode] = useState("");
    const [rewardMaxClaims, setRewardMaxClaims] = useState(100);
    const [creatingReward, setCreatingReward] = useState(false);

    // SQL Console states
    const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users;");
    const [sqlResult, setSqlResult] = useState(null);
    const [sqlError, setSqlError] = useState("");
    const [sqlExecuting, setSqlExecuting] = useState(false);

    // Section Creator States
    const [secTitle, setSecTitle] = useState("");
    const [secContent, setSecContent] = useState("");
    const [secType, setSecType] = useState("ADVERTISING");
    const [secImage, setSecImage] = useState("");
    const [secRedirect, setSecRedirect] = useState("");
    const [secOrder, setSecOrder] = useState(0);

    // Custom Popups States
    const [popups, setPopups] = useState([]);
    const [popTitle, setPopTitle] = useState("");
    const [popMessage, setPopMessage] = useState("");
    const [popTarget, setPopTarget] = useState("ALL");
    const [popDismissible, setPopDismissible] = useState(true);
    const [popActive, setPopActive] = useState(true);

    // Custom Modal configs
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: null
    });

    const showAlert = (title, message, type = "info") => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: null
        });
    };

    const showConfirm = (title, message, onConfirm) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type: "confirm",
            onConfirm
        });
    };

    const exportToCSV = (data, filename, headers) => {
        if (!data || !data.length) {
            showAlert("No Data", "There is no data to export.", "warning");
            return;
        }

        const csvRows = [];
        csvRows.push(headers.join(","));

        for (const row of data) {
            const values = headers.map(header => {
                let val = "";
                if (header === "User ID" || header === "ID") val = row.id != null ? row.id : "";
                else if (header === "Name") val = row.name != null ? row.name : "";
                else if (header === "Username" || header === "Email") val = row.email != null ? row.email : "";
                else if (header === "Referral Code") val = row.referralCode != null ? row.referralCode : "";
                else if (header === "Wallet Balance") val = row.walletBalance != null ? row.walletBalance.toFixed(2) : "0.00";
                else if (header === "Status") val = row.blocked ? "BLOCKED" : "ACTIVE";

                // For Orders
                else if (header === "Order ID") val = row.orderId != null ? row.orderId : "";
                else if (header === "Location") val = row.blockLocation != null ? row.blockLocation : "";
                else if (header === "Customer") val = row.customerName != null ? row.customerName : "";
                else if (header === "Pages") val = row.selectedPages != null ? row.selectedPages : "";
                else if (header === "Copies") val = row.copies != null ? row.copies : "";
                else if (header === "Price") val = row.price != null ? row.price : "";
                else if (header === "Payment") val = row.razorpayPaymentId != null ? row.razorpayPaymentId : "UNPAID";
                else if (header === "Order Status") val = row.status != null ? row.status : "";

                // For Coupons
                else if (header === "Code") val = row.couponCode != null ? row.couponCode : "";
                else if (header === "Discount") val = row.discountPercentage != null ? row.discountPercentage + "%" : "";
                else if (header === "Expiry") val = row.expiryDate != null ? row.expiryDate : "";
                else if (header === "Used") val = `${row.usedCount != null ? row.usedCount : 0} / ${row.maxUses != null ? row.maxUses : 0}`;

                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(","));
        }

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkDeleteUsers = () => {
        if (selectedUsers.length === 0) return;
        const toDeleteCount = selectedUsers.length;
        showConfirm(
            "Bulk Delete Users",
            `Are you sure you want to delete the ${toDeleteCount} selected users permanently? All their wallet and order history will be deleted.`,
            async () => {
                try {
                    for (const userId of selectedUsers) {
                        await api.delete("/admin/users/delete", { params: { id: userId } });
                    }
                    setSelectedUsers([]);
                    fetchUsers();
                    showAlert("Success", `${toDeleteCount} users deleted successfully`, "success");
                } catch (error) {
                    console.error("Error performing bulk delete:", error);
                    showAlert("Error", "Failed to delete all selected users", "error");
                }
            }
        );
    };

    const handleBulkBlockUsers = async (block) => {
        if (selectedUsers.length === 0) return;
        showConfirm(
            block ? "Bulk Block Users" : "Bulk Unblock Users",
            `Are you sure you want to ${block ? "block" : "unblock"} the ${selectedUsers.length} selected users?`,
            async () => {
                try {
                    for (const userId of selectedUsers) {
                        const user = users.find(u => u.id === userId);
                        if (user && user.blocked !== block) {
                            await api.post("/admin/users/toggle-block", null, { params: { id: userId } });
                        }
                    }
                    setSelectedUsers([]);
                    fetchUsers();
                    showAlert("Success", `Selected users updated successfully`, "success");
                } catch (error) {
                    console.error("Error performing bulk block toggle:", error);
                    showAlert("Error", `Failed to update selected users`, "error");
                }
            }
        );
    };

    const handleBulkDeleteCoupons = () => {
        if (selectedCoupons.length === 0) return;
        const toDeleteCount = selectedCoupons.length;
        showConfirm(
            "Bulk Delete Coupons",
            `Are you sure you want to delete the ${toDeleteCount} selected coupons permanently?`,
            async () => {
                try {
                    for (const couponId of selectedCoupons) {
                        await api.post("/coupon/delete", null, { params: { id: couponId } });
                    }
                    setSelectedCoupons([]);
                    fetchCoupons();
                    showAlert("Success", `${toDeleteCount} coupons deleted successfully`, "success");
                } catch (error) {
                    console.error("Error performing bulk coupon delete:", error);
                    showAlert("Error", "Failed to delete all selected coupons", "error");
                }
            }
        );
    };


    useEffect(() => {
        const adminId = localStorage.getItem("adminId");
        if (!adminId) {
            navigate("/admin-login");
            return;
        }
        
        fetchCoupons();
        fetchOrders();
        fetchStats();
        fetchPrices(selectedPricingBlock);
        fetchBlocks();

        const interval = setInterval(() => {
            fetchOrders();
            fetchStats();
        }, 3000);

        return () => clearInterval(interval);
    }, [revenuePeriod]);

    useEffect(() => {
        fetchStats();
    }, [revenuePeriod]);

    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers();
        } else if (activeTab === "support") {
            fetchSupportTickets();
        } else if (activeTab === "settings") {
            fetchPrices(selectedPricingBlock);
            fetchCoupons();
            fetchBlocks();
        } else if (activeTab === "frontend") {
            fetchSystemSettings();
            fetchSections();
            fetchPopups();
        } else if (activeTab === "system") {
            fetchSystemSettings();
            fetchBlocks();
            fetchPrinters();
        } else if (activeTab === "rewards") {
            fetchRewards();
        }
    }, [activeTab]);

    const deleteCoupon = async (id) => {
        try {
            await api.post("/coupon/delete", null, {
                params: { id }
            });
            fetchCoupons();
            showAlert("Deleted", "Coupon Deleted Successfully", "success");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Failed to delete coupon", "error");
        }
    };

    const getPagesCount = (order) => {
        if (!order.selectedPages || order.selectedPages.toUpperCase() === "ALL") {
            return order.totalPages || 0;
        }
        const cleaned = order.selectedPages.split(',').map(x => x.trim()).filter(Boolean);
        return cleaned.length || order.totalPages || 0;
    };

    const showPagesDetails = (order) => {
        const count = getPagesCount(order);
        const details = order.selectedPages && order.selectedPages.toUpperCase() !== "ALL" 
            ? order.selectedPages.replace(/^,/, "")
            : `All pages (1 - ${order.totalPages || count})`;
        showAlert(
            "Selected Pages Details",
            `Total Pages to Print: ${count}\n\nPage numbers: ${details}`,
            "info"
        );
    };

    const fetchCoupons = async () => {
        try {
            const response = await api.get("/coupon/all");
            setCoupons(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await api.get("/pdf/orders");
            setOrders(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/pdf/stats", {
                params: { period: revenuePeriod }
            });
            setStats(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPrices = async (block = selectedPricingBlock) => {
        try {
            const response = await api.get("/pricing/all", {
                params: { blockLocation: block }
            });
            let bwVal = 2.0;
            let colorVal = 5.0;
            response.data.forEach((p) => {
                if (p.printType === "BW") {
                    bwVal = p.pricePerPage;
                }
                if (p.printType === "COLOR") {
                    colorVal = p.pricePerPage;
                }
            });
            setBwPrice(bwVal);
            setColorPrice(colorVal);
        } catch (error) {
            console.error("Error fetching prices:", error);
        }
    };

    const savePrices = async () => {
        try {
            await api.post("/pricing/update", null, {
                params: {
                    printType: "BW",
                    pricePerPage: bwPrice,
                    blockLocation: selectedPricingBlock
                }
            });

            await api.post("/pricing/update", null, {
                params: {
                    printType: "COLOR",
                    pricePerPage: colorPrice,
                    blockLocation: selectedPricingBlock
                }
            });

            showAlert("Success", `Prices Updated Successfully for ${selectedPricingBlock}`, "success");
        } catch (error) {
            console.error(error);
            showAlert("Error", "Unable to Update Prices", "error");
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get("/admin/users");
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const toggleBlockUser = async (userId) => {
        try {
            await api.post("/admin/users/toggle-block", null, {
                params: { id: userId }
            });
            fetchUsers();
        } catch (error) {
            console.error("Error toggling block status:", error);
            showAlert("Error", "Failed to toggle block status", "error");
        }
    };

    const deleteUser = async (userId) => {
        showConfirm(
            "Confirm Delete",
            "Are you sure you want to delete this user permanently? All wallet records and orders for this user will be impacted.",
            async () => {
                try {
                    await api.delete("/admin/users/delete", {
                        params: { id: userId }
                    });
                    fetchUsers();
                    showAlert("Success", "User accounts deleted successfully", "success");
                } catch (error) {
                    console.error("Error deleting user:", error);
                    showAlert("Error", "Failed to delete user", "error");
                }
            }
        );
    };

    const fetchSupportTickets = async () => {
        try {
            const response = await api.get("/support/all");
            setSupportTickets(response.data);
        } catch (error) {
            console.error("Error fetching support tickets:", error);
        }
    };

    const resolveSupportTicket = async (id) => {
        try {
            await api.post("/support/resolve", null, {
                params: { id }
            });
            showAlert("Success", "Ticket marked as resolved", "success");
            fetchSupportTickets();
        } catch (err) {
            console.error("Error resolving ticket:", err);
            showAlert("Error", "Failed to resolve support ticket", "error");
        }
    };

    const deleteSupportTicket = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this support ticket permanently?", async () => {
            try {
                await api.delete("/support/delete", {
                    params: { id }
                });
                showAlert("Success", "Support ticket deleted successfully", "success");
                fetchSupportTickets();
            } catch (err) {
                console.error("Error deleting ticket:", err);
                showAlert("Error", "Failed to delete support ticket", "error");
            }
        });
    };

    const resetStats = async () => {
        showConfirm(
            "CRITICAL WARNING",
            "This will permanently delete ALL orders and printing history. This action CANNOT be undone. Are you sure you want to proceed?",
            async () => {
                try {
                    await api.post("/admin/reset-stats");
                    showAlert("Reset Success", "Statistics and order logs have been reset successfully.", "success");
                    fetchStats();
                    fetchOrders();
                } catch (error) {
                    console.error("Error resetting stats:", error);
                    showAlert("Error", "Failed to reset statistics", "error");
                }
            }
        );
    };

    const createCoupon = async () => {
        if (Number(discountPercentage) > 95) {
            showAlert("Discount Constraint", "Maximum allowed coupon discount limit is 95%.", "error");
            return;
        }
        try {
            await api.post("/coupon/create", {
                couponCode,
                discountPercentage,
                expiryDate,
                maxUses
            });

            showAlert("Success", "Coupon Created Successfully", "success");
            fetchCoupons();
            setCouponCode("");
            setDiscountPercentage("");
            setExpiryDate("");
            setMaxUses("");
        } catch (error) {
            console.error(error);
            showAlert("Error", error.response?.data?.message || "Unable To Create Coupon", "error");
        }
    };

    // Rewards & Voucher API calls
    const fetchRewards = async () => {
        try {
            const response = await api.get("/rewards/all");
            setRewards(response.data || []);
        } catch (err) {
            console.error("Failed to fetch rewards", err);
        }
    };

    const createReward = async (e) => {
        e.preventDefault();
        if (!rewardTitle.trim() || !rewardDesc.trim() || !rewardAmt || !rewardCode.trim()) {
            showAlert("Required Fields", "Please fill in all reward voucher details.", "warning");
            return;
        }

        setCreatingReward(true);
        try {
            await api.post("/rewards/create", {
                title: rewardTitle.trim(),
                description: rewardDesc.trim(),
                rewardAmount: Number(rewardAmt),
                claimCode: rewardCode.trim().toUpperCase(),
                maxClaims: Number(rewardMaxClaims),
                claimedCount: 0,
                active: true
            });

            showAlert("Success", "Reward voucher created successfully!", "success");
            setRewardTitle("");
            setRewardDesc("");
            setRewardAmt("");
            setRewardCode("");
            setRewardMaxClaims(100);
            fetchRewards();
        } catch (err) {
            console.error(err);
            showAlert("Creation Failed", err.response?.data || "Could not create reward voucher.", "error");
        } finally {
            setCreatingReward(false);
        }
    };

    const toggleRewardActive = async (id, currentActive) => {
        try {
            await api.post("/rewards/update-status", null, {
                params: { id, active: !currentActive }
            });
            fetchRewards();
        } catch (err) {
            console.error(err);
            showAlert("Error", "Failed to update reward status", "error");
        }
    };

    const deleteReward = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this reward voucher permanently?", async () => {
            try {
                await api.delete("/rewards/delete", {
                    params: { id }
                });
                showAlert("Success", "Reward voucher deleted successfully", "success");
                fetchRewards();
            } catch (err) {
                console.error(err);
                showAlert("Error", "Failed to delete reward voucher", "error");
            }
        });
    };

    const updateStatus = async (id, status) => {
        try {
            await api.post("/pdf/updateStatus", null, {
                params: { id, status }
            });
            fetchOrders();
            fetchStats();
        } catch (error) {
            console.error(error);
        }
    };

    const downloadPdf = (id) => {
        window.open(getPdfDownloadUrl(id), "_blank");
    };

    const logout = () => {
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminUser");
        navigate("/admin-login");
    };

    const statusClass = (status) => {
        if (status === "CANCELLED") return "status-pill status-unpaid";
        if (status === "CANCEL_WINDOW") return "status-pill status-unpaid";
        if (status === "QUEUE") return "status-pill status-created";
        if (status === "COMPLETED") return "status-pill status-completed";
        if (status === "PRINTING") return "status-pill status-printing";
        return "status-pill status-created";
    };

    const paymentClass = (status) =>
        status === "PAID" ? "status-pill status-paid" : "status-pill status-unpaid";

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

    // Dynamic blocks & refills helper methods
    const fetchBlocks = async () => {
        try {
            const response = await api.get("/blocks/all");
            setBlocks(response.data || []);
        } catch (error) {
            console.error("Error fetching blocks:", error);
        }
    };

    const fetchPrinters = async () => {
        try {
            const response = await api.get("/printer/all");
            setPrinters(response.data || []);
            
            const papersMap = {};
            for (const printer of response.data) {
                try {
                    const paperRes = await api.get("/printer/paper", {
                        params: { blockLocation: printer.blockLocation }
                    });
                    papersMap[printer.blockLocation] = paperRes.data != null ? paperRes.data : 0;
                } catch (err) {
                    console.error("Error fetching paper count for", printer.blockLocation, err);
                }
            }
            setPrinterPapers(papersMap);
        } catch (error) {
            console.error("Error fetching printers:", error);
        }
    };

    const updatePrinterPaper = async (blockLoc, count) => {
        try {
            await api.post("/printer/updatePaper", null, {
                params: {
                    blockLocation: blockLoc,
                    paperCount: count
                }
            });
            showAlert("Success", `Paper count updated successfully for ${blockLoc}`, "success");
            fetchPrinters();
        } catch (error) {
            console.error("Failed to update paper count:", error);
            showAlert("Error", "Failed to update paper count", "error");
        }
    };

    const addBlock = async (e) => {
        e.preventDefault();
        if (!newBlockName.trim()) {
            showAlert("Required", "Please enter a block name", "warning");
            return;
        }
        try {
            await api.post("/blocks/add", null, {
                params: { name: newBlockName.trim() }
            });
            showAlert("Success", `Block '${newBlockName}' added and default prices initialized.`, "success");
            setNewBlockName("");
            fetchBlocks();
        } catch (error) {
            console.error("Error adding block:", error);
            showAlert("Failed", error.response?.data || "Failed to add block", "error");
        }
    };

    const fetchSystemSettings = async () => {
        try {
            const response = await api.get("/admin/settings");
            setSystemSettings(response.data);
        } catch (error) {
            console.error("Error fetching admin settings:", error);
        }
    };

    const saveSystemSettings = async (e) => {
        e.preventDefault();
        try {
            await api.post("/admin/settings/update", systemSettings);
            showAlert("Success", "System Settings Updated Successfully", "success");
        } catch (error) {
            console.error("Error updating system settings:", error);
            showAlert("Error", "Failed to update system settings", "error");
        }
    };

    const fetchSections = async () => {
        try {
            const response = await api.get("/sections/all");
            setSections(response.data || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const addSection = async (e) => {
        e.preventDefault();
        if (!secTitle.trim() || !secContent.trim()) {
            showAlert("Required Fields", "Title and Content are required", "warning");
            return;
        }
        try {
            await api.post("/sections/add", {
                title: secTitle.trim(),
                content: secContent.trim(),
                sectionType: secType,
                imageUrl: secImage.trim() || null,
                redirectUrl: secRedirect.trim() || null,
                displayOrder: Number(secOrder || 0),
                active: true
            });
            showAlert("Success", "Frontend Section Added Successfully", "success");
            setSecTitle("");
            setSecContent("");
            setSecImage("");
            setSecRedirect("");
            setSecOrder(0);
            fetchSections();
        } catch (error) {
            console.error("Error adding section:", error);
            showAlert("Error", "Failed to add section", "error");
        }
    };

    const toggleSectionStatus = async (id, currentStatus) => {
        try {
            await api.post("/sections/update-status", null, {
                params: {
                    id,
                    active: !currentStatus
                }
            });
            showAlert("Success", "Section status updated", "success");
            fetchSections();
        } catch (error) {
            console.error("Error toggling section status:", error);
            showAlert("Error", "Failed to update status", "error");
        }
    };

    const deleteSection = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this section permanently?", async () => {
            try {
                await api.delete("/sections/delete", {
                    params: { id }
                });
                showAlert("Deleted", "Section deleted successfully", "success");
                fetchSections();
            } catch (error) {
                console.error("Error deleting section:", error);
                showAlert("Error", "Failed to delete section", "error");
            }
        });
    };

    const fetchPopups = async () => {
        try {
            const response = await api.get("/popups/all");
            setPopups(response.data || []);
        } catch (error) {
            console.error("Error fetching popups:", error);
        }
    };

    const addPopup = async (e) => {
        e.preventDefault();
        if (!popTitle.trim() || !popMessage.trim()) {
            showAlert("Required Fields", "Title and Message are required", "warning");
            return;
        }
        try {
            await api.post("/popups/add", {
                title: popTitle.trim(),
                message: popMessage.trim(),
                targetPage: popTarget,
                active: popActive,
                dismissible: popDismissible
            });
            showAlert("Success", "Custom Popup Added Successfully", "success");
            setPopTitle("");
            setPopMessage("");
            setPopTarget("ALL");
            setPopDismissible(true);
            setPopActive(true);
            fetchPopups();
        } catch (error) {
            console.error("Error adding popup:", error);
            showAlert("Error", "Failed to add popup", "error");
        }
    };

    const togglePopupStatus = async (id, currentStatus) => {
        try {
            await api.post("/popups/update-status", null, {
                params: {
                    id,
                    active: !currentStatus
                }
            });
            showAlert("Success", "Popup status updated", "success");
            fetchPopups();
        } catch (error) {
            console.error("Error toggling popup status:", error);
            showAlert("Error", "Failed to update status", "error");
        }
    };

    const deletePopup = async (id) => {
        showConfirm("Confirm Delete", "Are you sure you want to delete this popup permanently?", async () => {
            try {
                await api.delete("/popups/delete", {
                    params: { id }
                });
                showAlert("Deleted", "Popup deleted successfully", "success");
                fetchPopups();
            } catch (error) {
                console.error("Error deleting popup:", error);
                showAlert("Error", "Failed to delete popup", "error");
            }
        });
    };

    const runSqlQuery = async (e) => {
        e.preventDefault();
        if (!sqlQuery.trim()) {
            setSqlError("Query cannot be empty");
            return;
        }
        setSqlExecuting(true);
        setSqlResult(null);
        setSqlError("");
        try {
            const response = await api.post("/admin/sql", { query: sqlQuery });
            setSqlResult(response.data);
        } catch (error) {
            console.error("SQL Error:", error);
            setSqlError(error.response?.data || error.message || "Failed to execute query");
        } finally {
            setSqlExecuting(false);
        }
    };

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

                {/* Tabs Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200/60 pb-3 mb-6 mt-6">
                    <button
                        onClick={() => setActiveTab("queue")}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "queue"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        Queue & Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab("order-queue")}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "order-queue"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        🖨️ Order Queue
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("settings");
                            fetchPrices(selectedPricingBlock);
                            fetchCoupons();
                            fetchBlocks();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "settings"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        Pricing & Coupons
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("users");
                            fetchUsers();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "users"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        User Moderation
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("support");
                            fetchSupportTickets();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "support"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        Support Tickets
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("frontend");
                            fetchSystemSettings();
                            fetchSections();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "frontend"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        Frontend Manager
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("system");
                            fetchSystemSettings();
                            fetchBlocks();
                            fetchPrinters();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "system"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        System Config
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("rewards");
                            fetchRewards();
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "rewards"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        Rewards Panel
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("sql");
                            setSqlResult(null);
                            setSqlError("");
                        }}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                            activeTab === "sql"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100/60"
                        }`}
                    >
                        SQL Terminal
                    </button>
                </div>

                {/* Queue & Analytics Tab */}
                {activeTab === "queue" && (
                    <>
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

                                <div className="flex flex-wrap items-center gap-3">
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
                                    <button
                                        onClick={resetStats}
                                        className="btn danger px-4 py-2 text-sm font-bold min-h-0"
                                    >
                                        Reset Stats
                                    </button>
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

                        <motion.section
                            className="panel mt-6 overflow-x-auto p-6"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 }}
                        >
                            <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="eyebrow">Order history</p>
                                    <h2 className="text-2xl font-black text-slate-900">
                                        All Orders History
                                    </h2>
                                </div>
                                <button
                                    onClick={() => exportToCSV(orders, "active_orders", ["Order ID", "Location", "Customer", "Pages", "Copies", "Price", "Payment", "Order Status"])}
                                    className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                                >
                                    📥 Export Excel
                                </button>
                            </div>

                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Location</th>
                                        <th>Customer</th>
                                        <th>Pages</th>
                                        <th>Copies</th>
                                        <th>Price</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.map((order, index) => (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <td className="font-black">
                                                {order.orderId}
                                            </td>
                                            <td className="font-bold">
                                                {order.blockLocation || "C Block"}
                                            </td>
                                            <td className="font-bold text-slate-900">
                                                {order.customerName || "Customer"}
                                            </td>
                                            <td>
                                             <button
                                                 onClick={() => showPagesDetails(order)}
                                                 className="text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
                                             >
                                                 {getPagesCount(order)}
                                             </button>
                                         </td>
                                            <td>{order.copies}</td>
                                            <td className="font-black text-slate-900">
                                                Rs. {order.price}
                                            </td>
                                            <td>
                                                <span className={paymentClass(order.paymentStatus)}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                                    className="field py-1 px-2 text-xs font-bold"
                                                    style={{ width: "auto", minHeight: "30px" }}
                                                >
                                                    <option value="CANCEL_WINDOW">CANCEL WINDOW</option>
                                                    <option value="QUEUE">QUEUE</option>
                                                    <option value="PRINTING">PRINTING</option>
                                                    <option value="COMPLETED">COMPLETED</option>
                                                    <option value="CANCELLED">CANCELLED</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => downloadPdf(order.id)}
                                                    className="btn secondary min-h-0 px-3 py-1.5 text-xs font-black"
                                                >
                                                    Download
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}

                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="text-center font-bold text-slate-500 py-6">
                                                No print orders in queue
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.section>
                    </>
                )}

                {/* Order Queue Tab */}
                {activeTab === "order-queue" && (
                    <motion.section
                        className="panel mt-2 overflow-x-auto p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <p className="eyebrow">Live print queue</p>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Active Order Queue
                                </h2>
                                <p className="subtitle">
                                    Orders currently in the print pipeline. Refreshes every 3 seconds.
                                </p>
                            </div>
                            <button
                                onClick={() => exportToCSV(
                                    orders.filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status)),
                                    "order_queue",
                                    ["Order ID", "Location", "Customer", "Pages", "Copies", "Price", "Payment", "Order Status"]
                                )}
                                className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                            >
                                📥 Export Queue
                            </button>
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Location</th>
                                    <th>Customer</th>
                                    <th>Pages</th>
                                    <th>Copies</th>
                                    <th>Price</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>OTP Code</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders
                                    .filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status))
                                    .map((order, index) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <td className="font-black">{order.orderId}</td>
                                        <td className="font-bold">{order.blockLocation || "—"}</td>
                                        <td className="font-bold text-slate-900">{order.customerName || "Customer"}</td>
                                             <td>
                                                 <button
                                                     onClick={() => showPagesDetails(order)}
                                                     className="text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer"
                                                 >
                                                     {getPagesCount(order)}
                                                 </button>
                                             </td>
                                        <td>{order.copies}</td>
                                        <td className="font-black text-slate-900">Rs. {order.price}</td>
                                        <td>
                                            <span className={paymentClass(order.paymentStatus)}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={statusClass(order.status)}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="font-black text-sky-600 tracking-widest">
                                            {order.otpCode || "—"}
                                        </td>
                                        <td>
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateStatus(order.id, e.target.value)}
                                                className="field py-1 px-2 text-xs font-bold"
                                                style={{ width: "auto", minHeight: "30px" }}
                                            >
                                                <option value="CANCEL_WINDOW">CANCEL WINDOW</option>
                                                <option value="PENDING_SCAN">PENDING SCAN</option>
                                                <option value="QUEUE">QUEUE</option>
                                                <option value="PRINTING">PRINTING</option>
                                                <option value="COMPLETED">COMPLETED</option>
                                                <option value="CANCELLED">CANCELLED</option>
                                            </select>
                                        </td>
                                    </motion.tr>
                                ))}

                                {orders.filter(o => ["CANCEL_WINDOW", "PENDING_SCAN", "QUEUE", "PRINTING"].includes(o.status)).length === 0 && (
                                    <tr>
                                        <td colSpan="10" className="text-center font-bold text-slate-500 py-6">
                                            No active orders in the print queue
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </motion.section>
                )}

                {/* Pricing & Coupons Tab */}
                {activeTab === "settings" && (
                    <>
                        <div className="grid gap-6 md:grid-cols-2">
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header">
                                    <div>
                                        <p className="eyebrow">Price Settings</p>
                                        <h2 className="text-2xl font-black text-slate-900">
                                            Rate Configuration
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">
                                            Select Block for Pricing
                                        </span>
                                        <select
                                            value={selectedPricingBlock}
                                            onChange={(e) => {
                                                setSelectedPricingBlock(e.target.value);
                                                fetchPrices(e.target.value);
                                            }}
                                            className="field"
                                        >
                                            {blocks.map(b => (
                                                <option key={b.id} value={b.name}>{b.name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">
                                            Black & White rate (Rs./page)
                                        </span>
                                        <input
                                            type="number"
                                            value={bwPrice}
                                            onChange={(e) => setBwPrice(e.target.value)}
                                            className="field"
                                            step="0.5"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-black text-slate-700">
                                            Color rate (Rs./page)
                                        </span>
                                        <input
                                            type="number"
                                            value={colorPrice}
                                            onChange={(e) => setColorPrice(e.target.value)}
                                            className="field"
                                            step="0.5"
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
                                transition={{ delay: 0.05 }}
                            >
                                <div className="section-header">
                                    <div>
                                        <p className="eyebrow">Discounts</p>
                                        <h2 className="text-2xl font-black text-slate-900">
                                            Coupon Generator
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Coupon Code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="field"
                                    />

                                    <input
                                        type="number"
                                        placeholder="Discount % (Max 95%)"
                                        value={discountPercentage}
                                        onChange={(e) => setDiscountPercentage(e.target.value)}
                                        className="field"
                                        max="95"
                                    />

                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="field"
                                    />

                                    <input
                                        type="number"
                                        placeholder="Max Uses"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                        className="field"
                                    />

                                    <button
                                        onClick={createCoupon}
                                        className="btn w-full mt-2"
                                    >
                                        Create Coupon
                                    </button>
                                </div>
                            </motion.section>
                        </div>

                        <motion.section
                            className="panel mt-6 overflow-x-auto"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="section-header p-6 pb-0 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="eyebrow">Coupons</p>
                                    <h2 className="text-2xl font-black text-slate-900">
                                        Active Coupons
                                    </h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => exportToCSV(coupons, "coupons_list", ["Code", "Discount", "Expiry", "Used"])}
                                        className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                                    >
                                        📥 Export Excel
                                    </button>
                                    {selectedCoupons.length > 0 && (
                                        <button
                                            onClick={handleBulkDeleteCoupons}
                                            className="btn danger px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            🗑️ Delete Selected ({selectedCoupons.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            <table className="data-table mt-4">
                                <thead>
                                    <tr>
                                        <th className="w-10">
                                            <input
                                                type="checkbox"
                                                checked={coupons.length > 0 && selectedCoupons.length === coupons.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCoupons(coupons.map(c => c.id));
                                                    } else {
                                                        setSelectedCoupons([]);
                                                    }
                                                }}
                                                className="w-4 h-4 rounded accent-slate-900"
                                            />
                                        </th>
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
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCoupons.includes(coupon.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCoupons(prev => [...prev, coupon.id]);
                                                        } else {
                                                            setSelectedCoupons(prev => prev.filter(id => id !== coupon.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded accent-slate-900"
                                                />
                                            </td>
                                            <td className="font-black">
                                                {coupon.couponCode}
                                            </td>
                                            <td className="font-bold text-green-600">
                                                {coupon.discountPercentage}%
                                            </td>
                                            <td>
                                                {coupon.expiryDate}
                                            </td>
                                            <td>
                                                {coupon.usedCount} / {coupon.maxUses}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => deleteCoupon(coupon.id)}
                                                    className="btn danger min-h-0 px-3 py-2 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {coupons.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center font-bold text-slate-500 py-6">
                                                No coupons found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.section>
                    </>
                )}

                {/* User Moderation Tab */}
                {activeTab === "users" && (
                    <motion.section
                        className="panel mt-6 overflow-x-auto p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="section-header pb-4 flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <p className="eyebrow">Moderation</p>
                                <h2 className="text-2xl font-black text-slate-900">Registered Users</h2>
                                <p className="subtitle">Manage user accounts, block access, or remove accounts.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => exportToCSV(users, "registered_users", ["User ID", "Name", "Email", "Referral Code", "Wallet Balance", "Status"])}
                                    className="btn secondary px-4 py-2 text-sm font-bold min-h-0"
                                >
                                    📥 Export Excel
                                </button>
                                {selectedUsers.length > 0 && (
                                    <>
                                        <button
                                            onClick={() => handleBulkBlockUsers(true)}
                                            className="btn warning px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            ⛔ Block Selected ({selectedUsers.length})
                                        </button>
                                        <button
                                            onClick={() => handleBulkBlockUsers(false)}
                                            className="btn success px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            ✅ Unblock Selected ({selectedUsers.length})
                                        </button>
                                        <button
                                            onClick={handleBulkDeleteUsers}
                                            className="btn danger px-4 py-2 text-sm font-bold min-h-0"
                                        >
                                            🗑️ Delete Selected ({selectedUsers.length})
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <table className="data-table mt-4 w-full">
                            <thead>
                                <tr>
                                    <th className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={users.length > 0 && selectedUsers.length === users.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedUsers(users.map(u => u.id));
                                                } else {
                                                    setSelectedUsers([]);
                                                }
                                            }}
                                            className="w-4 h-4 rounded accent-slate-900"
                                        />
                                    </th>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Referral Code</th>
                                    <th>Wallet Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUsers(prev => [...prev, user.id]);
                                                    } else {
                                                        setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                                    }
                                                }}
                                                className="w-4 h-4 rounded accent-slate-900"
                                            />
                                        </td>
                                        <td className="font-black">#{user.id}</td>
                                        <td className="font-bold text-slate-900">{user.name}</td>
                                        <td className="font-semibold text-slate-600">{user.email}</td>
                                        <td className="font-mono text-cyan-600 font-bold">{user.referralCode || "N/A"}</td>
                                        <td className="font-bold text-green-600">Rs. {user.walletBalance != null ? user.walletBalance.toFixed(2) : "0.00"}</td>
                                        <td>
                                            <span className={`status-pill ${user.blocked ? "status-unpaid" : "status-paid"}`}>
                                                {user.blocked ? "BLOCKED" : "ACTIVE"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleBlockUser(user.id)}
                                                    className={`btn min-h-0 px-3 py-1.5 text-xs font-bold ${user.blocked ? "success" : "warning"}`}
                                                >
                                                    {user.blocked ? "Unblock" : "Block"}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="text-center font-bold text-slate-500 py-6">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </motion.section>
                )}

                {/* Support Tickets Tab */}
                {activeTab === "support" && (
                    <motion.section
                        className="panel mt-6 overflow-x-auto p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="section-header pb-4">
                            <div>
                                <p className="eyebrow">Support Desk</p>
                                <h2 className="text-2xl font-black text-slate-900">Customer Support Tickets</h2>
                                <p className="subtitle">View customer issues, resolve tickets, or remove them.</p>
                            </div>
                        </div>

                        <table className="data-table mt-4 w-full">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Message</th>
                                    <th>Created At</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supportTickets.map((ticket, index) => (
                                    <motion.tr
                                        key={ticket.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <td className="font-black">#{ticket.id}</td>
                                        <td className="font-bold text-slate-900">{ticket.name}</td>
                                        <td className="font-semibold text-slate-600">{ticket.email}</td>
                                        <td className="max-w-[350px] whitespace-pre-wrap text-slate-700 text-sm font-medium">
                                            {ticket.message}
                                        </td>
                                        <td className="text-xs text-slate-500 font-bold">
                                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "N/A"}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${ticket.status === "PENDING" ? "status-unpaid" : "status-completed"}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {ticket.status === "PENDING" && (
                                                    <button
                                                        onClick={() => resolveSupportTicket(ticket.id)}
                                                        className="btn success min-h-0 px-3 py-1.5 text-xs font-bold"
                                                    >
                                                        Mark as Done
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteSupportTicket(ticket.id)}
                                                    className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {supportTickets.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center font-bold text-slate-500 py-6">
                                            No support tickets found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </motion.section>
                )}

                {/* Frontend Manager Tab */}
                {activeTab === "frontend" && (
                    <div className="mt-6 space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Popup and Scrolling configurations */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Marketing Config</p>
                                        <h2 className="text-2xl font-black text-slate-900">Popups & Scrolling Marquees</h2>
                                    </div>
                                </div>
                                <form onSubmit={saveSystemSettings} className="space-y-4">
                                    <div className="flex items-center gap-2 pt-2 pb-2">
                                        <input 
                                            type="checkbox" 
                                            id="popupEnabled" 
                                            checked={systemSettings.popupEnabled}
                                            onChange={(e) => setSystemSettings({...systemSettings, popupEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-slate-900"
                                        />
                                        <label htmlFor="popupEnabled" className="text-sm font-bold text-slate-700">Welcome Referral Popup Enabled</label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Welcome Popup Message</span>
                                        <textarea 
                                            className="field min-h-[80px]" 
                                            value={systemSettings.popupMessage}
                                            onChange={(e) => setSystemSettings({...systemSettings, popupMessage: e.target.value})}
                                        />
                                    </label>
                                    <div className="flex items-center gap-2 pt-4 pb-2">
                                        <input 
                                            type="checkbox" 
                                            id="adEnabled" 
                                            checked={systemSettings.adEnabled}
                                            onChange={(e) => setSystemSettings({...systemSettings, adEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-slate-900"
                                        />
                                        <label htmlFor="adEnabled" className="text-sm font-bold text-slate-700">Scrolling Announcement Active</label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Scrolling Announcement Text</span>
                                        <textarea 
                                            className="field min-h-[80px]" 
                                            value={systemSettings.adText}
                                            onChange={(e) => setSystemSettings({...systemSettings, adText: e.target.value})}
                                        />
                                    </label>
                                    
                                    <div className="flex items-center gap-2 pt-4 pb-2 border-t border-slate-100">
                                        <input 
                                            type="checkbox" 
                                            id="generalPopupEnabled" 
                                            checked={systemSettings.generalPopupEnabled}
                                            onChange={(e) => setSystemSettings({...systemSettings, generalPopupEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-slate-900"
                                        />
                                        <label htmlFor="generalPopupEnabled" className="text-sm font-bold text-slate-700">General Announcement Popup Enabled</label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">General Announcement Popup Message</span>
                                        <textarea 
                                            className="field min-h-[80px]" 
                                            placeholder="Write an announcement to show to all users on their dashboard..."
                                            value={systemSettings.generalPopupMessage}
                                            onChange={(e) => setSystemSettings({...systemSettings, generalPopupMessage: e.target.value})}
                                        />
                                    </label>

                                    <button type="submit" className="btn success w-full mt-2">Save Marketing Config</button>
                                </form>
                            </motion.section>

                            {/* Section Creator panel */}
                            <motion.section 
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Layout Sections</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add Frontend Section</h2>
                                    </div>
                                </div>
                                <form onSubmit={addSection} className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Title</span>
                                            <input type="text" className="field" placeholder="Section title" value={secTitle} onChange={(e) => setSecTitle(e.target.value)} required />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Section Type</span>
                                            <select className="field" value={secType} onChange={(e) => setSecType(e.target.value)}>
                                                <option value="ADVERTISING">Advertising</option>
                                                <option value="NEW_BLOCK">New Block Info</option>
                                                <option value="FEATURE">Feature Announcement</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Display Order (weight)</span>
                                            <input type="number" className="field" value={secOrder} onChange={(e) => setSecOrder(e.target.value)} />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Redirect Link (optional)</span>
                                            <input type="text" className="field" placeholder="https://google.com or path" value={secRedirect} onChange={(e) => setSecRedirect(e.target.value)} />
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Content / Announcement Message</span>
                                        <textarea className="field min-h-[90px]" placeholder="Write description or announcement content details..." value={secContent} onChange={(e) => setSecContent(e.target.value)} required />
                                    </label>
                                    <button type="submit" className="btn w-full">Add Frontend Section</button>
                                </form>
                            </motion.section>
                        </div>

                        {/* Layout Sections table */}
                        <motion.section 
                            className="panel p-6 overflow-x-auto"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="section-header mb-4">
                                <div>
                                    <p className="eyebrow">Layout Banners</p>
                                    <h2 className="text-2xl font-black text-slate-900">Custom Frontend Sections</h2>
                                </div>
                            </div>
                            <table className="data-table w-full">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Content</th>
                                        <th>Order</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map(sec => (
                                        <tr key={sec.id}>
                                            <td className="font-black text-slate-900">{sec.title}</td>
                                            <td>
                                                <span className={`status-pill ${
                                                    sec.sectionType === 'ADVERTISING' ? 'status-paid' : sec.sectionType === 'NEW_BLOCK' ? 'status-completed' : 'status-created'
                                                }`} style={{ fontSize: '10px', minHeight: '22px' }}>
                                                    {sec.sectionType}
                                                </span>
                                            </td>
                                            <td className="max-w-xs truncate text-xs font-semibold text-slate-500">{sec.content}</td>
                                            <td className="font-bold">{sec.displayOrder}</td>
                                            <td>
                                                <button 
                                                    onClick={() => toggleSectionStatus(sec.id, sec.active)}
                                                    className={`status-pill ${sec.active ? 'status-paid' : 'status-unpaid'}`}
                                                    style={{ fontSize: '10px', minHeight: '22px' }}
                                                >
                                                    {sec.active ? "ACTIVE" : "INACTIVE"}
                                                </button>
                                            </td>
                                            <td>
                                                <button onClick={() => deleteSection(sec.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sections.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center font-bold text-slate-500 py-6">No custom sections defined. Create one above.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </motion.section>

                        {/* Custom Popups Management Area */}
                        <div className="grid gap-6 lg:grid-cols-2 pt-6 border-t border-slate-200/60">
                            {/* Create Popup Form */}
                            <motion.section 
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Popup Manager</p>
                                        <h2 className="text-2xl font-black text-slate-900">Add Custom Popup</h2>
                                    </div>
                                </div>
                                <form onSubmit={addPopup} className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Title</span>
                                            <input type="text" className="field" placeholder="Popup Title" value={popTitle} onChange={(e) => setPopTitle(e.target.value)} required />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Target Page</span>
                                            <select className="field" value={popTarget} onChange={(e) => setPopTarget(e.target.value)}>
                                                <option value="ALL">All Pages</option>
                                                <option value="LOGIN">Login Page</option>
                                                <option value="LOCATION_SELECTION">Location Selection</option>
                                                <option value="DASHBOARD">User Dashboard</option>
                                                <option value="CHECKOUT">Checkout Page</option>
                                            </select>
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Popup Message</span>
                                        <textarea className="field min-h-[90px]" placeholder="Write popup message/content..." value={popMessage} onChange={(e) => setPopMessage(e.target.value)} required />
                                    </label>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 pt-2">
                                            <input 
                                                type="checkbox" 
                                                id="popDismissible" 
                                                checked={popDismissible}
                                                onChange={(e) => setPopDismissible(e.target.checked)}
                                                className="w-4 h-4 accent-slate-900"
                                            />
                                            <label htmlFor="popDismissible" className="text-sm font-bold text-slate-700">Dismissible (User can close)</label>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <input 
                                                type="checkbox" 
                                                id="popActive" 
                                                checked={popActive}
                                                onChange={(e) => setPopActive(e.target.checked)}
                                                className="w-4 h-4 accent-slate-900"
                                            />
                                            <label htmlFor="popActive" className="text-sm font-bold text-slate-700">Active Immediately</label>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn w-full">Create Popup</button>
                                </form>
                            </motion.section>

                            {/* Custom Popups List */}
                            <motion.section 
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Active Alerts</p>
                                        <h2 className="text-2xl font-black text-slate-900">Manage Popups</h2>
                                    </div>
                                </div>
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Page</th>
                                            <th>Message</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {popups.map(pop => (
                                            <tr key={pop.id}>
                                                <td className="font-black text-slate-900">{pop.title}</td>
                                                <td>
                                                    <span className="status-pill status-created" style={{ fontSize: '10px', minHeight: '22px' }}>
                                                        {pop.targetPage}
                                                    </span>
                                                </td>
                                                <td className="max-w-xs truncate text-xs font-semibold text-slate-500">{pop.message}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => togglePopupStatus(pop.id, pop.active)}
                                                        className={`status-pill ${pop.active ? 'status-paid' : 'status-unpaid'}`}
                                                        style={{ fontSize: '10px', minHeight: '22px' }}
                                                    >
                                                        {pop.active ? "ACTIVE" : "INACTIVE"}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button onClick={() => deletePopup(pop.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {popups.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center font-bold text-slate-500 py-6">No custom popups created yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        </div>
                    </div>
                )}

                {/* System Config Tab */}
                {activeTab === "system" && (
                    <div className="mt-6 space-y-6">
                        {/* Connection status looping video */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">System Gateway Check</h3>
                                <p className="text-xs text-slate-500 font-bold mt-1">Live background ping check monitoring all database, API routes, and local print agents.</p>
                            </div>
                            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm animate-pulse" style={{ animationDuration: '2s' }}>
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Referral configuration */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Referrals</p>
                                        <h2 className="text-2xl font-black text-slate-900">Refer & Earn Program</h2>
                                    </div>
                                </div>
                                <form onSubmit={saveSystemSettings} className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2">
                                        <input 
                                            type="checkbox" 
                                            id="refEnabled" 
                                            checked={systemSettings.referralEnabled}
                                            onChange={(e) => setSystemSettings({...systemSettings, referralEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-slate-900"
                                        />
                                        <label htmlFor="refEnabled" className="text-sm font-bold text-slate-700">Referral Program Active</label>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Referrer Reward (Rs.)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.referrerAmount}
                                                onChange={(e) => setSystemSettings({...systemSettings, referrerAmount: Number(e.target.value)})}
                                                step="0.5"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Referee Reward (Rs.)</span>
                                            <input 
                                                type="number" 
                                                className="field" 
                                                value={systemSettings.refereeAmount}
                                                onChange={(e) => setSystemSettings({...systemSettings, refereeAmount: Number(e.target.value)})}
                                                step="0.5"
                                            />
                                        </label>
                                    </div>
                                    <button type="submit" className="btn success w-full mt-4">Save Referral Settings</button>
                                </form>
                            </motion.section>

                            <div className="space-y-6">
                                {/* Dynamic Block Creator */}
                                <motion.section 
                                    className="panel p-6"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    <div className="section-header mb-4">
                                        <div>
                                            <p className="eyebrow">Campus Blocks</p>
                                            <h2 className="text-2xl font-black text-slate-900">Add Printing Block</h2>
                                        </div>
                                    </div>
                                    <form onSubmit={addBlock} className="flex gap-3">
                                        <input 
                                            type="text" 
                                            placeholder="Block name (e.g. D Block)" 
                                            className="field"
                                            value={newBlockName}
                                            onChange={(e) => setNewBlockName(e.target.value)}
                                        />
                                        <button type="submit" className="btn">Add Block</button>
                                    </form>
                                </motion.section>

                                {/* Printers paper count refills */}
                                <motion.section 
                                    className="panel p-6"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="section-header mb-4">
                                        <div>
                                            <p className="eyebrow">Printers</p>
                                            <h2 className="text-2xl font-black text-slate-900">Printer Paper Levels</h2>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {printers.map(p => {
                                            const currentPaper = printerPapers[p.blockLocation] != null ? printerPapers[p.blockLocation] : 0;
                                            return (
                                                <div key={p.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                                    <div>
                                                        <p className="font-black text-slate-900">{p.blockLocation}</p>
                                                        <p className="text-xs font-bold text-slate-400">{p.printerName || "Not configured"}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            type="number" 
                                                            className="field w-24 text-center font-bold" 
                                                            key={currentPaper}
                                                            defaultValue={currentPaper}
                                                            id={`paper-${p.blockLocation}`}
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                const count = Number(document.getElementById(`paper-${p.blockLocation}`).value || 0);
                                                                updatePrinterPaper(p.blockLocation, count);
                                                            }}
                                                            className="btn secondary min-h-0 px-3 py-1.5 text-xs"
                                                        >
                                                            Refill
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {printers.length === 0 && (
                                            <p className="text-sm font-bold text-slate-500 text-center py-4">No printer configurations found. Configure them in Printer Settings.</p>
                                        )}
                                    </div>
                                </motion.section>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rewards Panel Tab */}
                {activeTab === "rewards" && (
                    <div className="mt-6 space-y-6">
                        <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
                            {/* Create Reward Voucher Form */}
                            <motion.section
                                className="panel p-6"
                                initial={{ opacity: 0, x: -18 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Rewards Program</p>
                                        <h2 className="text-2xl font-black text-slate-900">Voucher Generator</h2>
                                    </div>
                                </div>
                                <form onSubmit={createReward} className="space-y-4">
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Voucher Title</span>
                                        <input type="text" className="field" placeholder="e.g. Free Sign-up Bonus" value={rewardTitle} onChange={(e) => setRewardTitle(e.target.value)} required />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Voucher Description</span>
                                        <input type="text" className="field" placeholder="e.g. Earn Rs. 50 wallet credits instantly" value={rewardDesc} onChange={(e) => setRewardDesc(e.target.value)} required />
                                    </label>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Reward Value (Rs.)</span>
                                            <input type="number" className="field" placeholder="e.g. 50" value={rewardAmt} onChange={(e) => setRewardAmt(e.target.value)} required />
                                        </label>
                                        <label className="block">
                                            <span className="block text-xs font-bold text-slate-500 mb-1">Voucher Code (uppercase)</span>
                                            <input type="text" className="field uppercase tracking-wider font-mono" placeholder="e.g. BONUS50" value={rewardCode} onChange={(e) => setRewardCode(e.target.value)} required />
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Max Claims allowed</span>
                                        <input type="number" className="field" value={rewardMaxClaims} onChange={(e) => setRewardMaxClaims(e.target.value)} required />
                                    </label>
                                    <button type="submit" className="btn success w-full mt-2" disabled={creatingReward}>
                                        {creatingReward ? "Creating Voucher..." : "Generate Reward Code"}
                                    </button>
                                </form>
                            </motion.section>

                            {/* Active Vouchers List */}
                            <motion.section
                                className="panel p-6 overflow-x-auto"
                                initial={{ opacity: 0, x: 18 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="section-header mb-4">
                                    <div>
                                        <p className="eyebrow">Active Vouchers</p>
                                        <h2 className="text-2xl font-black text-slate-900">Vouchers List</h2>
                                    </div>
                                </div>
                                <table className="data-table w-full">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Value</th>
                                            <th>Claims</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rewards.map(rew => (
                                            <tr key={rew.id}>
                                                <td className="font-mono font-black text-slate-900 tracking-wide uppercase">{rew.claimCode}</td>
                                                <td className="font-bold text-emerald-600">Rs. {rew.rewardAmount.toFixed(2)}</td>
                                                <td className="text-xs font-bold text-slate-500">{rew.claimedCount} / {rew.maxClaims}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => toggleRewardActive(rew.id, rew.active)}
                                                        className={`status-pill ${rew.active ? 'status-paid' : 'status-unpaid'}`}
                                                        style={{ fontSize: '10px', minHeight: '22px' }}
                                                    >
                                                        {rew.active ? "ACTIVE" : "INACTIVE"}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button onClick={() => deleteReward(rew.id)} className="btn danger min-h-0 px-3 py-1.5 text-xs font-bold">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {rewards.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center font-bold text-slate-500 py-6">No reward vouchers created yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </motion.section>
                        </div>
                    </div>
                )}

                {/* SQL Terminal Tab */}
                {activeTab === "sql" && (
                    <motion.section 
                        className="panel mt-6 p-6"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="section-header pb-4">
                            <div>
                                <p className="eyebrow">Database Console</p>
                                <h2 className="text-2xl font-black text-slate-900">SQL Execution Console</h2>
                                <p className="subtitle">Execute raw database queries directly. SELECT queries will display output tables, while update statements report rows affected.</p>
                            </div>
                        </div>

                        <form onSubmit={runSqlQuery} className="space-y-4">
                            <textarea
                                value={sqlQuery}
                                onChange={(e) => setSqlQuery(e.target.value)}
                                className="field font-mono text-sm leading-relaxed min-h-[140px] bg-slate-950 text-cyan-400 border-slate-800 p-4 focus:ring-4 focus:ring-cyan-950"
                                placeholder="SELECT * FROM users;"
                            />
                            <div className="flex justify-end">
                                <button type="submit" className="btn warning min-h-0 font-bold px-6 py-2.5" disabled={sqlExecuting}>
                                    {sqlExecuting ? "Executing query..." : "Execute Statement"}
                                </button>
                            </div>
                        </form>

                        {/* Error output */}
                        {sqlError && (
                            <div className="mt-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-mono whitespace-pre-wrap">
                                ⚠️ {sqlError}
                            </div>
                        )}

                        {/* Results output */}
                        {sqlResult && (
                            <div className="mt-6 border-t border-slate-100 pt-6">
                                <h3 className="text-lg font-black text-slate-900 mb-4">Query Execution Result</h3>
                                
                                {Array.isArray(sqlResult) ? (
                                    sqlResult.length > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                                            <table className="data-table w-full text-xs font-mono">
                                                <thead>
                                                    <tr>
                                                        {Object.keys(sqlResult[0]).map(col => (
                                                            <th key={col} className="bg-slate-100 text-slate-700 p-3 border-b border-slate-200 text-left font-black tracking-wider">{col}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sqlResult.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-100/80 transition-colors">
                                                            {Object.values(row).map((val, cIdx) => (
                                                                <td key={cIdx} className="p-3 border-b border-slate-200 text-slate-800 font-medium">
                                                                    {val === null ? <span className="text-slate-400 italic">null</span> : String(val)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 font-bold text-center py-6 border border-slate-100 rounded-xl bg-slate-50">
                                            Query completed successfully. Empty result set (0 rows returned).
                                        </div>
                                    )
                                ) : (
                                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold">
                                        ✓ {sqlResult.message || `Query succeeded. Rows affected: ${sqlResult.rowsAffected}`}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.section>
                )}
            </div>

            {/* Custom Premium Modal */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </main>
    );
}

export default AdminDashboard;
