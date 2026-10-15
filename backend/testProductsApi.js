const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Product = require("./models/product.model");

// Simple helper to make HTTP requests
function request(port, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path,
        method,
        headers: {
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: rawData });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING SHOPKART PRODUCT API TESTS ===\n");
  const PORT = 5000;

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  }

  try {
    // 1. Task 3: GET /products
    const getAllRes = await request(PORT, "GET", "/products");
    assert(getAllRes.status === 200, "Task 3: GET /products returns 200");
    assert(getAllRes.data.success === true, "Task 3: GET /products has success: true");
    assert(Array.isArray(getAllRes.data.products), "Task 3: GET /products returns products array");
    assert(getAllRes.data.count === getAllRes.data.products.length, "Task 3: count matches array length");

    const firstProduct = getAllRes.data.products[0];
    const firstId = firstProduct?._id;

    // 2. Task 4: GET /products/:id
    const getByIdRes = await request(PORT, "GET", `/products/${firstId}`);
    assert(getByIdRes.status === 200, "Task 4: GET /products/:id returns 200 for valid ID");
    assert(getByIdRes.data.product._id === firstId, "Task 4: Returns correct product");

    // Task 4: Invalid ID -> 400
    const invalidIdRes = await request(PORT, "GET", "/products/invalid-id-xyz");
    assert(invalidIdRes.status === 400, "Task 4: Invalid product ID returns 400");

    // Task 4: Nonexistent ID -> 404
    const notFoundRes = await request(PORT, "GET", "/products/66d123abc456789012345678");
    assert(notFoundRes.status === 404, "Task 4: Nonexistent product ID returns 404");

    // 3. Task 5: Search
    const searchRes = await request(PORT, "GET", "/products?search=keyboard");
    assert(searchRes.status === 200, "Task 5: GET /products?search=keyboard returns 200");
    assert(
      searchRes.data.products.every((p) => p.name.toLowerCase().includes("keyboard")),
      "Task 5: Search results all contain 'keyboard' (case-insensitive)"
    );

    // 4. Task 5: Category Filtering
    const catRes = await request(PORT, "GET", "/products?category=Electronics");
    assert(catRes.status === 200, "Task 5: GET /products?category=Electronics returns 200");
    assert(
      catRes.data.products.every((p) => p.category.toLowerCase() === "electronics"),
      "Task 5: Category filter results are all Electronics"
    );

    // 5. Task 5: Combined Search & Category
    const combinedRes = await request(PORT, "GET", "/products?search=keyboard&category=Electronics");
    assert(combinedRes.status === 200, "Task 5: Combined search & category returns 200");
    assert(
      combinedRes.data.products.every(
        (p) => p.name.toLowerCase().includes("keyboard") && p.category.toLowerCase() === "electronics"
      ),
      "Task 5: Combined search & category filter matches both conditions"
    );

    // 6. Bonus Challenge: Sorting
    const sortAscRes = await request(PORT, "GET", "/products?sort=price_asc");
    const ascPrices = sortAscRes.data.products.map((p) => p.price);
    const isAsc = ascPrices.slice(1).every((p, i) => p >= ascPrices[i]);
    assert(isAsc, "Bonus: GET /products?sort=price_asc correctly sorts by price ascending");

    const sortDescRes = await request(PORT, "GET", "/products?sort=price_desc");
    const descPrices = sortDescRes.data.products.map((p) => p.price);
    const isDesc = descPrices.slice(1).every((p, i) => p <= descPrices[i]);
    assert(isDesc, "Bonus: GET /products?sort=price_desc correctly sorts by price descending");

    // 7. Task 2: POST /products (Create product)
    const newProductData = {
      name: "Smart Fitness Watch",
      description: "Water resistant fitness tracker with heart rate monitor.",
      price: 3499,
      category: "Electronics",
      image: "https://example.com/watch.jpg",
      stock: 15,
    };
    const createRes = await request(PORT, "POST", "/products", newProductData);
    assert(createRes.status === 201, "Task 2: POST /products returns 201 Created");
    assert(createRes.data.product.name === newProductData.name, "Task 2: Created product has correct name");

    // Task 2 Failure Cases:
    // Missing required field
    const missingFieldRes = await request(PORT, "POST", "/products", {
      name: "Incomplete Product",
      price: 100,
    });
    assert(missingFieldRes.status === 400, "Task 2: Missing required fields returns 400");

    // Invalid price (<= 0)
    const invalidPriceRes = await request(PORT, "POST", "/products", {
      ...newProductData,
      price: -50,
    });
    assert(invalidPriceRes.status === 400, "Task 2: Invalid price <= 0 returns 400");

    // Invalid stock (< 0)
    const invalidStockRes = await request(PORT, "POST", "/products", {
      ...newProductData,
      stock: -5,
    });
    assert(invalidStockRes.status === 400, "Task 2: Invalid stock < 0 returns 400");

    // Clean up created test product
    if (createRes.data.product?._id) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shopkart");
      await Product.findByIdAndDelete(createRes.data.product._id);
      await mongoose.connection.close();
    }

    console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===\n`);
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error("Test execution failed:", err.message);
    process.exit(1);
  }
}

runTests();
