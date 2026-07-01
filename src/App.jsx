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

function App() {

  return (

    <BrowserRouter>

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
