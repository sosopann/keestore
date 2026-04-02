"use client";
import { useAuth } from "../context/AuthContext";
import { 
  Activity, Plus, Database, Package, 
  LayoutDashboard, ShoppingBag, FolderOpen, 
  Settings, KeyRound, ArrowUpRight, Search,
  Users, Trash2, Edit, Ticket, Tag, Reply, XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [coupons, setCoupons] = useState([]);
  
  const [activeTab, setActiveTab] = useState("overview");

  // Product Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(""); 
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  // Add Keys State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newKeys, setNewKeys] = useState(""); 

  // Promo State
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoUses, setPromoUses] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (!loading && (!user || user.role !== 'admin')) {
      router.push("/");
    }
  }, [user, loading, router]);

  const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [prodRes, ordRes, usersRes, tRes, cRes] = await Promise.all([
           axios.get("http://localhost:5000/api/products"),
           axios.get("http://localhost:5000/api/orders/all", { headers: { Authorization: `Bearer ${token}` }}),
           axios.get("http://localhost:5000/api/users", { headers: { Authorization: `Bearer ${token}` }}),
           axios.get("http://localhost:5000/api/tickets/all", { headers: { Authorization: `Bearer ${token}` }}),
           axios.get("http://localhost:5000/api/coupons", { headers: { Authorization: `Bearer ${token}` }})
        ]);
        setProducts(prodRes.data);
        setOrders(ordRes.data);
        setUsers(usersRes.data);
        setTickets(tRes.data);
        setCoupons(cRes.data);
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user && user.role === 'admin') fetchData();
  }, [user]);

  // --- HANDLERS ... ---
  const handleAddProduct = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          const token = localStorage.getItem("token");
          const formData = new FormData();
          formData.append('title', title);
          formData.append('description', description);
          formData.append('category', category);
          formData.append('price', price);
          if (imageFile) formData.append('image', imageFile);
          else if (imageUrl) formData.append('imageUrl', imageUrl);

          await axios.post("http://localhost:5000/api/products", formData, { 
             headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
          alert("Product added successfully!");
          setTitle(""); setPrice(""); setDescription(""); setImageUrl(""); setImageFile(null); setCategory("General");
          fetchData();
      } catch(err) { alert("Failed: " + err.message); } finally { setSubmitting(false); }
  };

  const handleAddKeys = async (e) => {
      e.preventDefault();
      if(!selectedProductId || !newKeys) return alert("Select product and enter keys");
      try {
          const token = localStorage.getItem("token");
          const keysArray = newKeys.split(',').map(k => k.trim()).filter(k => k);
          await axios.post(`http://localhost:5000/api/products/${selectedProductId}/keys`, {
              keys: keysArray
          }, { headers: { Authorization: `Bearer ${token}` }});
          alert(`Added ${keysArray.length} keys successfully!`);
          setNewKeys(""); fetchData();
      } catch(err) { alert("Failed to add keys"); }
  };

  const handleCreatePromo = async (e) => {
      e.preventDefault();
      try {
          const token = localStorage.getItem("token");
          await axios.post("http://localhost:5000/api/coupons", { code: promoCode, discountPercent: Number(promoDiscount), maxUses: Number(promoUses) }, { headers: { Authorization: `Bearer ${token}` }});
          alert("Promo Code Created!");
          setPromoCode(""); setPromoDiscount(""); setPromoUses(0); fetchData();
      } catch(err) { alert(err.response?.data?.error || err.message); }
  };

  const handleDeletePromo = async (id) => {
      try {
          const token = localStorage.getItem("token");
          await axios.delete(`http://localhost:5000/api/coupons/${id}`, { headers: { Authorization: `Bearer ${token}` }});
          fetchData();
      } catch(e) {}
  };

  const handleReplyTicket = async (id) => {
      const reply = prompt("Enter your reply to the user:");
      if (!reply) return;
      try {
          const token = localStorage.getItem("token");
          await axios.put(`http://localhost:5000/api/tickets/${id}/reply`, { reply }, { headers: { Authorization: `Bearer ${token}` }});
          fetchData();
      } catch(e) {}
  };

  const handleCloseTicket = async (id) => {
      try {
          const token = localStorage.getItem("token");
          await axios.put(`http://localhost:5000/api/tickets/${id}/close`, {}, { headers: { Authorization: `Bearer ${token}` }});
          fetchData();
      } catch(e) {}
  };

  const handleWipeHistory = async () => {
     if(!confirm("WARNING! Wipe ALL transaction history entirely?")) return;
     const token = localStorage.getItem("token");
     try {
         await axios.delete("http://localhost:5000/api/orders/wipe/all", { headers: { Authorization: `Bearer ${token}` }});
         alert("Complete Global History Wiped."); fetchData();
     } catch (err) { alert(err.message); }
  };

  const handleDeleteOrder = async (id) => {
      if(!confirm("Wipe this specific transaction from ledger?")) return;
      const token = localStorage.getItem("token");
      try {
          await axios.delete(`http://localhost:5000/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` }});
          fetchData();
      } catch (err) { alert(err.message); }
  };

  const handleChangeWallet = async (userId, currentBal) => {
    const val = prompt(`Set absolute wallet balance (Current: $${currentBal}):`, currentBal);
    if(val === null || isNaN(val)) return;
    try {
       const token = localStorage.getItem("token");
       await axios.put(`http://localhost:5000/api/users/${userId}/wallet`, { balance: Number(val) }, { headers: { Authorization: `Bearer ${token}` } });
       alert("Wallet balance forcefully set."); fetchData();
    } catch(e) { alert(e.message); }
  };

  const handlePromoteAdmin = async (userId) => {
      if(!confirm("Promote this user to Admin Mode?")) return;
      try {
          const token = localStorage.getItem("token");
          await axios.put(`http://localhost:5000/api/users/${userId}/role`, { role: 'admin' }, { headers: { Authorization: `Bearer ${token}` } });
          alert("User is now an Administrator."); fetchData();
      } catch(e) { alert(e.message); }
  };

  if (!mounted || loading || !user) return <div className="text-center mt-20">Loading Command Center...</div>;

  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.product?.price || 0), 0);
  const totalKeysSold = orders.filter(o => o.status === 'success' && o.deliveredKey).length;
  const totalStock = products.reduce((sum, p) => sum + p.keys.length, 0);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 border-t border-slate-200">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-2 overflow-y-auto">
         <div className="mb-8 px-4">
             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Command Center</h2>
             <p className="text-xl font-black text-slate-900 leading-tight">Master<br/><span className="text-primary text-3xl">Admin</span></p>
         </div>

         <button onClick={()=>setActiveTab('overview')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab==='overview'?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100'}`}>
             <LayoutDashboard size={20}/> Global Overview
         </button>
         <button onClick={()=>setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab==='users'?'bg-emerald-500 text-white':'text-slate-600 hover:bg-slate-100'}`}>
             <Users size={20}/> User CRM
         </button>
         <button onClick={()=>setActiveTab('orders')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab==='orders'?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100'}`}>
             <ShoppingBag size={20}/> History Ledger
         </button>
         <button onClick={()=>setActiveTab('catalog')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab==='catalog'?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100'}`}>
             <FolderOpen size={20}/> Catalog Planner
         </button>
         <button onClick={()=>setActiveTab('vault')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab==='vault'?'bg-indigo-600 text-white':'text-slate-600 hover:bg-slate-100'}`}>
             <KeyRound size={20}/> Digital Vault
         </button>
         <button onClick={()=>setActiveTab('promo')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab==='promo'?'bg-pink-600 text-white':'text-slate-600 hover:bg-slate-100'}`}>
             <Tag size={20}/> Promo Engine
         </button>
         <button onClick={()=>setActiveTab('support')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab==='support'?'bg-orange-500 text-white':'text-slate-600 hover:bg-slate-100'}`}>
             <Ticket size={20}/> Support Desk
         </button>

         <button onClick={()=>setActiveTab('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab==='settings'?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100'}`}>
             <Settings size={20}/> System Settings
         </button>

         <div className="mt-auto pt-8">
             <button onClick={()=>router.push('/')} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 w-full">
                 <ArrowUpRight size={20}/> Storefront
             </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto w-full">
         
         {/* OVERVIEW TAB */}
         {activeTab === 'overview' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex justify-between items-center mb-8">
                     <div>
                         <h1 className="text-3xl font-black text-slate-900 tracking-tight">Main Dashboard</h1>
                         <p className="text-slate-500">Welcome to your Master CRM snapshot.</p>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Activity size={24}/></div>
                         <p className="text-slate-500 text-sm font-bold mb-1">Lifetime Revenue</p>
                         <h3 className="text-3xl font-black text-slate-900">${totalRevenue.toFixed(2)}</h3>
                     </div>
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><ShoppingBag size={24}/></div>
                         <p className="text-slate-500 text-sm font-bold mb-1">Keys Dispatched</p>
                         <h3 className="text-3xl font-black text-slate-900">{totalKeysSold}</h3>
                     </div>
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><KeyRound size={24}/></div>
                         <p className="text-slate-500 text-sm font-bold mb-1">Warehouse Stock</p>
                         <h3 className="text-3xl font-black text-slate-900">{totalStock}</h3>
                     </div>
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Users size={24}/></div>
                         <p className="text-slate-500 text-sm font-bold mb-1">Global Accounts</p>
                         <h3 className="text-3xl font-black text-slate-900">{users.length}</h3>
                     </div>
                 </div>
             </div>
         )}

         {/* USERS CRM MANAGEMENT */}
         {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-8">
                     <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">User CRM</h1>
                        <p className="text-slate-500">Control global user accounts and wallet balances directly.</p>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                     <div className="overflow-x-auto w-full">
                         <table className="w-full text-left whitespace-nowrap">
                             <thead>
                                 <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50">
                                     <th className="py-4 px-6 font-bold">Username</th>
                                     <th className="py-4 px-6 font-bold">Registration Date</th>
                                     <th className="py-4 px-6 font-bold">Role</th>
                                     <th className="py-4 px-6 font-bold">Wallet Balance</th>
                                     <th className="py-4 px-6 font-bold text-right">Master Controls</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {users.map(u => (
                                     <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50">
                                         <td className="py-4 px-6 font-bold text-slate-800">
                                            {u.username} <br/><span className="text-xs font-normal text-slate-400">{u.email}</span>
                                            {u.referralCode && <div className="text-[10px] text-emerald-500 font-mono mt-1">Ref: {u.referralCode}</div>}
                                         </td>
                                         <td className="py-4 px-6 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                         <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-md text-xs font-black ${u.role==='admin'?'bg-primary text-white':'bg-slate-200 text-slate-600'}`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                         </td>
                                         <td className="py-4 px-6 font-black text-emerald-600 text-lg">
                                             ${u.walletBalance?.toFixed(2) || '0.00'}
                                         </td>
                                         <td className="py-4 px-6 text-right">
                                             <div className="flex items-center justify-end gap-2">
                                                 <button onClick={() => handleChangeWallet(u._id, u.walletBalance)} className="p-2 bg-slate-100 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors" title="Force Edit Balance">
                                                     <Edit size={16}/>
                                                 </button>
                                                 {u.role !== 'admin' && (
                                                     <button onClick={() => handlePromoteAdmin(u._id)} className="p-2 bg-slate-100 hover:bg-primary text-blue-600 rounded-lg transition-colors text-xs font-bold" title="Promote to Admin">
                                                         Promote
                                                     </button>
                                                 )}
                                             </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         {users.length === 0 && <p className="text-center text-slate-400 py-6 font-bold">Loading CRM...</p>}
                     </div>
                 </div>
              </div>
         )}


         {/* ORDERS MANAGEMENT */}
         {activeTab === 'orders' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex justify-between items-center mb-8">
                     <div>
                         <h1 className="text-3xl font-black text-slate-900 tracking-tight">History Ledger</h1>
                         <p className="text-slate-500">All transactional data recorded globally.</p>
                     </div>
                     <button onClick={handleWipeHistory} className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2">
                         <Trash2 size={16}/> Redact All History
                     </button>
                 </div>
                 
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                     <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center">
                         <Search className="text-slate-400 mr-3" size={20} />
                         <input type="text" placeholder="Search by Order ID, User, or Status..." className="bg-transparent border-none outline-none w-full text-slate-900" />
                     </div>
                     <div className="overflow-x-auto w-full">
                         <table className="w-full text-left whitespace-nowrap">
                             <thead>
                                 <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-white">
                                     <th className="py-4 px-6 font-bold">Date</th>
                                     <th className="py-4 px-6 font-bold">Order UID</th>
                                     <th className="py-4 px-6 font-bold">Buyer</th>
                                     <th className="py-4 px-6 font-bold">Amount</th>
                                     <th className="py-4 px-6 font-bold">Secret Dispensed</th>
                                     <th className="py-4 px-6 font-bold text-right">Delete</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {orders.map(o => (
                                     <tr key={o._id} className="border-b border-slate-100 hover:bg-slate-50">
                                         <td className="py-4 px-6 text-sm text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                                         <td className="py-4 px-6 font-mono text-xs text-slate-400">{o._id.substring(0, 8)}...</td>
                                         <td className="py-4 px-6 font-bold text-slate-800">{o.user?.username || 'Redacted User'}</td>
                                         <td className="py-4 px-6 text-slate-600 font-bold">${o.product?.price?.toFixed(2) || '0.00'}</td>
                                         <td className="py-4 px-6">
                                            <div className="max-w-[150px] truncate font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                {o.deliveredKey}
                                            </div>
                                         </td>
                                         <td className="py-4 px-6 text-right">
                                             <button onClick={() => handleDeleteOrder(o._id)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                                                 <Trash2 size={16}/>
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         {orders.length === 0 && <p className="text-center text-slate-400 py-6">Ledger is clean.</p>}
                     </div>
                 </div>
             </div>
         )}

         {/* CATALOG HUB */}
         {activeTab === 'catalog' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-8">
                 <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Catalog Planner</h1>
                    <p className="text-slate-500 mt-1">Publish new digital assets to the live store immediately.</p>
                 </div>

                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-4xl">
                     <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><Plus size={20} className="text-primary"/> Create Asset Form</h3>
                     <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         
                         <div className="md:col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Title</label>
                             <input type="text" placeholder="Ex: Advanced Police System V2" value={title} onChange={(e)=>setTitle(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary text-slate-900" />
                         </div>

                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                             <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary text-slate-900">
                                <option value="General">General</option>
                                <option value="Scripts">FiveM Scripts</option>
                                <option value="Vehicles">Vehicles</option>
                                <option value="Maps">Maps & MLOs</option>
                                <option value="Software">Other Software</option>
                             </select>
                         </div>

                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">USD Price</label>
                             <input type="number" step="0.01" placeholder="49.99" value={price} onChange={(e)=>setPrice(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary text-slate-900" />
                         </div>

                         <div className="md:col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Upload Thumbnail Image</label>
                             <input type="file" accept="image/*" onChange={(e)=>setImageFile(e.target.files[0])} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 outline-none focus:border-primary text-slate-900" />
                             <p className="text-xs text-slate-400 mt-2">Or provide an external URL below if you don't want to upload:</p>
                             <input type="url" placeholder="https://imgur.com/... (Optional Fallback)" value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary text-slate-900" />
                         </div>

                         <div className="md:col-span-2">
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                             <textarea placeholder="Write compelling features..." rows="4" value={description} onChange={(e)=>setDescription(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary text-slate-900 resize-none"></textarea>
                         </div>

                         <div className="md:col-span-2 pt-4">
                             <button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-colors shadow-md">
                                 {submitting ? "Pushing to Cloud..." : "Publish to Storefront"}
                             </button>
                         </div>
                     </form>
                 </div>

                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mt-4">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><FolderOpen size={20} className="text-primary"/> Live Products Management</h3>
                    <div className="overflow-x-auto w-full">
                         <table className="w-full text-left whitespace-nowrap">
                             <thead>
                                 <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-white">
                                     <th className="py-2 px-4 font-bold">Image</th>
                                     <th className="py-2 px-4 font-bold">Product</th>
                                     <th className="py-2 px-4 font-bold">Price</th>
                                     <th className="py-2 px-4 font-bold text-right">Actions</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {products.map(p => (
                                     <tr key={p._id} className="border-b border-slate-100 items-center">
                                         <td className="py-2 px-4"><img src={p.imageUrl} alt="" className="w-10 h-10 object-cover rounded-md" /></td>
                                         <td className="py-2 px-4 font-bold text-slate-800 text-sm overflow-hidden truncate max-w-[200px]">{p.title}</td>
                                         <td className="py-2 px-4 text-emerald-600 font-bold">${p.price.toFixed(2)}</td>
                                         <td className="py-2 px-4 text-right">
                                             <button onClick={async () => {
                                                 const newPrice = prompt(`Enter new price for ${p.title} (Current: ${p.price}):`);
                                                 if (!newPrice || isNaN(newPrice)) return;
                                                 try {
                                                     const token = localStorage.getItem("token");
                                                     await axios.put(`http://localhost:5000/api/products/${p._id}`, { price: parseFloat(newPrice) }, { headers: { Authorization: `Bearer ${token}` } });
                                                     alert("Product Updated!"); fetchData();
                                                 } catch(e) { alert("Failed to update."); }
                                             }} className="text-blue-500 hover:text-blue-700 p-2"><Edit size={16}/></button>
                                             
                                             <button onClick={async () => {
                                                 if(!confirm(`Delete ${p.title} entirely?`)) return;
                                                 try {
                                                     const token = localStorage.getItem("token");
                                                     await axios.delete(`http://localhost:5000/api/products/${p._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                     alert("Product Deleted!"); fetchData();
                                                 } catch(e) { alert("Failed to delete."); }
                                             }} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                    </div>
                 </div>
             </div>
         )}

         {/* DIGITAL VAULT (KEYS RESTOCK) */}
         {activeTab === 'vault' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-8">
                 <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Database className="text-indigo-600"/> Digital Vault Logistics
                    </h1>
                    <p className="text-slate-500 mt-2">Restock license keys and digital assets assigned to products.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-md relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                         <h3 className="text-xl font-bold mb-6 text-slate-900">Inject Batch Licenses</h3>
                         <form onSubmit={handleAddKeys} className="flex flex-col gap-5">
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Select Target Product Engine</label>
                                 <select value={selectedProductId} onChange={(e)=>setSelectedProductId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 text-slate-900">
                                     <option value="" disabled>Select...</option>
                                     {products.map(p => <option key={p._id} value={p._id}>{p.title} (Stock: {p.keys.length})</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data Payload (Comma Separated)</label>
                                 <textarea placeholder="LICENSE-123, LICENSE-456, G2A-ABCD-EFGH" rows="6" value={newKeys} onChange={(e)=>setNewKeys(e.target.value)} required className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 px-4 outline-none focus:border-indigo-500 text-emerald-400 font-mono text-sm resize-none"></textarea>
                                 <p className="text-xs text-slate-400 mt-2">Any format accepted. Extracted exactly to customer display upon purchase.</p>
                             </div>
                             <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 text-white font-black py-4 rounded-xl transition-all">
                                 Deposit Vault Data
                             </button>
                         </form>
                     </div>

                     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                         <div className="p-6 border-b border-slate-100">
                             <h3 className="text-lg font-bold text-slate-900">Current Stock Levels</h3>
                         </div>
                         <div className="p-2 overflow-y-auto max-h-[400px]">
                             {products.map(p => (
                                 <div key={p._id} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg">
                                     <div>
                                         <p className="font-bold text-slate-800 text-sm">{p.title}</p>
                                         <p className="text-xs text-slate-400">{p.category}</p>
                                     </div>
                                     <div className={`px-3 py-1 rounded-md text-xs font-black ${p.keys.length > 5 ? 'bg-emerald-100 text-emerald-700' : p.keys.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                         {p.keys.length} QTY
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
         )}
         
         {/* PROMO ENGINE */}
         {activeTab === 'promo' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-8">
                 <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Tag className="text-pink-600"/> Promo Code Engine
                    </h1>
                    <p className="text-slate-500 mt-2">Generate discount campaigns to drive sales and traffic.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white p-8 rounded-2xl border border-pink-100 shadow-md">
                         <h3 className="text-xl font-bold mb-6 text-slate-900">Issue New Code</h3>
                         <form onSubmit={handleCreatePromo} className="flex flex-col gap-5">
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Promo Code</label>
                                 <input type="text" placeholder="SUMMER50" value={promoCode} onChange={(e)=>setPromoCode(e.target.value.toUpperCase())} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-pink-500 font-mono font-bold text-slate-900" />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Discount Percentage (%)</label>
                                 <input type="number" placeholder="20" min="1" max="100" value={promoDiscount} onChange={(e)=>setPromoDiscount(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-pink-500 text-slate-900 font-bold" />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Usage Limit (0 for Unlimited)</label>
                                 <input type="number" placeholder="10" min="0" value={promoUses} onChange={(e)=>setPromoUses(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-pink-500 text-slate-900" />
                             </div>
                             <button type="submit" className="bg-pink-600 hover:bg-pink-700 shadow-lg text-white font-black py-4 rounded-xl transition-all">
                                 Generate Global Code
                             </button>
                         </form>
                     </div>

                     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                         <div className="p-6 border-b border-slate-100">
                             <h3 className="text-lg font-bold text-slate-900">Active Campaigns</h3>
                         </div>
                         <div className="p-2 overflow-y-auto max-h-[400px]">
                             {coupons.map(c => (
                                 <div key={c._id} className="flex justify-between items-center p-4 border-b border-slate-50 hover:bg-slate-50 rounded-lg group">
                                     <div>
                                         <p className="font-bold text-pink-600 font-mono tracking-wider">{c.code}</p>
                                         <p className="text-xs text-slate-400 font-bold">-{c.discountPercent}% OFF</p>
                                     </div>
                                     <div className="flex items-center gap-4">
                                         <p className="text-xs text-slate-500">{c.maxUses === 0 ? 'Unlimited' : `${c.currentUses}/${c.maxUses} Used`}</p>
                                         <button onClick={() => handleDeletePromo(c._id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                     </div>
                                 </div>
                             ))}
                             {coupons.length === 0 && <p className="text-center text-slate-400 py-6">No active coupons.</p>}
                         </div>
                     </div>
                 </div>
             </div>
         )}

         {/* SUPPORT DESK */}
         {activeTab === 'support' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-8">
                 <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Ticket className="text-orange-500"/> Support Desk
                    </h1>
                    <p className="text-slate-500 mt-2">Manage customer queries and helpdesk tickets.</p>
                 </div>

                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-5xl">
                     {tickets.map(t => (
                         <div key={t._id} className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-orange-200 transition-colors">
                             <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-3">
                                 <div>
                                     <h3 className="font-bold text-slate-900">{t.subject}</h3>
                                     <p className="text-xs text-slate-500">From: {t.user?.username || 'Unknown'} | {new Date(t.createdAt).toLocaleDateString()}</p>
                                 </div>
                                 <span className={`px-3 py-1 rounded-md text-xs font-black uppercase ${t.status==='open'?'bg-orange-100 text-orange-600':t.status==='answered'?'bg-blue-100 text-blue-600':'bg-slate-200 text-slate-600'}`}>{t.status}</span>
                             </div>
                             
                             <div className="flex flex-col gap-3 mb-4 max-h-[300px] overflow-y-auto px-2">
                               {t.messages && t.messages.map((m, i) => (
                                   <div key={i} className={`p-3 rounded-xl border ${m.sender === 'admin' ? 'bg-blue-50 border-blue-100 ml-6 text-blue-900' : 'bg-white border-slate-200 mr-6 text-slate-700 shadow-sm'}`}>
                                       <p className={`text-xs font-bold uppercase mb-1 ${m.sender === 'admin' ? 'text-blue-800' : 'text-slate-500'}`}>
                                           {m.sender === 'admin' ? 'Support Agent (You)' : 'Customer'}
                                       </p>
                                       <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                                   </div>
                               ))}
                             </div>

                             <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                                 {t.status !== 'closed' && (
                                     <>
                                         <button onClick={()=>handleReplyTicket(t._id)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"><Reply size={14}/> Reply to Customer</button>
                                         <button onClick={()=>handleCloseTicket(t._id)} className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"><XCircle size={14}/> Close Ticket</button>
                                     </>
                                 )}
                             </div>
                         </div>
                     ))}
                     {tickets.length === 0 && <p className="text-center text-slate-500 font-bold py-10">No pending tickets. Good job!</p>}
                 </div>
             </div>
         )}
         
         {/* SYSTEM SETTINGS */}
         {activeTab === 'settings' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Settings className="text-slate-900"/> System Settings
                    </h1>
                    <p className="text-slate-500 mt-2">Manage global configurations for the storefront.</p>
                 </div>

                 <div className="mt-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-xl">
                     <h3 className="text-xl font-bold mb-6 text-slate-900">Upload Store Logo</h3>
                     <p className="text-slate-500 text-sm mb-4">Replaces the logo in the Navbar and Footer. Best dimensions: 150x50px.</p>
                     <form onSubmit={async (e)=>{
                         e.preventDefault();
                         const file = e.target.logo.files[0];
                         if(!file) return alert("Select an image!");
                         const formData = new FormData(); formData.append('logo', file);
                         try {
                             await axios.post("http://localhost:5000/api/settings/logo", formData, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                             alert("Logo updated! Refresh the storefront to see changes.");
                         } catch(err) { alert(err.response?.data?.error || err.message || "Failed to upload."); }
                     }}>
                         <input type="file" name="logo" accept="image/png, image/jpeg, image/svg+xml" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-slate-400 mb-4 text-slate-900" />
                         <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-3 rounded-xl transition-colors">Apply Global Logo</button>
                     </form>
                 </div>
             </div>
         )}
      </main>
    </div>
  );
}
