import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Dashboard() {

const [bwPrice, setBwPrice] =
    useState(2);

const [colorPrice, setColorPrice] =
    useState(5);

const navigate = useNavigate();
const userId = localStorage.getItem("userId");
const userName = localStorage.getItem("userName");

const [printType, setPrintType] =
    useState("BW");
const blockLocation =
    localStorage.getItem("selectedBlock");
const [file, setFile] = useState(null);

const [totalPages, setTotalPages] = useState(0);
const [orderId, setOrderId] = useState("");

const [uploaded, setUploaded] = useState(false);

const [copies, setCopies] = useState(1);

const [pageOption, setPageOption] =
    useState("ALL");

const [startPage, setStartPage] =
    useState("");

const [endPage, setEndPage] =
    useState("");

useEffect(() => {

    fetchPrices();

}, []);

const uploadPdf = async () => {

    if (!file) {

        alert("Please select a PDF");

        return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("customerName", userName || "Customer");
    formData.append("blockLocation", blockLocation);

    try {

        const response =
            await api.post(
                "/pdf/upload",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data"
                    }
                }
            );

        setTotalPages(
            response.data.totalPages
        );

        setOrderId(
            response.data.orderId
        );

        setUploaded(true);

        alert(
            "PDF Uploaded Successfully"
        );

    } catch (error) {

        console.error(error);

        alert("Upload Failed");
    }
};

const fetchPrices = async () => {

    try {

        const response =
            await api.get(
                "/pricing/all"
            );

        response.data.forEach((p) => {

            if (
                p.printType === "BW"
            ) {

                setBwPrice(
                    p.pricePerPage
                );
            }

            if (
                p.printType === "COLOR"
            ) {

                setColorPrice(
                    p.pricePerPage
                );
            }

        });

    } catch (error) {

        console.error(error);
    }
};

const proceedToOrder = async () => {

if (!uploaded) {

    alert("Upload PDF First");

    return;
}

if (pageOption === "CUSTOM") {

    const start = parseInt(startPage);
    const end = parseInt(endPage);

    if (
        start < 1 ||
        end > totalPages ||
        start > end
    ) {

        alert(
            `Pages must be between 1 and ${totalPages}`
        );

        return;
    }
}

try {

    await api.post(
        "/pdf/updateOrder",
        null,
        {
            params: {
                orderId,
                copies,
                printType,
                blockLocation,
                selectedPages:
                    pageOption === "ALL"
                        ? "ALL"
                        : `${startPage}-${endPage}`
            }
        }
    );

  let pagesToPrint;

if (pageOption === "ALL") {

    pagesToPrint = totalPages;

} else {

    pagesToPrint =
        parseInt(endPage) -
        parseInt(startPage) +
        1;
}

const rate =
    printType === "COLOR"
        ? Number(colorPrice)
        : Number(bwPrice);

const price =
    pagesToPrint *
    Number(copies) *
    rate;

    localStorage.setItem(
        "order",
        JSON.stringify({
            orderId,
            copies,
            printType,
            blockLocation,
            totalPages,
            price,
            selectedPages:
                pageOption === "ALL"
                    ? "ALL"
                    : `${startPage}-${endPage}`
        })
    );

    navigate("/checkout");

} catch (error) {

    console.error(error);

    alert("Unable to Create Order");
}
};

const rate =
    printType === "COLOR"
        ? Number(colorPrice)
        : Number(bwPrice);

const selectedPageCount =
    pageOption === "ALL"
        ? totalPages
        : startPage && endPage
            ? Math.max(0, Number(endPage) - Number(startPage) + 1)
            : 0;

const estimatedTotal =
    selectedPageCount *
    Number(copies || 1) *
    rate;

return (

    <main className="page-shell page-shell-decorated">

        <div className="content-wrap">

            <Navbar
                title="Cloud Print Dashboard"
                subtitle="Customer Workspace"
                badge={blockLocation || "No block"}
                actions={[
                    { label: "My Orders", path: "/my-orders" },
                    { label: "Change Block", path: "/blocks", className: "btn secondary" }
                ]}
            />

            <motion.p
                className="subtitle mb-6 -mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {userName ? `Signed in as ${userName}` : `User ID: ${userId}`}
            </motion.p>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

                <motion.section
                    className="panel p-6"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.45 }}
                >

                    <div className="section-header">
                        <div>
                            <p className="eyebrow">Step 1</p>
                            <h2 className="text-2xl font-black text-slate-900">
                                Upload PDF
                            </h2>
                        </div>

                        <span className={uploaded ? "status-pill status-created" : "status-pill status-unpaid"}>
                            {uploaded ? "Uploaded" : "Waiting"}
                        </span>
                    </div>

                    <label className="upload-zone block">
                      <div className="mb-5 text-left">
    <span className="mb-2 block text-sm font-black text-slate-700">
        Printing Location
    </span>

    <div className="field">
        {blockLocation}
    </div>
