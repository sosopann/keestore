import { ShieldCheck, Target, Zap } from "lucide-react";

export const metadata = { title: "About Us - KeeStore" };

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-5xl font-bold mb-6">About <span className="text-primary">KeeStore</span></h1>
      <p className="text-xl text-gray-400 mb-12 leading-relaxed">
        KeeStore was founded with a single mission in mind: providing the fastest, most reliable, and highly secure platform for purchasing digital keys, game licenses, and premium coding assets.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
           <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
           <p className="text-gray-400 leading-relaxed">
             We believe that the digital economy requires robust infrastructure. Waiting 24 hours for a game key or a software license is a thing of the past. By leveraging state-of-the-art payment gateways and custom cloud architectures, we deliver your digital purchases in milliseconds.
           </p>
        </div>
        <div className="glass p-8 rounded-2xl flex flex-col justify-center items-center text-center">
            <Target className="text-secondary mb-4" size={48} />
            <h3 className="text-xl font-bold">Precision & Speed</h3>
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-8">Why Thousands Trust Us</h2>
      <div className="flex flex-col gap-6">
         <div className="glass p-6 rounded-xl border border-white/5 flex gap-6 items-center">
             <div className="bg-primary/20 p-4 rounded-xl text-primary"><Zap size={32} /></div>
             <div>
                 <h4 className="text-xl font-bold mb-1">Instant Fulfillment</h4>
                 <p className="text-gray-400">The moment your payment clears, our system processes the extraction of secure keys to your dashboard instantaneously.</p>
             </div>
         </div>
         <div className="glass p-6 rounded-xl border border-white/5 flex gap-6 items-center">
             <div className="bg-secondary/20 p-4 rounded-xl text-secondary"><ShieldCheck size={32} /></div>
             <div>
                 <h4 className="text-xl font-bold mb-1">Zero Compromise on Security</h4>
                 <p className="text-gray-400">We don't store plain-text payment methods. Everything is tokenized and processed via Stripe's certified PCI-DSS compliant handlers.</p>
             </div>
         </div>
      </div>
    </div>
  );
}
