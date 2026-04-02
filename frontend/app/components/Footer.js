"use client";
import Link from "next/link";
import { Key } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20 pt-16 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center transform group-hover:-translate-y-1 transition-all">
                    <Key className="text-white rotate-45" size={20} />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">KeeStore</span>
            </Link>
            <p className="text-gray-400 max-w-sm">
                The most secure, lightning-fast platform designed to deliver premium digital keys and software assets directly to you 24/7.
            </p>
        </div>
        
        <div>
            <h4 className="font-bold mb-6 text-white">Platform</h4>
            <ul className="flex flex-col gap-4 text-gray-400">
                <li><Link href="/" className="hover:text-primary transition-colors">Products</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">My Library</Link></li>
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            </ul>
        </div>

        <div>
            <h4 className="font-bold mb-6 text-white">Support</h4>
            <ul className="flex flex-col gap-4 text-gray-400">
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
        </div>
      </div>
      
      <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} KeeStore. All Rights Reserved.</p>
        <p className="font-bold text-gray-400">Designed by <span className="text-primary italic">Yassin Khaled</span></p>
        <p>100% Secure Checkout powered by Stripe</p>
      </div>
    </footer>
  );
}
