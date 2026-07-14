import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  AtSign, 
  Mail, 
  BookOpen, 
  Layers, 
  Calendar, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  Printer,
  Sparkles,
  Check,
  ChevronRight,
  Plus
} from "lucide-react";
import { registerUser, persistUser } from "../services/auth";
import loginHero from "../assets/login_hero.mp4";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    studentId: "",
    department: "",
    year: "1st Year",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Password validation checklist checks
  const checks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password)
  };

  const isPasswordValid = Object.values(checks).every(Boolean);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!isPasswordValid) {
      alert("Please ensure your password satisfies all security strength rules.");
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        studentId: formData.studentId,
        department: formData.department,
        year: formData.year,
        password: formData.password
      });

      setSuccessDetails(response);
      setShowSuccessScreen(true);
      
      // Auto redirect after showing the success screen for 3.5 seconds
      setTimeout(() => {
        persistUser(response);
        navigate("/blocks");
      }, 3500);
    } catch (err) {
      alert(err.response?.data || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    alert(`Connecting OAuth redirection credentials for ${provider}...`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dot-grid relative flex items-center justify-center p-4 md:p-8 overflow-hidden font-sans">
      {/* Background Animated Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[30rem] h-[30rem] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Registration Grid Container */}
      <motion.div
        className="w-full max-w-5xl rounded-[24px] bg-white/70 border border-slate-200/80 shadow-2xl backdrop-blur-xl overflow-hidden grid lg:grid-cols-[0.9fr_1.1fr] relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <AnimatePresence>
          {showSuccessScreen ? (
            <motion.div
              className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-center p-8 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <Check className="w-10 h-10 text-white stroke-[3px]" />
              </motion.div>

              <h2 className="mt-8 text-3xl font-black tracking-tight">Registration Complete! 🎉</h2>
              <p className="mt-3 text-slate-400 font-bold max-w-sm">
                Welcome to CloudPrint. Creating your secure student wallet balance. Redirecting you to building blocks selection...
              </p>

              <div className="mt-8 flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-widest animate-pulse">
                <span>Connecting server</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* LEFT COLUMN: Animated Smart University Printing Kiosk Illustration */}
        <div className="relative overflow-hidden hidden lg:flex flex-col justify-between p-12 bg-slate-950 text-white min-h-[720px]">
          {/* Ambient Video Backdrop */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none"
          >
            <source src={loginHero} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-blue-950/50 z-10 pointer-events-none" />

          {/* Top Logo mark */}
          <div className="z-20 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight">CloudPrint</span>
          </div>

          {/* Floating Live Status Kiosk Widget */}
          <div className="z-20 p-6 rounded-2xl glass-panel-dark border border-white/10 max-w-[240px] shadow-2xl floating-paper self-center mt-10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kiosk TV #04</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Printer Status:</span>
                <span className="font-bold text-emerald-400">Online 🟢</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Active Queue:</span>
                <span className="font-bold text-white">3 jobs</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Est. Wait:</span>
                <span className="font-bold text-white">2 mins</span>
              </div>
            </div>
          </div>

          {/* Bottom Branding / Badges */}
          <div className="z-20 mt-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Smart Campus Printing</span>
            <h2 className="text-3xl font-black mt-2 leading-tight">
              Print Anywhere.<br />Collect Securely.
            </h2>
            <p className="text-slate-400 font-bold text-xs mt-2">Worry-free document management on campus.</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/5 text-[10px] font-black uppercase">
                ✓ QR Release
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/5 text-[10px] font-black uppercase">
                ✓ OTP Verification
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/5 text-[10px] font-black uppercase">
                ✓ Secure Cloud
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Registration Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Create Your Account</h2>
            <p className="mt-2 text-sm font-bold text-slate-500 leading-relaxed">
              Register once and securely upload, pay, and print documents anywhere across campus.
            </p>
          </div>

          {/* Profile Avatar Selection/Preview */}
          <div className="mt-8 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black relative overflow-hidden shrink-0">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">Profile Avatar</p>
              <button 
                type="button" 
                onClick={() => setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`)}
                className="text-xs font-black text-blue-600 hover:underline mt-0.5 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Generate Random Avatar
              </button>
            </div>
          </div>

          {/* Form fields */}
          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="field pl-10"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="username"
                    placeholder="johndoe"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="field pl-10"
                  />
                </div>
              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-4">
              
              {/* University Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">University Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    placeholder="john@university.edu"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="field pl-10"
                  />
                </div>
              </div>

              {/* Student ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="studentId"
                    placeholder="ST-82910"
                    required
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="field pl-10"
                  />
                </div>
              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Department */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="department"
                    placeholder="Computer Science"
                    required
                    value={formData.department}
                    onChange={handleInputChange}
                    className="field pl-10"
                  />
                </div>
              </div>

              {/* Year Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="field pl-10"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="field pl-10"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Password</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="field pl-10"
                  />
                </div>
              </div>

            </div>

            {/* Password Strength Checklist */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2 mt-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password Strength</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                <span className={`flex items-center gap-1 ${checks.length ? "text-emerald-600" : ""}`}>
                  <Check className={`w-3.5 h-3.5 shrink-0 ${checks.length ? "text-emerald-500" : "text-slate-300"}`} /> 8 Characters
                </span>
                <span className={`flex items-center gap-1 ${checks.uppercase ? "text-emerald-600" : ""}`}>
                  <Check className={`w-3.5 h-3.5 shrink-0 ${checks.uppercase ? "text-emerald-500" : "text-slate-300"}`} /> 1 Uppercase
                </span>
                <span className={`flex items-center gap-1 ${checks.number ? "text-emerald-600" : ""}`}>
                  <Check className={`w-3.5 h-3.5 shrink-0 ${checks.number ? "text-emerald-500" : "text-slate-300"}`} /> 1 Number
                </span>
                <span className={`flex items-center gap-1 ${checks.special ? "text-emerald-600" : ""}`}>
                  <Check className={`w-3.5 h-3.5 shrink-0 ${checks.special ? "text-emerald-500" : "text-slate-300"}`} /> 1 Symbol
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-transform active:scale-[0.98]"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Logins Divider */}
          <div className="relative flex items-center justify-center my-6">
            <span className="h-px bg-slate-200 w-full absolute" />
            <span className="bg-white px-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">
              or
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleSocialRegister("Google")} 
              className="btn secondary py-2.5 px-4 min-h-0 text-xs font-black flex items-center justify-center gap-2 rounded-xl"
            >
              Google
            </button>
            <button 
              onClick={() => handleSocialRegister("Microsoft")} 
              className="btn secondary py-2.5 px-4 min-h-0 text-xs font-black flex items-center justify-center gap-2 rounded-xl"
            >
              Microsoft
            </button>
          </div>

          {/* Bottom links */}
          <div className="mt-8 text-center text-xs font-bold text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-black">
              Login here
            </Link>
            <div className="mt-4 flex justify-center gap-4 text-[10px] text-slate-400">
              <a href="#" className="hover:underline">Terms & Conditions</a>
              <a href="#" className="hover:underline">Privacy Policy</a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
