"use client";
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Download } from 'lucide-react';
import ProductGrid from './components/ProductGrid';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Dynamic Business Hero Section */}
      <section className="relative w-full rounded-[40px] bg-slate-900 overflow-hidden flex flex-col items-center justify-center text-center py-32 px-6 mb-20 shadow-2xl">
        <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="z-10 max-w-4xl">
           <span className="bg-blue-500/20 text-blue-300 font-bold px-4 py-1.5 rounded-full text-sm inline-block mb-6 border border-blue-400/20 shadow-sm backdrop-blur-sm">
             Premium Quality FiveM & Game Assets
           </span>
           <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
             Elevate Your Server To <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">The Next Level</span>
           </h1>
           <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
             Get instant access to thousands of custom scripts, verified vehicles, exclusive maps, and secure software.
           </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link href="/products" className="w-full sm:w-auto bg-primary hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 text-lg">
                   Shop Collection <ArrowRight size={20}/>
               </Link>
               <Link href="/about" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center text-lg">
                   View Features
               </Link>
           </div>
        </div>
      </section>

      {/* Feature Icons */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-6"><Zap size={32}/></div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Delivery</h3>
             <p className="text-slate-500">Your digital keys are securely deposited to your account within milliseconds of payment.</p>
         </div>
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><ShieldCheck size={32}/></div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">100% Verified</h3>
             <p className="text-slate-500">All assets are manually checked by our team to guarantee performance without errors.</p>
         </div>
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6"><Download size={32}/></div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">Unlimited Access</h3>
             <p className="text-slate-500">Log into your dashboard anytime to recover your purchased keys and licenses.</p>
         </div>
      </section>

      {/* Featured Products */}
      <section className="mb-20">
         <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
             <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Featured Drops</h2>
                <p className="text-slate-500 mt-2">The hottest items currently trending in our community.</p>
             </div>
             <Link href="/products" className="text-primary font-bold hover:text-blue-700 flex items-center gap-1 group">
                View All <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </Link>
         </div>
         <ProductGrid />
      </section>
    </div>
  );
}
