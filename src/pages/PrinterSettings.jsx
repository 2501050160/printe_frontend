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
    const [colourSupported, setColourSupported] = useState(false);
    const [paused, setPaused] = useState(false);
    const [editingId, setEditingId] = useState(null);

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
                id: editingId,
                blockLocation,
                printerName,
                printerIp,
                active,
                maintenance,
                qrScanToPrint,
                otpEnabled,
                colourSupported,
                paused
            });

            setPrinterName("");
            setPrinterIp("");
            setActive(true);
            setMaintenance(false);
            setQrScanToPrint(false);
            setOtpEnabled(true);
            setColourSupported(false);
            setPaused(false);
            setEditingId(null);
            fetchPrinters();
            alert(editingId ? "Printer updated successfully" : "Printer saved successfully");
        } catch (error) {
            console.error(error);
            alert(editingId ? "Unable to update printer" : "Unable to save printer");
        }
    };

    const handleEdit = (printer) => {
        setEditingId(printer.id);
        setBlockLocation(printer.blockLocation);
        setPrinterName(printer.printerName || "");
        setPrinterIp(printer.printerIp || "");
        setActive(printer.active !== false);
        setMaintenance(printer.maintenance === true);
        setQrScanToPrint(printer.qrScanToPrint === true);
        setOtpEnabled(printer.otpEnabled !== false);
        setColourSupported(printer.colourSupported === true);
        setPaused(printer.paused === true);
    };

    const cancelEdit = () => {
        setPrinterName("");
        setPrinterIp("");
        setActive(true);
        setMaintenance(false);
        setQrScanToPrint(false);
        setOtpEnabled(true);
        setColourSupported(false);
        setPaused(false);
        setEditingId(null);
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

                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Block Location</label>
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
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Printer Name</label>
                            <input
                                type="text"
                                placeholder="Windows printer name"
                                value={printerName}
                                onChange={(e) => setPrinterName(e.target.value)}
                                className="field"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Printer IP / USB</label>
                            <input
                                type="text"
                                placeholder="Printer IP (optional)"
                                value={printerIp}
                                onChange={(e) => setPrinterIp(e.target.value)}
                                className="field"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Operation Status</label>
                            <select
                                value={paused ? "paused" : active ? "active" : "inactive"}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "paused") {
                                        setPaused(true);
                                        setActive(false);
                                    } else if (val === "active") {
                                        setPaused(false);
                                        setActive(true);
                                    } else {
                                        setPaused(false);
                                        setActive(false);
                                    }
                                }}
                                className="field"
                            >
                                <option value="active">Active (Online & Ready)</option>
                                <option value="paused">Paused ⏸️</option>
                                <option value="inactive">Inactive 🚫</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Maintenance Status</label>
                            <select
                                value={maintenance ? "true" : "false"}
                                onChange={(e) => setMaintenance(e.target.value === "true")}
                                className="field font-bold text-amber-600 bg-amber-50/50"
                            >
                                <option value="false">Normal Operation</option>
                                <option value="true">Under Maintenance 🛠️</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">Supported Output Type</label>
                            <select
                                value={colourSupported ? "true" : "false"}
                                onChange={(e) => setColourSupported(e.target.value === "true")}
                                className="field font-bold text-emerald-600 bg-emerald-50/50"
                            >
                                <option value="false">Black & White Only 📄</option>
                                <option value="true">Supports Color & BW 🎨</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">QR Scan Flow</label>
                            <select
                                value={qrScanToPrint ? "true" : "false"}
                                onChange={(e) => setQrScanToPrint(e.target.value === "true")}
                                className="field font-bold text-sky-600 bg-sky-50/50"
                            >
                                <option value="false">Direct Printing</option>
                                <option value="true">Scan-to-Print 🔐</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500">OTP Release flow</label>
                            <select
                                value={otpEnabled ? "true" : "false"}
                                onChange={(e) => setOtpEnabled(e.target.value === "true")}
                                className="field font-bold text-violet-600 bg-violet-50/50"
                            >
                                <option value="true">OTP Required 🔑</option>
                                <option value="false">No OTP Direct ⚡</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 justify-end">
                        {editingId && (
                            <button onClick={cancelEdit} className="btn secondary px-6 py-2.5">
                                Cancel Edit
                            </button>
                        )}
                        <button onClick={savePrinter} className="btn success px-8 py-2.5">
                            {editingId ? "Update Printer" : "Save Printer"}
                        </button>
                    </div>
                </motion.section>

                <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {printers.map((printer) => (
                        <PrinterCard
                            key={printer.id}
                            printer={printer}
                            onEdit={handleEdit}
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
