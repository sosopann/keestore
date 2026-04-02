"use client";

import Link from "next/link";
import { Key, LayoutDashboard, LogIn, LogOut, ShieldCheck, ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { cart } = useCart();
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200 py-4 px-6 md:px-12 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative h-12 w-auto flex items-center min-w-[40px]">
            {/* Try to load logo.png, fallback to Key icon/Text if it fails or doesn't exist */}
            <img src="/logo.png" alt="Store Logo" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} className="h-full w-auto object-contain z-10 drop-shadow-sm max-w-[200px]" />
            
            <div className="hidden items-center gap-2 z-0">
               <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:rotate-12 transition-all">
                  <Key size={20} className="rotate-45" />
               </div>
               <span className="text-2xl font-black tracking-tighter text-slate-900 group-hover:text-primary transition-colors">KeeStore</span>
            </div>
        </div>
      </Link>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-slate-600 hover:text-primary font-bold transition-colors">All Products</Link>
            <div className="relative group cursor-pointer py-2">
                <span className="text-slate-600 group-hover:text-primary font-bold transition-colors flex items-center gap-1">
                    Categories <svg className="w-4 h-4 mt-0.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-2 z-50">
                    {['Scripts', 'Vehicles', 'Maps', 'Software', 'General'].map(cat => (
                        <Link key={cat} href={`/products?category=${cat}`} className="px-4 py-2 hover:bg-slate-50 text-slate-600 hover:text-primary font-bold rounded-xl transition-colors">
                            {cat}
                        </Link>
                    ))}
                </div>
            </div>
            <Link href="/about" className="text-slate-600 hover:text-primary font-bold transition-colors">About</Link>
        </div>
        
        <Link href="/cart" className="relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-700">
          <ShoppingCart size={22} />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
              {cartItemsCount}
            </span>
          )}
        </Link>
        
        {!loading && user ? (
          <>
             {user.role === 'admin' ? (
                <Link href="/admin" className="text-primary hover:text-blue-700 font-bold transition-colors flex items-center gap-2">
                  <ShieldCheck size={20} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
             ) : (
                <Link href="/dashboard" className="text-slate-600 hover:text-primary font-medium transition-colors flex items-center gap-2">
                  <LayoutDashboard size={20} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
             )}
            
            <div className="flex items-center gap-3 bg-slate-100 rounded-full pl-4 pr-1 py-1 border border-slate-200 shadow-sm">
               <span className="text-sm font-bold text-slate-800">{user.username}</span>
               <button onClick={logout} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors" title="Logout">
                 <LogOut size={16} strokeWidth={2.5} />
               </button>
            </div>
          </>
        ) : !loading ? (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-primary font-bold flex items-center gap-2 transition-colors">
              <LogIn size={18} /> Login
            </Link>
            <Link href="/register" className="bg-slate-900 hover:bg-slate-800 shadow-lg text-white px-5 py-2 rounded-xl font-bold transition-transform hover:-translate-y-0.5">
              Sign Up
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
