import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { registerUser, persistUser } from "../services/auth";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Google AI Slideshow
  const [bgIndex, setBgIndex] = useState(0);
  const bgImages = ["/slideshow_1.png", "/slideshow_2.png", "/slideshow_3.png"];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await registerUser({
        name,
        email,
        password
      });

      persistUser(response);
      alert("Registration Successful");
      navigate("/blocks");

    } catch (err) {
      alert("Registration Failed");
    }
  };

  return (

    <main className="auth-shell">

      <motion.section
        className="auth-grid"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >

        <div 
          className="auth-visual"
          style={{
            backgroundImage: `linear-gradient(145deg, rgba(15, 76, 129, 0.82), rgba(20, 36, 56, 0.95)), url(${bgImages[bgIndex]})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            transition: "background-image 1.2s ease-in-out"
          }}
        >

          <div>
            <div className="brand-mark">CP</div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-sky-100 font-bold">
              Customer portal
            </p>

            <h1 className="mt-3 text-4xl font-black leading-tight text-white">
              Create orders that arrive directly in the print queue.
            </h1>
          </div>

        </div>

        <div className="auth-card">

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >

            <p className="eyebrow">Create Account</p>

            <h2 className="title">
              Start printing
            </h2>

            <p className="subtitle">
              Register once, then upload PDFs and pay online.
            </p>

            <form
              onSubmit={handleRegister}
              className="mt-8 space-y-4"
            >

              <input
                type="text"
                placeholder="Full name"
                className="field"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

              <input
                type="email"
                placeholder="Email address"
                className="field"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <input
                type="password"
                placeholder="Password"
                className="field"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="submit"
                className="btn w-full"
              >
                Create Account
              </button>

            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already registered?{" "}
              <Link
                to="/"
                className="link-action"
              >
                Login here
              </Link>
            </p>

          </motion.div>

        </div>

      </motion.section>

    </main>
  );
}

export default Register;
