"use client";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Package, Wallet, CheckCircle, Clock, Settings, Ticket, Link as LinkIcon, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function DashboardContent() {
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("assets");
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support Ticket Form
  const [ticketSub, setTicketSub] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");

  const fetchData = async (token) => {
      try {
          const [wRes, pRes, oRes, tRes] = await Promise.all([
             axios.get("http://localhost:5000/api/wallet/balance", { headers: { Authorization: `Bearer ${token}` } }),
             axios.get("http://localhost:5000/api/users/me", { headers: { Authorization: `Bearer ${token}` } }),
             axios.get("http://localhost:5000/api/orders/my-orders", { headers: { Authorization: `Bearer ${token}` } }),
             axios.get("http://localhost:5000/api/tickets/my-tickets", { headers: { Authorization: `Bearer ${token}` } })
          ]);
          setWalletBalance(wRes.data.walletBalance || 0);
          setProfile(pRes.data);
          setOrders(oRes.data);
          setTickets(tRes.data);
      } catch(e) { console.error("Fetch error", e); }
  };

  const topUpWallet = async () => router.push("/topup");

  useEffect(() => {
    const initData = async () => {
       const token = localStorage.getItem("token");
       if (!token) return;

       fetchData(token);

       const topup_session_id = searchParams.get('topup_session_id');
       const amount = searchParams.get('amount');
       if (topup_session_id && amount) {
           try {
              await axios.post("http://localhost:5000/api/wallet/verify-topup", { session_id: topup_session_id, amount }, {
                 headers: { Authorization: `Bearer ${token}` }
              });
              alert("Funds successfully added to KeeWallet!");
              router.replace('/dashboard');
              fetchData(token);
           } catch (e) {}
       }
    };
    if (user) initData();
  }, [user, searchParams, router]);

  const submitTicket = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      try {
          await axios.post("http://localhost:5000/api/tickets", { subject: ticketSub, message: ticketMsg }, { headers: { Authorization: `Bearer ${token}` } });
          alert("Ticket Submitted successfully!");
          setTicketSub(""); setTicketMsg("");
          fetchData(token);
      } catch(e) { alert(e.message); }
  };

  if (loading || !profile) return <div className="text-center mt-20 font-bold text-slate-500">Authenticating Vault...</div>;

  const refLink = `http://localhost:3000/register?ref=${profile.referralCode}`;

  return (
    <div className="py-10 max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl p-8 mb-10 flex flex-col md:flex-row shadow-sm border border-slate-200 gap-8 items-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-primary to-blue-400 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg">
          {profile.username.charAt(0).toUpperCase()}
        </div>
        
        <div className="text-center md:text-left flex-grow">
            <h1 className="text-4xl font-bold mb-2 text-slate-900">Hello, {profile.username}</h1>
            <p className="text-slate-500 mb-4">Welcome to your personal digital library. Manage your keys and licenses here.</p>
            
            <div className="inline-flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                 <span className="text-slate-600 font-bold">Wallet Balance:</span>
                 <span className="text-xl font-black text-emerald-500">${walletBalance.toFixed(2)}</span>
                 <button onClick={topUpWallet} className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-black transition">Top Up Balance</button>
            </div>
        </div>
        
        <div className="flex flex-col gap-3 min-w-[150px]">
          {profile.role === 'admin' && (
            <button onClick={() => router.push('/admin')} className="bg-primary hover:bg-blue-700 shadow-md text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2">
              Master Admin
            </button>
          )}
          <button onClick={() => { logout(); router.push('/'); }} className="bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition text-sm text-center">
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8">
          <button onClick={()=>setTab('assets')} className={`px-6 py-3 rounded-xl font-bold transition-all ${tab==='assets'?'bg-slate-900 text-white shadow-md':'bg-white border hover:bg-slate-50 text-slate-600 border-slate-200'}`}>My Assets</button>
          <button onClick={()=>setTab('billing')} className={`px-6 py-3 rounded-xl font-bold transition-all ${tab==='billing'?'bg-slate-900 text-white shadow-md':'bg-white border hover:bg-slate-50 text-slate-600 border-slate-200'}`}>Transaction Ledger</button>
          <button onClick={()=>setTab('affiliate')} className={`px-6 py-3 rounded-xl font-bold transition-all ${tab==='affiliate'?'bg-emerald-500 text-white shadow-md':'bg-white border hover:bg-emerald-50 text-emerald-600 border-slate-200'}`}><LinkIcon size={16} className="inline mr-1 -mt-1"/> Affiliate Hub</button>
          <button onClick={()=>setTab('support')} className={`px-6 py-3 rounded-xl font-bold transition-all ${tab==='support'?'bg-orange-500 text-white shadow-md':'bg-white border hover:bg-orange-50 text-orange-600 border-slate-200'}`}><Ticket size={16} className="inline mr-1 -mt-1"/> Support Tickets</button>
          <button onClick={()=>setTab('settings')} className={`px-6 py-3 rounded-xl font-bold transition-all ml-auto ${tab==='settings'?'bg-slate-900 text-white':'bg-white border px-4 hover:bg-slate-50 text-slate-600 border-slate-200'}`}><Settings size={18}/></button>
      </div>

      {tab === 'assets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            {orders.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl">
                 <Package className="mx-auto text-slate-400 mb-4" size={48} />
                 <h3 className="text-xl font-bold text-slate-900 mb-2">No Assets Yet</h3>
                 <p className="text-slate-500 font-medium">Head to the store to claim your first digital asset.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col hover:border-primary transition-colors group">
                  <div className="flex items-start gap-4 mb-6">
                    {order.product?.imageUrl && (
                      <img src={order.product.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    )}
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{order.product?.title || 'Unknown Asset'}</h3>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-1 mt-1"><CheckCircle size={14} className="text-emerald-500"/> Guaranteed delivery</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <KeyRound size={20} className="text-primary" />
                         <span className="text-slate-900 font-mono text-sm tracking-widest break-all font-black">
                             {order.deliveredKey}
                         </span>
                    </div>
                    <button className="text-xs text-slate-500 hover:text-primary font-bold uppercase transition block" onClick={() => navigator.clipboard.writeText(order.deliveredKey)}>Copy</button>
                  </div>
                </div>
              ))
            )}
          </div>
      )}

      {tab === 'billing' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-in fade-in">
             <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Clock size={20} className="text-primary"/> Billing History</h2>
             {orders.length === 0 ? (
                 <p className="text-slate-500 text-center py-10">No recent transactions to display.</p>
             ) : (
                 <div className="overflow-x-auto">
                     <table className="w-full text-left">
                         <thead>
                             <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                 <th className="pb-4 font-bold">Ref No.</th>
                                 <th className="pb-4 font-bold">Item</th>
                                 <th className="pb-4 font-bold">Date</th>
                                 <th className="pb-4 font-bold text-right">Amount</th>
                             </tr>
                         </thead>
                         <tbody>
                             {orders.map(o => (
                                 <tr key={o._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                     <td className="py-4 font-mono text-xs text-slate-400">{o._id.substring(0, 10)}</td>
                                     <td className="py-4 font-bold text-slate-900">{o.product?.title}</td>
                                     <td className="py-4 text-slate-500 text-sm">{new Date(o.createdAt).toLocaleDateString()}</td>
                                     <td className="py-4 text-right font-black text-slate-900">${(o.product?.price || 0).toFixed(2)}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             )}
          </div>
      )}

      {tab === 'affiliate' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-in fade-in">
             <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2"><LinkIcon className="text-emerald-500"/> Affiliate Growth Hub</h2>
             <p className="text-slate-500 mb-8 max-w-2xl">Invite friends, communities, or your followers to KeeStore. If they sign up via your unique link, you receive <span className="font-bold text-emerald-600">$5.00</span> in your KeeWallet instantly!</p>
             
             <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
                 <label className="text-xs font-bold text-emerald-700 uppercase mb-2 block">Your Unique Referral Link</label>
                 <div className="flex gap-2">
                    <input type="text" readOnly value={refLink} className="flex-grow bg-white border border-emerald-200 rounded-xl px-4 py-3 font-mono font-bold text-sm text-emerald-900 outline-none" />
                    <button onClick={()=>{navigator.clipboard.writeText(refLink); alert("Invite link copied!");}} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg whitespace-nowrap">Copy Link</button>
                 </div>
             </div>
          </div>
      )}

      {tab === 'support' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
             <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                 <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Ticket className="text-orange-500"/> Open New Ticket</h2>
                 <form onSubmit={submitTicket} className="flex flex-col gap-4">
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Subject</label>
                         <input type="text" value={ticketSub} onChange={e=>setTicketSub(e.target.value)} required placeholder="Ex: Need help installing Script" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-primary text-slate-900" />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Message</label>
                         <textarea rows={5} value={ticketMsg} onChange={e=>setTicketMsg(e.target.value)} required placeholder="Describe your issue..." className="w-full bg-slate-50 border border-slate-200 resize-none rounded-xl py-3 px-4 outline-none focus:border-primary text-slate-900"></textarea>
                     </div>
                     <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Send size={16}/> Submit Request</button>
                 </form>
             </div>

             <div className="flex flex-col gap-4">
                 <h2 className="text-xl font-black text-slate-900 mb-2">My Active Tickets</h2>
                 {tickets.length === 0 ? (
                     <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center text-slate-500">No tickets found.</div>
                 ) : (
                     tickets.map(t => (
                         <div key={t._id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                             <div className="flex justify-between items-center mb-4">
                                 <h4 className="font-bold text-slate-900">{t.subject}</h4>
                                 <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${t.status==='open'?'bg-orange-100 text-orange-600':t.status==='answered'?'bg-blue-100 text-blue-600':'bg-slate-200 text-slate-600'}`}>{t.status}</span>
                             </div>

                             <div className="flex flex-col gap-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
                               {t.messages && t.messages.map((m, i) => (
                                   <div key={i} className={`p-3 rounded-xl border ${m.sender === 'user' ? 'bg-slate-50 border-slate-100 ml-6 text-slate-700' : 'bg-blue-50 border-blue-100 mr-6 text-blue-900'}`}>
                                       <p className={`text-xs font-bold uppercase mb-1 ${m.sender === 'user' ? 'text-slate-500' : 'text-blue-800'}`}>
                                           {m.sender === 'user' ? 'You' : 'Admin'}
                                       </p>
                                       <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                                   </div>
                               ))}
                             </div>

                             {t.status !== 'closed' && (
                                <div className="mt-4 pt-4 border-t border-slate-100 text-right">
                                    <button onClick={async () => {
                                        const reply = prompt("Enter your reply to Admin:");
                                        if(!reply) return;
                                        try {
                                           const token = localStorage.getItem('token');
                                           await axios.put(`http://localhost:5000/api/tickets/${t._id}/user-reply`, { reply }, { headers:{ Authorization: `Bearer ${token}` }});
                                           alert("Reply sent!");
                                           const wRes = await axios.get("http://localhost:5000/api/tickets/my-tickets", { headers: { Authorization: `Bearer ${token}` }});
                                           setTickets(wRes.data);
                                        } catch(e) { alert("Failed to send reply"); }
                                    }} className="text-sm font-bold text-slate-500 hover:text-primary transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg">
                                       Reply to Admin
                                    </button>
                                </div>
                             )}
                         </div>
                     ))
                 )}
             </div>
          </div>
      )}

      {tab === 'settings' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm animate-in fade-in max-w-2xl">
             <h2 className="text-xl font-black text-slate-900 mb-6">Profile & Security Settings</h2>
             
             <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-8">
                 <div className="flex justify-between items-center">
                     <div className="pr-4">
                         <label className="text-sm font-bold text-slate-900 mb-1 block">Two-Factor Authentication (2FA)</label>
                         <p className="text-xs text-slate-500">Protect your digital vault with email-based secondary authorization code upon login.</p>
                     </div>
                     <button onClick={async () => {
                         try {
                             await axios.put("http://localhost:5000/api/auth/toggle-2fa", {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                             alert("2FA setting updated successfully! (Refresh to see status)");
                             const token = localStorage.getItem("token");
                             if(token) fetchData(token);
                         } catch(e) { alert("Failed to toggle 2FA"); }
                     }} className={`${profile?.twoFactorEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-slate-900 hover:bg-black text-white'} px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm whitespace-nowrap min-w-[120px]`}>
                         {profile?.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                     </button>
                 </div>
             </div>

             <div className="flex flex-col gap-6">
                 <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Username</label>
                     <input type="text" value={profile?.username || ''} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none text-slate-900 font-bold" />
                 </div>
                 <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email Address</label>
                     <input type="email" value={profile?.email || ''} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none text-slate-900 font-bold" />
                 </div>
                 <button onClick={()=>router.push("/forgot-password")} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-xl w-fit transition-colors">
                     Request Password Reset
                 </button>
             </div>
          </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="text-center mt-20 font-bold text-slate-500">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
