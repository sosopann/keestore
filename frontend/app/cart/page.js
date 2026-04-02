"use client";
import { useCart } from "../context/CartContext";
import { Trash2, CreditCard, ShoppingBag, Wallet, ShoppingCart } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../context/ToastContext";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
       router.push("/login");
       return;
    }
    router.push("/checkout?cart=true");
  };

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Cart is Empty</h2>
        <p className="text-slate-500 mb-8">Looks like you haven't added any digital assets yet.</p>
        <button onClick={() => router.push('/products')} className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md">
            Browse Store
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
         <ShoppingCart className="text-primary"/> Shopping Cart
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 flex flex-col gap-4">
            {cart.map(item => (
                <div key={item.productId} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
                    <img src={item.imageUrl} alt={item.title} className="w-24 h-24 object-cover rounded-xl" />
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                        <p className="text-primary font-bold">${item.price.toFixed(2)}</p>
                        <p className="text-slate-500 text-sm mt-1">Qty: {item.quantity}</p>
                    </div>
                    <button 
                       onClick={() => removeFromCart(item.productId)}
                       className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            ))}
         </div>

         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md h-fit relative">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h3>
            <div className="flex justify-between items-center mb-4 text-slate-600">
                <span>Items ({cart.length})</span>
                <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-100 my-4 pt-4 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-2xl font-black text-slate-900">${totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black shadow-lg text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                  {loading ? "Processing..." : <><CreditCard size={20}/> Secure Checkout</>}
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}
