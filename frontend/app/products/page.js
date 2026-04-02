"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { PackageSearch, Search, ShoppingCart, LayoutGrid } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    axios.get("http://localhost:5000/api/products")
      .then(res => setProducts(res.data.slice(0, 100)))
      .catch(console.error);
  }, []);

  const handleCheckout = async (productId) => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      router.push(`/checkout?product_id=${productId}`);
  };

  const categories = ["All", "General", "Scripts", "Vehicles", "Maps", "Software"];

  const filteredProducts = products.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "All" ? true : p.category === selectedCategory;
      return matchSearch && matchCategory;
  });

  return (
    <div className="py-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
         <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 text-slate-900"><LayoutGrid className="text-primary"/> All Digital Assets</h1>
            <p className="text-slate-500 mt-2">Browse our complete collection of premium digital items.</p>
         </div>
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary text-slate-900 shadow-sm"
            />
         </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
         {categories.map(cat => (
             <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 check rounded-full font-bold transition-colors shadow-sm
                    ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 border'}`}
             >
                 {cat}
             </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map((product) => {
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
              
              <div className="p-6 flex flex-col flex-grow">
                <Link href={`/products/${product._id}`}>
                    <h3 className="text-xl font-bold mb-2 text-slate-900 line-clamp-1 hover:text-primary transition-colors">{product.title}</h3>
                </Link>
                <p className="text-slate-500 text-sm mb-6 flex-grow line-clamp-2">{product.description}</p>
                
                <div className="flex items-center gap-3">
                    <button 
                      disabled={isSoldOut}
                      onClick={() => { addToCart(product); addToast(`${product.title} added!`); }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={18} />
                    </button>
                    <button 
                      disabled={isSoldOut}
                      onClick={() => handleCheckout(product._id)}
                      className="flex-[3] bg-primary hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {isSoldOut ? "Out of Stock" : (loadingId === product._id ? "Processing..." : "Buy Now")}
                    </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredProducts.length === 0 && (
         <div className="text-center py-20 text-slate-500 font-bold text-xl">
             No products found in "{selectedCategory}".
         </div>
      )}
    </div>
  );
}
