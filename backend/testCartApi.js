const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Customer = require("./models/customer.model");
const Product = require("./models/product.model");
const app = require("./index");

let server;
let baseUrl;

async function runTests() {
  console.log("==================================================");
  console.log("🧪 SHOPKART LAB 05 — SHOPPING CART API TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Connect to DB and start server on test port
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shopkart");
    const PORT = 5059;
    await new Promise((resolve) => {
      server = app.listen(PORT, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${PORT}`;

    // 2. Register a new test customer
    const testEmail = `cart_tester_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Cart Tester",
        email: testEmail,
        password: "password123",
        phone: "9876543210",
      }),
    });
    assert(regRes.status === 201, `Customer registered (Status: ${regRes.status})`);

    // 3. Login to retrieve token
    const loginRes = await fetch(`${baseUrl}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "password123",
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    assert(loginRes.status === 200 && !!token, "Customer logged in & JWT token received");

    // 4. Find or create a test product (with known stock)
    let product = await Product.findOne({ stock: { $gte: 5 } });
    if (!product) {
      product = await Product.create({
        name: "Test Mechanical Keyboard",
        description: "RGB Mechanical Keyboard for Cart Testing",
        price: 2999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
        stock: 5,
      });
    }
    const productId = product._id.toString();
    console.log(`\nTesting with Product: "${product.name}" (ID: ${productId}, Stock: ${product.stock})`);

    // --- TEST 1: Unauthenticated request ---
    console.log("\n--- Test 1: Unauthenticated Request (Postman Test 7) ---");
    const unauthRes = await fetch(`${baseUrl}/cart/${productId}`, {
      method: "POST",
    });
    assert(unauthRes.status === 401, `Unauthenticated request returned 401 Unauthorized`);

    // --- TEST 2: Invalid Product ID ---
    console.log("\n--- Test 2: Invalid Product ID Validation ---");
    const invalidIdRes = await fetch(`${baseUrl}/cart/not-a-valid-id`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(invalidIdRes.status === 400, `Invalid product ID returned 400 Bad Request`);

    // --- TEST 3: Non-existent Product ID ---
    console.log("\n--- Test 3: Non-existent Product ID ---");
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundRes = await fetch(`${baseUrl}/cart/${nonExistentId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(notFoundRes.status === 404, `Non-existent product returned 404 Not Found`);

    // --- TEST 4: Add New Item to Cart (Postman Test 1) ---
    console.log("\n--- Test 4: Add New Item to Cart (Postman Test 1) ---");
    const addRes1 = await fetch(`${baseUrl}/cart/${productId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const addData1 = await addRes1.json();
    assert(
      addRes1.status === 200 &&
      addData1.success === true &&
      addData1.cart.some((item) => (item.product._id || item.product).toString() === productId && item.quantity === 1),
      `New product added to cart with quantity = 1 (Status: ${addRes1.status})`
    );

    // --- TEST 5: Add Same Item Again (Postman Test 2) ---
    console.log("\n--- Test 5: Add Same Item Again (Postman Test 2) ---");
    const addRes2 = await fetch(`${baseUrl}/cart/${productId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const addData2 = await addRes2.json();
    const itemAfterAdd2 = addData2.cart.find(
      (item) => (item.product._id || item.product).toString() === productId
    );
    assert(
      addRes2.status === 200 && itemAfterAdd2 && itemAfterAdd2.quantity === 2,
      `Adding same product incremented quantity to 2`
    );

    // --- TEST 6: Get Cart with Populated Product (Postman Test 3) ---
    console.log("\n--- Test 6: Get Cart Populated (Postman Test 3) ---");
    const getCartRes = await fetch(`${baseUrl}/cart`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const getCartData = await getCartRes.json();
    const cartItem = getCartData.cart?.[0];
    assert(
      getCartRes.status === 200 &&
      getCartData.success === true &&
      getCartData.count === 2 &&
      cartItem?.product?.name !== undefined &&
      cartItem?.product?.price !== undefined,
      `Cart retrieved with populated product data (Item: "${cartItem?.product?.name}", Qty: ${cartItem?.quantity})`
    );

    // --- TEST 7: Update Product Quantity (Postman Test 4) ---
    console.log("\n--- Test 7: Update Product Quantity (Postman Test 4) ---");
    const updateRes = await fetch(`${baseUrl}/cart/${productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity: 3 }),
    });
    const updateData = await updateRes.json();
    const updatedItem = updateData.cart?.find(
      (item) => (item.product._id || item.product).toString() === productId
    );
    assert(
      updateRes.status === 200 && updatedItem?.quantity === 3,
      `Quantity updated to 3 via PATCH /cart/:productId`
    );

    // --- TEST 8: Exceed Stock Limit (Postman Test 5) ---
    console.log("\n--- Test 8: Exceed Stock Limit (Postman Test 5) ---");
    const exceedRes = await fetch(`${baseUrl}/cart/${productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity: product.stock + 10 }),
    });
    assert(
      exceedRes.status === 400,
      `Exceeding stock (${product.stock + 10} > ${product.stock}) returned 400 Bad Request`
    );

    // --- TEST 9: Quantity < 1 Validation ---
    console.log("\n--- Test 9: Quantity < 1 Validation ---");
    const zeroQtyRes = await fetch(`${baseUrl}/cart/${productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity: 0 }),
    });
    assert(
      zeroQtyRes.status === 400,
      `Quantity < 1 returned 400 Bad Request`
    );

    // --- TEST 10: Update Product Not in Cart ---
    console.log("\n--- Test 10: Update Product Not in Cart ---");
    const otherProduct = await Product.findOne({ _id: { $ne: productId } });
    if (otherProduct) {
      const notInCartRes = await fetch(`${baseUrl}/cart/${otherProduct._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: 2 }),
      });
      assert(
        notInCartRes.status === 404,
        `Updating product not in cart returned 404 Not Found`
      );
    }

    // --- TEST 11: Remove Product from Cart (Postman Test 6) ---
    console.log("\n--- Test 11: Remove Product from Cart (Postman Test 6) ---");
    const removeRes = await fetch(`${baseUrl}/cart/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const removeData = await removeRes.json();
    assert(
      removeRes.status === 200 &&
      removeData.success === true &&
      !removeData.cart.some((item) => (item.product._id || item.product).toString() === productId),
      `Product removed from cart, cart is now empty`
    );

    // --- TEST 12: Remove Product Not in Cart ---
    console.log("\n--- Test 12: Remove Product Not in Cart ---");
    const removeAgainRes = await fetch(`${baseUrl}/cart/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(
      removeAgainRes.status === 404,
      `Removing product not in cart returned 404 Not Found`
    );

    // --- TEST 13: Get Cart Count Endpoint ---
    console.log("\n--- Test 13: Get Cart Count ---");
    const countRes = await fetch(`${baseUrl}/cart/count`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const countData = await countRes.json();
    assert(
      countRes.status === 200 && countData.count === 0,
      `Cart count returned 0 for empty cart`
    );

    // Cleanup test customer
    await Customer.deleteOne({ email: testEmail });

    console.log("\n==================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

    if (server) server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution error:", err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTests();
