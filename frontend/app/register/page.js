"use client";
import { useState, Suspense } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, Mail, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const RECAPTCHA_SITE_KEY = "6LdGBaQsAAAAAII2E4z_bJiBltTK0FH1KtmL_saN";

function RegisterContent() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!captchaToken) return setError("Please verify the CAPTCHA.");

    setLoading(true);
    setError("");
    try {
      const ref = searchParams.get("ref");
      await axios.post(`${API_BASE_URL}/api/auth/register`, { username, email, password, ref, captchaToken });
      alert("Welcome! A 6-digit confirmation code has been sent to your email. Please login to verify.");
      router.push("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white p-8 md:p-12 rounded-3xl w-full max-w-md relative overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50">
        
        <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
               <Users size={32} />
            </div>
            <h1 className="text-3xl font-black mb-2 text-center text-slate-900 tracking-tight">Create Account</h1>
            <p className="text-slate-500 mb-8 text-center">Join thousands of others today.</p>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 font-medium text-center">{error}</div>}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
            
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 font-medium placeholder-slate-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
            </div>

            <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 font-medium placeholder-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
            </div>
            
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 font-medium placeholder-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
            </div>

            <div className="flex justify-center my-2 scale-90 origin-center">
                <ReCAPTCHA 
                  sitekey={RECAPTCHA_SITE_KEY} 
                  onChange={(token) => setCaptchaToken(token)}
                />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 shadow-lg text-white py-4 rounded-xl font-bold mt-2 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? "Creating Profile..." : "Sign Up Securely"}
            </button>
            </form>

            <p className="text-center text-slate-500 mt-8 font-medium">
            Already have an account? <Link href="/login" className="text-primary hover:text-blue-700 font-bold transition-colors">Sign in</Link>
            </p>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[80vh] font-bold text-slate-500">Loading Registration...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
