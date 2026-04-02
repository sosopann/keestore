"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Fetch products
    axios.get("http://localhost:5000/api/products")
      .then(res => {
        setProducts(res.data.slice(0, 12)); // limit to 12
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCheckout = async (productId) => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      router.push(`/checkout?product_id=${productId}`);
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading products...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => {
        const isSoldOut = product.keys?.length === 0;

        return (
          <div key={product._id} className={`bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all flex flex-col group ${isSoldOut ? 'opacity-75 grayscale-[0.3]' : 'hover:shadow-xl'}`}>
            <Link href={`/products/${product._id}`} className={`h-48 overflow-hidden relative block ${isSoldOut ? 'pointer-events-none' : ''}`}>
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className={`w-full h-full object-cover transition-transform duration-500 ${isSoldOut ? '' : 'group-hover:scale-105'}`}
              />
              
              {/* Overlays */}
              {isSoldOut && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-30">
                      <div className="bg-red-500/90 text-white font-black text-xl px-6 py-2 rounded-xl transform -rotate-12 border-2 border-red-400 shadow-xl backdrop-blur-md">
                          SOLD OUT
                      </div>
                  </div>
              )}

              <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-slate-900 font-bold shadow-sm">
                ${parseFloat(product.price).toFixed(2)}
              </div>
              <div className="absolute top-4 left-4 z-20 bg-primary/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold uppercase shadow-sm">
                {product.category || 'General'}
              </div>
            </Link>
            
            <div className="p-6 flex flex-col flex-grow relative">
              <Link href={`/products/${product._id}`}>
                 <h3 className="text-xl font-bold mb-1 text-slate-900 line-clamp-1 hover:text-primary transition-colors">{product.title}</h3>
              </Link>
              
              <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(star => (
                     <svg key={star} className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                  <span className="text-xs font-bold text-slate-400 ml-1">({Math.floor(Math.random() * 400) + 15})</span>
              </div>

              <p className="text-slate-500 text-sm mb-6 flex-grow line-clamp-2">{product.description}</p>
              
              <div className="flex items-center gap-3">
                  <button 
                    disabled={isSoldOut}
                    onClick={() => { 
                      addToCart(product); 
                      addToast(`${product.title} added to cart!`); 
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={18} />
                  </button>
                  <button 
                    disabled={isSoldOut}
                    onClick={() => handleCheckout(product._id)}
                    className="flex-[3] bg-primary hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {isSoldOut ? "Out of Stock" : "Buy Now"}
                  </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
