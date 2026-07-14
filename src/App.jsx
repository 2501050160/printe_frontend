import { BrowserRouter, Routes, Route }
from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminLogin
from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import DisplayPanel from "./pages/DisplayPanel";
import BlockSelection from "./pages/BlockSelection";
import VerifyToken from "./pages/VerifyToken";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


import MyOrders from "./pages/MyOrders";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PrinterSettings from "./pages/PrinterSettings";
import ScanToPrint from "./pages/ScanToPrint";
import Referrals from "./pages/Referrals";
import { clearUserSession } from "./services/auth";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function SessionManager() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        const adminId = localStorage.getItem("adminId");



        // 2. Set up 5-minute inactivity timeout for normal users
        if (userId && !adminId) {
            localStorage.setItem("lastActivity", String(Date.now()));

            const updateActivity = () => {
                localStorage.setItem("lastActivity", String(Date.now()));
            };

            const events = ["mousedown", "keydown", "touchstart", "scroll", "click"];
            events.forEach(event => window.addEventListener(event, updateActivity));

            const interval = setInterval(() => {
                const currentUserId = localStorage.getItem("userId");
                const currentAdminId = localStorage.getItem("adminId");
                
                if (currentUserId && !currentAdminId) {
                    const lastActivity = Number(localStorage.getItem("lastActivity") || Date.now());
                    const elapsed = Date.now() - lastActivity;
                    if (elapsed > 5 * 60 * 1000) { // 5 minutes
                        clearUserSession();
                        window.location.reload();
                    }
                }
            }, 2000);

            return () => {
                events.forEach(event => window.removeEventListener(event, updateActivity));
                clearInterval(interval);
            };
        }
    }, [location.pathname]);

    return null;
}

function App() {

  return (

    <BrowserRouter>
      <SessionManager />

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/verify"
          element={<VerifyToken />}
        />
        <Route
          path="/verify-otp"
          element={<VerifyOtp />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/payment-success"
          element={<PaymentSuccess />}
        />


        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
<Route
 path="/admin-login"
 element={<AdminLogin />}
/>

        <Route
            path="/my-orders"
            element={<MyOrders />}
        />

        <Route
            path="/referrals"
            element={<Referrals />}
        />

        <Route
 path="/admin"
 element={<AdminDashboard />}
/>

        <Route
          path="/printer-settings"
          element={<PrinterSettings />}
        />

        <Route
          path="/display-panel"
          element={<DisplayPanel />}
        />
      <Route
          path="/blocks"
          element={<BlockSelection />}
      />

      <Route
          path="/scan-to-print"
          element={<ScanToPrint />}
      />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
