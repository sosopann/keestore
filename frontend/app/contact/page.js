"use client";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Let's Get in <span className="text-secondary">Touch</span></h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Have a question about a product, need technical support, or want to partner with us? Our team is available 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass p-6 rounded-2xl border border-white/5 flex gap-4 items-center">
                <div className="bg-primary/20 p-3 rounded-lg text-primary"><Mail size={24}/></div>
                <div>
                    <h4 className="font-bold text-gray-300">Email</h4>
                    <p className="text-white">support@keestore.app</p>
                </div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/5 flex gap-4 items-center">
                <div className="bg-secondary/20 p-3 rounded-lg text-secondary"><Phone size={24}/></div>
                <div>
                    <h4 className="font-bold text-gray-300">Phone</h4>
                    <p className="text-white">+1 (555) 123-4567</p>
                </div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/5 flex gap-4 items-center">
                <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400"><MapPin size={24}/></div>
                <div>
                    <h4 className="font-bold text-gray-300">Headquarters</h4>
                    <p className="text-white">123 Tech Avenue, NY</p>
                </div>
            </div>
        </div>

        <div className="lg:col-span-2 glass p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
            <h3 className="text-2xl font-bold mb-6">Send us a message</h3>
            <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); alert("Thanks for your message! Our team will reply shortly."); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Your Name" className="bg-black/40 border border-white/10 rounded-xl py-4 px-6 outline-none focus:border-primary transition-colors text-white" required />
                    <input type="email" placeholder="Email Address" className="bg-black/40 border border-white/10 rounded-xl py-4 px-6 outline-none focus:border-primary transition-colors text-white" required />
                </div>
                <input type="text" placeholder="Subject" className="bg-black/40 border border-white/10 rounded-xl py-4 px-6 outline-none focus:border-primary transition-colors text-white" required />
                <textarea rows="5" placeholder="Your Message..." className="bg-black/40 border border-white/10 rounded-xl py-4 px-6 outline-none focus:border-primary transition-colors text-white resize-none" required></textarea>
                <button type="submit" className="bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-lg transition-all hover:glow-primary self-start px-12 mt-2">
                    Send Message
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}
