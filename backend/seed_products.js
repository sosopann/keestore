require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  // 1. Scripts
  { title: "Premium Discord Ticket Bot", description: "Full professional ticket bot (Node.js/Python) with advanced dashboard control.", price: 15, category: "Scripts", imageUrl: "/images/scripts.png" },
  { title: "FiveM Advanced Anti-Cheat System", description: "Powerful anti-cheat for FiveM servers, blocking common hacks and exploits.", price: 30, category: "Scripts", imageUrl: "/images/scripts.png" },
  { title: "Roblox Murder Mystery Auto-Farmer", description: "Automated coin collection script for Roblox Murder Mystery games.", price: 10, category: "Scripts", imageUrl: "/images/scripts.png" },
  { title: "Python E-commerce Scraper", description: "Extract product data and prices from any competitor site into Excel sheets.", price: 25, category: "Scripts", imageUrl: "/images/scripts.png" },
  { title: "V2Ray/VLESS Auto-Installer", description: "One-click Bash installer for secure VPN servers and firewall bypass.", price: 10, category: "Scripts", imageUrl: "/images/scripts.png" },
  { title: "Crypto Price Alert Telegram Bot", description: "Python bot for real-time Telegram notifications on crypto price changes.", price: 20, category: "Scripts", imageUrl: "/images/scripts.png" },

  // 2. Vehicles
  { title: "Mega JDM Drift Car Pack", description: "Optimized pack of 50 high-quality JDM drift cars for gaming servers.", price: 15, category: "Vehicles", imageUrl: "/images/vehicles.png" },
  { title: "Egyptian Police Fleet", description: "Realistic Egyptian police vehicles with custom lighting and liveries.", price: 20, category: "Vehicles", imageUrl: "/images/vehicles.png" },
  { title: "Luxury SUV Collection", description: "VIP collection including G-Class and Range Rover models.", price: 12, category: "Vehicles", imageUrl: "/images/vehicles.png" },
  { title: "Emergency EMS Helicopter", description: "Custom EMS helicopter with advanced lighting and medical interior.", price: 5, category: "Vehicles", imageUrl: "/images/vehicles.png" },

  // 3. Maps
  { title: "Secret Underground Gang Base", description: "Hidden underground base in Los Santos for gang roles and operations.", price: 35, category: "Maps", imageUrl: "/images/maps.png" },
  { title: "Custom Luxury Car Dealership", description: "High-end car dealership map with professional showroom lighting.", price: 25, category: "Maps", imageUrl: "/images/maps.png" },
  { title: "Roblox Custom Arena Map", description: "Battle-ready arena for combat or Battle Royale games in Roblox.", price: 15, category: "Maps", imageUrl: "/images/maps.png" },
  { title: "Valorant Aim Training Course", description: "Clean training course designed to improve aim and reflexes.", price: 10, category: "Maps", imageUrl: "/images/maps.png" },
  { title: "Tota Boba Virtual Cafe", description: "Fully detailed interior cafe map for immersive roleplay scenarios.", price: 15, category: "Maps", imageUrl: "/images/maps.png" },

  // 4. Software & Tools
  { title: "VPS Hardening Guide & Tool", description: "Automated tool to secure new Linux servers and close vulnerabilities.", price: 20, category: "Software", imageUrl: "/images/software.png" },
  { title: "React + Tailwind Admin Dashboard", description: "Premium, production-ready admin template for developers.", price: 40, category: "Software", imageUrl: "/images/software.png" },
  { title: "Automated Cloudflare Tunnel Setup", description: "Easily link local servers to the internet without port forwarding.", price: 10, category: "Software", imageUrl: "/images/software.png" },
  { title: "Kali Linux Wi-Fi Audit Cheat Sheet", description: "Comprehensive guide and tools for ethical wireless security testing.", price: 12, category: "Software", imageUrl: "/images/software.png" },
  { title: "SureCart E-commerce Starter Theme", description: "Pre-integrated theme with payment gateway setup for online shops.", price: 25, category: "Software", imageUrl: "/images/software.png" },

  // 5. General / Digital Keys
  { title: "Premium VPN 1-Month License Key", description: "High-speed VPN monthly access key for global content.", price: 5, category: "General", imageUrl: "https://images.unsplash.com/photo-1633265485768-3069ef93711d?w=400&h=400&fit=crop" },
  { title: "Global eSIM Trial Method", description: "Step-by-step PDF guide for international roaming and mobile data.", price: 8, category: "General", imageUrl: "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=400&h=400&fit=crop" },
  { title: "Valorant 1000 VP Gift Card", description: "Digital code for 1000 Valorant Points, delivered instantly.", price: 10, category: "General", imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop" },
  { title: "Windows 11 Pro OEM Key", description: "Genuine OEM license for Windows 11 Professional activation.", price: 15, category: "General", imageUrl: "https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?w=400&h=400&fit=crop" },
  { title: "Premium Entertainment Account", description: "1-month access for Netflix/Spotify premium accounts.", price: 4, category: "General", imageUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=400&fit=crop" }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for Seeding...");

        // Clear existing products
        await Product.deleteMany({});
        console.log("Cleared old products.");

        const seededProducts = products.map(p => {
            const keys = [];
            for(let i=0; i<100; i++) {
                const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
                keys.push(`LICENSE-${p.title.substring(0,3).toUpperCase()}-${randomPart}`);
            }
            return { ...p, keys };
        });

        await Product.insertMany(seededProducts);
        console.log("Successfully seeded 25 premium digital products with 100 keys each!");
        
        mongoose.connection.close();
    } catch(e) {
        console.error("Seeding failed", e);
        process.exit(1);
    }
};

seed();
