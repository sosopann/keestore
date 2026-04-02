"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // login, 2fa, verify
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      
      if (res.data.requiresEmailVerification) {
          setUserId(res.data.userId);
          setMode("verify");
      } else if (res.data.requires2FA) {
          setUserId(res.data.userId);
          setMode("2fa");
      } else {
          login(res.data.token, res.data.username, res.data.role, res.data.email);
          router.push("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e, type) => {
      e.preventDefault();
      setLoading(true); setError("");
      try {
          const endpoint = type === '2fa' ? "/api/auth/verify-2fa" : "/api/auth/verify-email";
          const res = await axios.post(`${API_BASE_URL}${endpoint}`, { userId, code });
          login(res.data.token, res.data.username, res.data.role, res.data.email);
          router.push("/dashboard");
      } catch(err) {
          setError(err.response?.data?.error || "Invalid code");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white p-8 md:p-12 rounded-3xl w-full max-w-md relative overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50">
        
        {mode === "login" && (
          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
               <ShieldAlert size={32} />
            </div>
            <h1 className="text-3xl font-black mb-2 text-center text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 mb-8 text-center">Sign in to access your digital assets and dashboard.</p>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 font-medium text-center">{error}</div>}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
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

            <div className="text-right">
                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-blue-700 transition">Forgot Password?</Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-blue-700 shadow-lg text-white py-4 rounded-xl font-bold mt-2 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? "Verifying Credentials..." : "Sign In Securely"}
            </button>
            </form>

            <p className="text-center text-slate-500 mt-8 font-medium">
            Don't have an account? <Link href="/register" className="text-primary hover:text-blue-700 font-bold transition-colors">Create one now</Link>
            </p>
        </div>
        )}

        {(mode === "verify" || mode === "2fa") && (
            <div className="relative z-10 animate-in fade-in">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                   <Lock size={32} />
                </div>
                <h1 className="text-3xl font-black mb-2 text-center text-slate-900 tracking-tight">{mode === '2fa' ? 'Two-Factor Auth' : 'Verify Email'}</h1>
                <p className="text-slate-500 mb-8 text-center text-sm">We've sent a 6-digit code to your email. Enter it below.</p>
                
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 font-medium text-center">{error}</div>}

                <form onSubmit={(e) => handleVerify(e, mode)} className="flex flex-col gap-5">
                    <input 
                      type="text" 
                      placeholder="Enter 6-Digit Code" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-emerald-500 text-slate-900"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6}
                      required
                    />
                    <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 mt-2">
                       {loading ? "Verifying..." : "Confirm Code"}
                    </button>
                    <button type="button" onClick={() => setMode('login')} className="text-sm font-bold text-slate-400 hover:text-slate-600 mt-4">Cancel & Return</button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
}
