"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, CreditCard, ShieldCheck, Ticket } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";
import Link from "next/link";

export default function CheckoutGateway() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart } = useCart();
  const { addToast } = useToast();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountVal, setDiscountVal] = useState(0);

  useEffect(() => {
    const fetchCheckoutData = async () => {
       const token = localStorage.getItem("token");
       if (!token) {
           router.push("/login"); return;
       }
       
       try {
           // Fetch Wallet Balance
           const wRes = await axios.get("http://localhost:5000/api/wallet/balance", { headers: { Authorization: `Bearer ${token}` }});
           setWalletBalance(wRes.data.walletBalance);

           // Resolve items
           const isCart = searchParams.get("cart");
           const productId = searchParams.get("product_id");

           if (isCart === "true") {
               setItems(cart);
               setTotal(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
           } else if (productId) {
               const pRes = await axios.get("http://localhost:5000/api/products");
               const prod = pRes.data.find(p => p._id === productId);
               if (prod) {
                   setItems([{ ...prod, quantity: 1 }]);
                   setTotal(prod.price);
               } else {
                   router.push("/products");
               }
           } else {
               router.push("/products");
           }
       } catch(err) {
           addToast("Failed to initiate checkout", "error");
       } finally {
           setLoading(false);
       }
    };
    fetchCheckoutData();
  }, [searchParams, cart]);

  const finalTotal = promoApplied ? total * (1 - (discountVal / 100)) : total;

  const handlePayWithWallet = async () => {
      setProcessing(true);
      const token = localStorage.getItem("token");
      try {
          const payload = { items: items.map(i => ({ productId: i._id, quantity: i.quantity })), promoCode: promoApplied ? promoCode : null };
          const res = await axios.post("http://localhost:5000/api/orders/pay-wallet", payload, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
              if (searchParams.get("cart")) clearCart();
              addToast("Payment successful using KeeWallet! Any referral discounts were applied automatically.", "success");
              router.push("/dashboard");
          }
      } catch(err) {
          addToast("Wallet Payment Failed. " + (err.response?.data?.error || err.message), "error");
      } finally {
          setProcessing(false);
      }
  };

  const handlePayWithStripe = async () => {
      setProcessing(true);
      const token = localStorage.getItem("token");
      try {
          const payload = { items: items.map(i => ({ productId: i._id, quantity: i.quantity })) };
          const res = await axios.post("http://localhost:5000/api/orders/create-checkout-session", payload, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.url) window.location.href = res.data.url;
      } catch(err) {
          addToast("Card Checkout Failed. " + (err.response?.data?.error || err.message), "error");
      } finally {
          setProcessing(false);
      }
  };

  const applyPromo = async () => {
      if(!promoCode) return;
      try {
          const res = await axios.post("http://localhost:5000/api/coupons/validate", { code: promoCode });
          setDiscountVal(res.data.discountPercent);
          setPromoApplied(true);
          addToast(`${res.data.discountPercent}% Discount Applied!`, "success");
      } catch (err) {
          addToast(err.response?.data?.error || "Invalid Promo Code", "error");
          setPromoApplied(false);
          setDiscountVal(0);
      }
  };

  if(loading) return <div className="py-20 text-center font-bold text-slate-500">Initiating Secure Gateway...</div>;

  return (
    <div className="py-10 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Order Summary */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Summary</h1>
            
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col h-full">
                <div className="flex-grow flex flex-col gap-4 overflow-y-auto max-h-[400px] mb-6">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                            <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                            <div className="flex-grow">
                                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                                <p className="text-slate-500 text-xs">Qty: {item.quantity} | {item.category}</p>
                            </div>
                            <div className="font-black text-slate-900">
                                ${(item.price * item.quantity).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-6 flex gap-2">
                    <input type="text" placeholder="Promo Code" value={promoCode} onChange={e=>setPromoCode(e.target.value)} disabled={promoApplied} className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 outline-none focus:border-primary text-sm font-bold uppercase" />
                    <button onClick={applyPromo} disabled={promoApplied} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"><Ticket size={18}/></button>
                </div>

                <div className="border-t border-slate-200 pt-6 mt-auto">
                    {promoApplied && (
                        <div className="flex justify-between items-center mb-2 text-sm font-bold text-emerald-500">
                            <span>Discount Applied</span>
                            <span>-{discountVal}%</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-600">Total Price</span>
                        <span className="text-2xl font-black text-slate-900">${finalTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Payment Gateway */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Method</h1>
            
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 flex flex-col gap-4">
                
                {/* Method 1: Wallet */}
                <div className="border border-slate-200 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-primary group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={80} className="text-primary"/>
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Wallet size={20}/></div>
                            <h3 className="text-lg font-black text-slate-900">KeeWallet Balance</h3>
                        </div>
                        <p className="text-sm font-bold text-slate-500 border border-slate-200 bg-slate-50 rounded-lg w-fit px-3 py-1">Available: ${walletBalance.toFixed(2)}</p>
                        
                        {walletBalance >= finalTotal ? (
                            <button 
                              onClick={handlePayWithWallet} disabled={processing}
                              className="w-full mt-2 bg-primary hover:bg-blue-700 shadow-md text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
                            >
                                {processing ? "Processing..." : "Pay Instantly (0 Fees)"}
                            </button>
                        ) : (
                            <div className="mt-2 text-red-500 font-bold text-sm bg-red-50 border border-red-100 p-3 rounded-lg flex justify-between items-center">
                                Insufficient Balance
                                <Link href="/topup" className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600">Top Up</Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 my-2 opacity-50">
                    <span className="h-px w-16 bg-slate-300"></span><span className="text-xs font-black uppercase text-slate-500">OR</span><span className="h-px w-16 bg-slate-300"></span>
                </div>

                {/* Method 2: Stripe / Credit Card */}
                <div className="border border-slate-200 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-slate-800 group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard size={80} className="text-slate-800"/>
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center"><CreditCard size={20}/></div>
                            <h3 className="text-lg font-black text-slate-900">Credit / Debit Card</h3>
                        </div>
                        <p className="text-sm font-bold text-slate-500">Powered by Stripe Global Infrastructure.</p>
                        
                        <button 
                          onClick={handlePayWithStripe} disabled={processing}
                          className="w-full mt-2 bg-slate-900 hover:bg-black shadow-md text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
                        >
                            {processing ? "Processing..." : "Continue to Stripe"}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 justify-center mt-4 text-xs font-bold text-emerald-500">
                    <ShieldCheck size={16}/> 100% Secure Encrypted Transaction
                </div>
            </div>
        </div>
    </div>
  );
}
