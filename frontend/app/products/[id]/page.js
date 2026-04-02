"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { ShoppingCart, ShieldCheck, Zap, PackageOpen, ArrowLeft } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProductDetailPage() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const params = useParams();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    if (!params.id) return;
    axios.get(`${API_BASE_URL}/api/products`)
      .then(res => {
         const found = res.data.find(p => p._id === params.id);
         if(found) setProduct(found);
         setLoading(false);
      })
      .catch((e) => {
         console.error(e);
         setLoading(false);
       });
  }, [params.id]);

  if (loading) return <div className="py-20 text-center text-slate-500">Loading digital asset...</div>;
  if (!product) return <div className="py-20 text-center text-slate-500">Product not found.</div>;

  const handleAddToCart = () => {
     // Our context addToCart currently takes just product and adds 1.
     // To handle multiple qty cleanly, we could loop or update the context.
     // For simplicity and safety with existing context, we invoke it `qty` times.
     for(let i=0; i<qty; i++) {
        addToCart(product);
     }
     addToast(`Added ${qty}x ${product.title} to your cart!`);
  };

  return (
    <div className="py-10 max-w-6xl mx-auto">
      <Link href="/products" className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-2 mb-8 transition-colors w-fit">
         <ArrowLeft size={20} /> Back to Catalog
      </Link>
      
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row">
         
         {/* Image Section */}
         <div className="w-full md:w-1/2 bg-slate-50 relative min-h-[400px]">
             <img src={product.imageUrl} alt={product.title} className={`absolute inset-0 w-full h-full object-cover ${product.keys?.length === 0 ? 'grayscale opacity-80' : ''}`} />
             <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-slate-900 font-black shadow-sm uppercase text-sm z-20">
                 {product.category || 'General Asset'}
             </div>
             {product.keys?.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-900/40 backdrop-blur-sm">
                      <div className="bg-red-500/90 text-white font-black text-3xl px-8 py-3 rounded-xl transform -rotate-12 border-4 border-red-400 shadow-2xl backdrop-blur-md">
                          SOLD OUT
                      </div>
                 </div>
             )}
         </div>

         {/* Details Section */}
         <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
             <h1 className="text-4xl font-black text-slate-900 leading-tight mb-4">{product.title}</h1>
             <p className="text-3xl font-black text-primary mb-6">${product.price?.toFixed(2)}</p>
             
             <div className="flex items-center gap-2 mb-4">
                 <div className="flex items-center">
                     {[1,2,3,4,5].map(star => (
                       <svg key={star} className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                     ))}
                 </div>
                 <span className="text-sm font-bold text-slate-500">4.8 Rating • 192 Reviews</span>
             </div>

             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                 <h3 className="font-bold text-slate-900 mb-2">Item Description</h3>
                 <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{product.description}</p>
             </div>

             <div className="flex flex-col gap-3 mb-8">
                 <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                     <ShieldCheck className="text-emerald-500" size={20}/> 100% Virus-Free & Verified
                 </div>
                 <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                     <Zap className="text-blue-500" size={20}/> Instant Digital Delivery via Vault
                 </div>
                 <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                     <PackageOpen className="text-indigo-500" size={20}/> Complete Lifetime Access
                 </div>
                 <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                     <ShoppingCart className="text-orange-500" size={20}/> {product.keys?.length > 0 ? <span className="text-emerald-600">In Stock ({product.keys?.length} Left)</span> : <span className="text-red-500">Out of Stock</span>}
                 </div>
             </div>

             <div className="mt-auto flex gap-4">
                 <div className="flex items-center bg-slate-100 rounded-xl p-2 border border-slate-200">
                     <button onClick={()=>setQty(Math.max(1, qty-1))} className="w-10 h-10 flex items-center justify-center font-black text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors">-</button>
                     <span className="w-12 text-center font-black text-slate-900">{qty}</span>
                     <button onClick={()=>setQty(qty+1)} className="w-10 h-10 flex items-center justify-center font-black text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors">+</button>
                 </div>
                 <button 
                  onClick={handleAddToCart}
                  disabled={product.keys?.length === 0}
                  className="flex-grow bg-slate-900 hover:bg-black shadow-lg text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                 >
                     <ShoppingCart size={20}/> {product.keys?.length === 0 ? "Out of Stock" : "Add to Cart"}
                 </button>
                 <button 
                  onClick={() => router.push(`/checkout?product_id=${product._id}`)}
                  disabled={product.keys?.length === 0}
                  className="flex-grow bg-primary hover:bg-blue-700 shadow-lg text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                 >
                     Buy Now
                 </button>
             </div>
         </div>
      </div>

      <div className="mt-20">
          <h2 className="text-2xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-4">Customers also bought</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 opacity-60 pointer-events-none filter grayscale">
              {[1,2,3,4].map(i => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                      <div className="w-full h-32 bg-slate-200 rounded-lg mb-2 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4"></div>
                  </div>
              ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-4 font-bold">Related products loading engine warming up...</p>
      </div>
    </div>
  );
}