</div>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) =>
                                setFile(
                                    e.target.files[0]
                                )
                            }
                            className="hidden"
                        />

                        <div className="flex flex-col gap-2 text-center">
                            <span className="text-lg font-black text-slate-900">
                                {file ? file.name : "Choose a PDF file"}
                            </span>
                            <span className="text-sm font-semibold text-slate-500">
                                Click this area to select the document.
                            </span>
                        </div>
                    </label>

                    <button
                        onClick={uploadPdf}
                        className="btn mt-5 w-full"
                    >
                        Upload PDF
                    </button>

                    <AnimatePresence>
                        {uploaded && (

                            <motion.div
                                className="mt-6 grid gap-4 rounded-lg border border-green-200 bg-green-50 p-4 sm:grid-cols-2"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                        Order ID
                                    </p>
                                    <p className="mt-1 text-xl font-black text-green-950">
                                        {orderId}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                        Customer
                                    </p>
                                    <p className="mt-1 text-xl font-black text-green-950">
                                        {userName || "Customer"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                        Total Pages
                                    </p>
                                    <p className="mt-1 text-xl font-black text-green-950">
                                        {totalPages}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-green-700">
                                        Location
                                    </p>
                                    <p className="mt-1 text-xl font-black text-green-950">
                                        {blockLocation}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </motion.section>

                <motion.aside
                    className="panel p-6"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16, duration: 0.45 }}
                >

                    <p className="eyebrow">Live Pricing</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">
                        Estimate
                    </h2>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-500">BW</p>
                            <p className="mt-1 text-2xl font-black text-slate-900">Rs. {bwPrice}</p>
                        </div>

                        <div className="rounded-lg bg-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-500">Color</p>
                            <p className="mt-1 text-2xl font-black text-slate-900">Rs. {colorPrice}</p>
                        </div>
                    </div>

                    <div className="mt-5 rounded-lg bg-slate-900 p-5 text-white">
                        <p className="text-sm font-bold text-slate-300">Estimated Total</p>
                        <motion.p
                            key={estimatedTotal}
                            className="mt-2 text-4xl font-black"
                            initial={{ scale: 0.96, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            Rs. {estimatedTotal || 0}
                        </motion.p>
                    </div>

                </motion.aside>

            </div>

            <AnimatePresence>
                {uploaded && (

                    <motion.section
                        className="panel mt-6 p-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 18 }}
                    >

                        <div className="section-header">
                            <div>
                                <p className="eyebrow">Step 2</p>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Print Settings
                                </h2>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">

                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-slate-700">
                                    Copies
                                </span>

                                <input
                                    type="number"
                                    min="1"
                                    value={copies}
                                    onChange={(e) =>
                                        setCopies(
                                            e.target.value
                                        )
                                    }
                                    className="field"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-slate-700">
                                    Print Type
                                </span>

                                <select
                                    value={printType}
                                    onChange={(e) =>
                                        setPrintType(
                                            e.target.value
                                        )
                                    }
                                    className="field"
                                >

                                    <option value="BW">
                                        Black & White
                                    </option>

                                    <option value="COLOR">
                                        Color
                                    </option>

                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-black text-slate-700">
                                    Pages
                                </span>

                                <select
                                    value={pageOption}
                                    onChange={(e) =>
                                        setPageOption(
                                            e.target.value
                                        )
                                    }
                                    className="field"
                                >

                                    <option value="ALL">
                                        All Pages
                                    </option>

                                    <option value="CUSTOM">
                                        Custom Range
                                    </option>

                                </select>
                            </label>

                            <div className="flex items-end">
                                <button
                                    onClick={proceedToOrder}
                                    className="btn success w-full"
                                >
                                    Proceed To Order
                                </button>
                            </div>

                        </div>

                        <AnimatePresence>
                            {pageOption === "CUSTOM" && (

                                <motion.div
                                    className="mt-4 grid gap-4 md:grid-cols-2"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                >

                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        placeholder="Start Page"
                                        value={startPage}
                                        onChange={(e) =>
                                            setStartPage(
                                                e.target.value
                                            )
                                        }
                                        className="field"
                                    />

                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        placeholder="End Page"
                                        value={endPage}
                                        onChange={(e) =>
                                            setEndPage(
                                                e.target.value
                                            )
                                        }
                                        className="field"
                                    />

                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.section>
                )}
            </AnimatePresence>

        </div>

    </main>
);
}

export default Dashboard;
