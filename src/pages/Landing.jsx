import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Printer, 
  UploadCloud, 
  CreditCard, 
  ShieldCheck, 
  MapPin, 
  Zap, 
  FileText, 
  Users 
} from "lucide-react";

function Landing() {
  const stats = [
    { label: "Documents Printed", value: "15,000+" },
    { label: "Campus Locations", value: "8 Locations" },
    { label: "Success Rate", value: "99.9%" }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Off-Peak Happy Hours",
      desc: "Get 15% discount for printing from 7 AM - 9 AM & 9 PM - 7 AM daily."
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-500" />,
      title: "Thesis Bulk Discount",
      desc: "Printing thesis or lab records? Enjoy a 15% flat discount for files > 50 pages."
    },
    {
      icon: <Users className="w-6 h-6 text-purple-500" />,
      title: "Share & Earn Credits",
      desc: "Refer your friends to earn ₹10 wallet credits directly on their first print."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
      title: "OTP & QR Release",
      desc: "Keep your files confidential. Prints only release once you scan or enter OTP."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Upload PDF",
      desc: "Drag & drop your files securely from any smartphone or laptop."
    },
    {
      num: "02",
      title: "Choose Specs",
      desc: "Pick black & white or color, single/double sided, and customize page layouts."
    },
    {
      num: "03",
      title: "Pay Online",
      desc: "Checkout seamlessly via Razorpay, card, or your prepaid wallet balance."
    },
    {
      num: "04",
      title: "Collect Securely",
      desc: "Scan the QR code at the printer block and watch your files print instantly."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dot-grid relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glass Navbar */}
      <header className="sticky top-0 z-50 px-6 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between p-4 rounded-2xl glass-panel">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Printer className="w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CloudPrint
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2.5 text-sm font-black text-slate-600 hover:text-slate-900 transition-colors">
              Login
            </Link>
            <Link to="/register" className="btn success min-h-0 py-2.5 px-6 rounded-xl font-black text-sm">
              Upload Document
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100">
              🚀 Smart Campus Printing Ecosystem
            </span>
            <h1 className="mt-6 text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-slate-900">
              Print from anywhere, <br />
              <span className="text-gradient-brand">collect in seconds.</span>
            </h1>
            <p className="mt-6 text-lg font-bold text-slate-600 leading-relaxed">
              No lines, no cables, and no app installs. Upload your PDF documents online, complete payment instantly, and scan to print safely at any location across the campus.
            </p>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Link to="/register" className="btn success px-8 py-4 rounded-2xl font-black text-base shadow-lg shadow-emerald-500/20">
              Start Uploading ⚡
            </Link>
            <Link to="/admin-login" className="btn secondary px-8 py-4 rounded-2xl font-black text-base">
              Admin Portal ⚙️
            </Link>
          </motion.div>

          {/* Statistics Grid */}
          <motion.div
            className="mt-16 grid grid-cols-3 gap-6 border-t border-slate-200/80 pt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                <p className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* 3D Printer Mockup & Floating papers column */}
        <div className="relative flex items-center justify-center lg:h-[480px]">
          {/* Animated Floating Papers */}
          <div className="absolute top-10 left-10 p-5 rounded-2xl glass-panel shadow-xl floating-paper max-w-[180px] border border-white/40">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-black text-slate-800">thesis.pdf</span>
            </div>
            <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-blue-600 rounded-full" />
            </div>
          </div>

          <div className="absolute bottom-12 right-12 p-5 rounded-2xl glass-panel shadow-xl floating-paper-delayed max-w-[180px] border border-white/40">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-black text-slate-800">Paid: ₹15.00</span>
            </div>
            <p className="mt-2 text-[10px] font-bold text-slate-500">OTP Release code: 827192</p>
          </div>

          {/* Interactive Printer Graphic Card */}
          <motion.div
            className="w-full max-w-[360px] h-[360px] rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white relative shadow-2xl flex flex-col justify-between overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Kiosk Map</p>
                <h3 className="text-2xl font-black mt-1">C Block Studio</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                Online
              </span>
            </div>

            {/* Simulated Printer UI */}
            <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between text-xs text-blue-200">
                <span>Active Queue</span>
                <span>4 Jobs</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate">assignment_final.pdf</p>
                  <p className="text-[10px] text-blue-200/80">Page 1 of 8 · Printing...</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-blue-100">
              <span>Tray Level: 85% Paper</span>
              <span>1.2s avg print time</span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white border-y border-slate-200/80 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              Tailored Campus Benefits
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
              Optimized for Student Budgets & Speed
            </h2>
            <p className="mt-4 text-base font-bold text-slate-500">
              We built smart offers and dynamic rates directly into the platform so that printing never burns a hole in your pocket.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat) => (
              <div key={feat.title} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all hover:shadow-lg group">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 w-fit group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="mt-5 text-lg font-black text-slate-900">{feat.title}</h3>
                <p className="mt-2 text-sm font-bold text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Process Timeline */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-black text-slate-900">
            Four Simple Steps to Print
          </h2>
          <p className="mt-4 text-base font-bold text-slate-500">
            Say goodbye to pendrives, driver setups, and standing in long queues at local print shops.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => (
            <div key={step.title} className="relative timeline-step pl-14">
              <span className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-sm font-black text-blue-600 shadow-sm">
                {step.num}
              </span>
              <h3 className="text-lg font-black text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm font-bold text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Student Reviews / Testimonials */}
      <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 opacity-30" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-3 py-1 rounded-full">
              Student Reviews
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-black">
              Loved by Thousands of Students
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="text-sm font-bold text-slate-300 leading-relaxed">
                "Direct PDF upload from my phone is a lifesaver. I upload my lab records while walking to class, pay via wallet, and just scan the QR to print. Takes literally 15 seconds!"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 font-black text-xs flex items-center justify-center text-white">
                  SK
                </div>
                <div>
                  <h4 className="text-sm font-black">Sanjeev Kumar</h4>
                  <p className="text-[10px] font-bold text-slate-400">B.Tech Biotech, C Block</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="text-sm font-bold text-slate-300 leading-relaxed">
                "The thesis bulk discount saved me a lot of money. I printed my entire final-year project report (78 pages) and the system automatically gave me a 15% discount. Incredible SaaS product!"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-600 font-black text-xs flex items-center justify-center text-white">
                  AP
                </div>
                <div>
                  <h4 className="text-sm font-black">Anjali Priya</h4>
                  <p className="text-[10px] font-bold text-slate-400">M.Sc Chemistry, L Block</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="text-sm font-bold text-slate-300 leading-relaxed">
                "I use my referral code to invite my hostel mates. Unlocked three badges so far and got ₹50 loaded into my wallet automatically. The UI is clean, modern, and super easy to navigate."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 font-black text-xs flex items-center justify-center text-white">
                  RV
                </div>
                <div>
                  <h4 className="text-sm font-black">Rohan Verma</h4>
                  <p className="text-[10px] font-bold text-slate-400">B.CA Computer Apps, Library</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-12 text-slate-500 text-sm font-bold">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Printer className="w-4 h-4" />
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">
              CloudPrint
            </span>
          </div>

          <div className="flex flex-wrap gap-8">
            <Link to="/admin-login" className="hover:text-slate-900 transition-colors">Admin Login</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Student Login</Link>
            <span className="normal-case font-black text-blue-600">🌐 www.saipraveen.site</span>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} CloudPrint. Designed for campus excellence.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
