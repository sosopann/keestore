"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Wallet, ShieldCheck, Zap } from "lucide-react";
import { useToast } from "../context/ToastContext";
import Link from "next/link";

export default function TopUpGateway() {
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleTopUp = async (amount) => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
          router.push("/login");
          return;
      }

      try {
          const res = await axios.post("http://localhost:5000/api/wallet/create-topup-session", 
            { amount: parseFloat(amount) }, 
            { headers: { Authorization: `Bearer ${token}` }}
          );
          if (res.data.url) window.location.href = res.data.url;
      } catch(err) {
          addToast("Top-up session failed. " + (err.response?.data?.error || err.message), "error");
          setLoading(false);
      }
  };

  const presetAmounts = [10, 25, 50, 100];

  return (
    <div className="py-20 flex flex-col items-center justify-center min-h-[85vh]">
        
        <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                <Wallet size={40} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Deposit Funds</h1>
            <p className="text-slate-500 font-medium">Add balance to your KeeWallet for instant 0-fee checkouts.</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-xl w-full max-w-xl">
             
             <h3 className="text-slate-900 font-bold mb-4 uppercase tracking-wider text-sm">Select Package</h3>
             <div className="grid grid-cols-2 gap-4 mb-8">
                 {presetAmounts.map(amt => (
                     <button 
                        key={amt}
                        onClick={() => handleTopUp(amt)}
                        disabled={loading}
                        className="bg-slate-50 border border-slate-200 hover:border-primary hover:bg-blue-50 text-slate-800 hover:text-primary py-6 rounded-2xl font-black text-2xl transition-all shadow-sm"
                     >
                         ${amt}
                     </button>
                 ))}
             </div>

             <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 font-bold text-xs uppercase uppercase">Or Custom Value</span>
                <div className="flex-grow border-t border-slate-200"></div>
             </div>

             <form onSubmit={(e) => { e.preventDefault(); handleTopUp(customAmount); }} className="flex gap-4">
                 <div className="relative flex-grow">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                     <input 
                        type="number" 
                        step="1"
                        min="5"
                        placeholder="150"
                        value={customAmount}
                        onChange={(e)=>setCustomAmount(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-slate-900 font-black text-xl"
                     />
                 </div>
                 <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 rounded-xl disabled:opacity-50 transition-colors shadow-md whitespace-nowrap"
                 >
                     Add Custom
                 </button>
             </form>

             <div className="mt-8 flex items-center justify-center gap-6 border-t border-slate-100 pt-8">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                     <ShieldCheck size={16} className="text-emerald-500"/> Secured by Stripe
                 </div>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                     <Zap size={16} className="text-blue-500"/> Instant Credit
                 </div>
             </div>
        </div>

        <Link href="/dashboard" className="mt-8 text-slate-400 font-bold hover:text-slate-900 transition-colors">
            Cancel and Return to Dashboard
        </Link>
    </div>
  );
}
