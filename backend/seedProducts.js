const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Product = require("./models/product.model");

const sampleProducts = [
  {
    name: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with tactile blue switches and detachable USB-C cable.",
    price: 2999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60",
    stock: 10,
  },
  {
    name: "Noise Cancelling Headphones",
    description: "Wireless over-ear headphones with active noise cancellation and 40-hour battery life.",
    price: 4999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60",
    stock: 25,
  },
  {
    name: "Wireless Gaming Mouse",
    description: "Ultra-lightweight ergonomic wireless mouse with 26K DPI optical sensor.",
    price: 1499,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=60",
    stock: 40,
  },
  {
    name: "Cotton Oversized Hoodie",
    description: "Premium fleece lined heavyweight cotton hoodie for everyday comfort.",
    price: 1899,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=60",
    stock: 15,
  },
  {
    name: "Running Shoes Pro",
    description: "Breathable mesh running sneakers with responsive foam cushioning.",
    price: 3499,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=60",
    stock: 20,
  },
  {
    name: "Clean Code",
    description: "A handbook of agile software craftsmanship by Robert C. Martin.",
    price: 899,
    category: "Books",
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&auto=format&fit=crop&q=60",
    stock: 12,
  },
  {
    name: "Atomic Habits",
    description: "An easy & proven way to build good habits and break bad ones by James Clear.",
    price: 499,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60",
    stock: 35,
  },
  {
    name: "Minimalist Desk Lamp",
    description: "Dimmable LED architect desk lamp with 5 color modes and wireless charging base.",
    price: 1299,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=60",
    stock: 18,
  },
  {
    name: "Ceramic Coffee Mug Set",
    description: "Handcrafted matte ceramic mugs (set of 4) ideal for espresso and cappuccino.",
    price: 799,
    category: "Home",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=60",
    stock: 8,
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/shopkart";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing products to ensure clean seed
    await Product.deleteMany({});
    console.log("Cleared existing products.");

    const created = await Product.insertMany(sampleProducts);
    console.log(`Successfully seeded ${created.length} products!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
