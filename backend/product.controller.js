const mongoose = require("mongoose");
const Product = require("../models/product.model");

// ============================================================
// POST /products — Create a new product (Task 2)
// ============================================================
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // 1. Validate required fields
    if (!name || !description || price === undefined || price === null || !category || !image || stock === undefined || stock === null) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. name, description, price, category, image, and stock are mandatory.",
      });
    }

    // 2. Validate price > 0
    if (typeof price !== "number" || price <= 0 || isNaN(price)) {
      return res.status(400).json({
        success: false,
        message: "Invalid price. Price must be a number greater than 0.",
      });
    }

    // 3. Validate stock >= 0
    if (typeof stock !== "number" || stock < 0 || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock. Stock cannot be negative.",
      });
    }

    // Create product
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      image: image.trim(),
      stock,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error creating product",
      error: error.message,
    });
  }
};

// ============================================================
// GET /products — Get products with search, filter, and sort (Tasks 3, 5 & Bonus)
// ============================================================
const getAllProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Dynamically build MongoDB query filter
    const query = {};

    // Task 5: Case-insensitive search on product name
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // Task 5: Category filter (ignoring case, and ignoring "All Categories" / "All")
    if (category && category !== "All" && category !== "All Categories" && category.trim() !== "") {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }

    // Bonus Challenge: Price sorting
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    }

    const products = await Product.find(query).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
      error: error.message,
    });
  }
};

// ============================================================
// GET /products/:id — Get a single product by ID (Task 4)
// ============================================================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
};
