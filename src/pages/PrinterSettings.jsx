import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import PrinterCard from "../components/PrinterCard";

function PrinterSettings() {
    const navigate = useNavigate();

    const [printers, setPrinters] = useState([]);
    const [blockLocation, setBlockLocation] = useState("C Block");
    const [printerName, setPrinterName] = useState("");
    const [printerIp, setPrinterIp] = useState("");
    const [active, setActive] = useState(true);
    const [maintenance, setMaintenance] = useState(false);
    const [qrScanToPrint, setQrScanToPrint] = useState(false);
    const [otpEnabled, setOtpEnabled] = useState(true);

    useEffect(() => {
        const adminId = localStorage.getItem("adminId");

        if (!adminId) {
            navigate("/admin-login");
            return;
        }

        fetchPrinters();
    }, []);

    const fetchPrinters = async () => {
        try {
            const response = await api.get("/printer/all");

            setPrinters(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const savePrinter = async () => {
        if (!blockLocation || !printerName) {
            alert("Block location and printer name are required");
            return;
        }

        try {
            await api.post("/printer/save", {
                blockLocation,
                printerName,
                printerIp,
                active,
                maintenance,
                qrScanToPrint,
                otpEnabled
            });

            setPrinterName("");
            setPrinterIp("");
            setActive(true);
            setMaintenance(false);
            setQrScanToPrint(false);
            setOtpEnabled(true);
            fetchPrinters();
            alert("Printer saved");
        } catch (error) {
            console.error(error);
            alert("Unable to save printer");
        }
    };

    const deletePrinter = async (id) => {
        try {
            await api.delete("/printer/delete", {
                params: { id }
            });

            fetchPrinters();
        } catch (error) {
            console.error(error);
            alert("Unable to delete printer");
        }
    };

    return (
        <main className="page-shell">
            <div className="content-wrap">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Navbar
                        title="Printer Settings"
                        subtitle="Admin Configuration"
                        actions={[
                            {
                                label: "Admin Dashboard",
                                path: "/admin"
                            },
                            {
                                label: "Display Panel",
                                path: "/display-panel"
                            }
                        ]}
                    />
                </motion.div>

                <motion.section
                    className="panel mt-6 p-6"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="eyebrow">Register Printer</p>
                    <h2 className="text-2xl font-black text-slate-900">
                        Block Printer Mapping
                    </h2>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                        <select
                            value={blockLocation}
                            onChange={(e) => setBlockLocation(e.target.value)}
                            className="field"
                        >
                            <option value="C Block">C Block</option>
                            <option value="R Block">R Block</option>
                            <option value="L Block">L Block</option>
                            <option value="Library">Library</option>
                            <option value="Hostel">Hostel</option>
                            <option value="Administration Building">Administration Building</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Windows printer name"
                            value={printerName}
                            onChange={(e) => setPrinterName(e.target.value)}
                            className="field"
                        />

                        <input
                            type="text"
                            placeholder="Printer IP (optional)"
                            value={printerIp}
                            onChange={(e) => setPrinterIp(e.target.value)}
                            className="field"
                        />

                        <select
                            value={active ? "true" : "false"}
                            onChange={(e) => setActive(e.target.value === "true")}
                            className="field"
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>

                        <select
                            value={maintenance ? "true" : "false"}
                            onChange={(e) => setMaintenance(e.target.value === "true")}
                            className="field font-bold text-amber-600 bg-amber-50/50"
                        >
                            <option value="false">Normal Operation</option>
                            <option value="true">Under Maintenance 🛠️</option>
                        </select>

                        <select
                            value={qrScanToPrint ? "true" : "false"}
                            onChange={(e) => setQrScanToPrint(e.target.value === "true")}
                            className="field font-bold text-sky-600 bg-sky-50/50"
                        >
                            <option value="false">Direct Printing</option>
                            <option value="true">Scan-to-Print 🔐</option>
                        </select>

                        <select
                            value={otpEnabled ? "true" : "false"}
                            onChange={(e) => setOtpEnabled(e.target.value === "true")}
                            className="field font-bold text-violet-600 bg-violet-50/50"
                        >
                            <option value="true">OTP Required 🔑</option>
                            <option value="false">No OTP Direct ⚡</option>
                        </select>

                        <button onClick={savePrinter} className="btn success">
                            Save Printer
                        </button>
                    </div>
                </motion.section>

                <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {printers.map((printer) => (
                        <PrinterCard
                            key={printer.id}
                            printer={printer}
                            onDelete={deletePrinter}
                        />
                    ))}

                    {printers.length === 0 && (
                        <div className="panel p-6 text-center font-bold text-slate-500 md:col-span-2 xl:col-span-3">
                            No printers configured yet
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default PrinterSettings;
