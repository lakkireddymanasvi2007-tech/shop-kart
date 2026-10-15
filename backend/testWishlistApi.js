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
  console.log("SHOPKART LAB 04 — WISHLIST API AUTOMATED TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` PASS: ${message}`);
      passed++;
    } else {
      console.error(` FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Connect DB and start server on random test port
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shopkart");
    const PORT = 5055;
    server = app.listen(PORT);
    baseUrl = `http://localhost:${PORT}`;

    // 2. Prepare test customer & test product
    const testEmail = `wishlist_tester_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Wishlist Tester",
        email: testEmail,
        password: "password123",
        phone: "9876543210",
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, `Customer registered (Status: ${regRes.status})`);

    // 3. Login to get token
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
    const cookie = loginRes.headers.get("set-cookie");
    assert(token && loginRes.status === 200, `Customer logged in & token received`);

    // Get an existing product or create one
    let product = await Product.findOne({});
    if (!product) {
      product = await Product.create({
        name: "Test Keyboard",
        description: "Test description",
        price: 1999,
        category: "Electronics",
        image: "https://example.com/test.jpg",
        stock: 5,
      });
    }
    const productId = product._id.toString();

    console.log(`\nTesting with Product ID: ${productId} (${product.name})\n`);

    // --- TEST 5: Unauthenticated access ---
    console.log("--- Test 5: Unauthenticated Request ---");
    const unauthRes = await fetch(`${baseUrl}/wishlist/${productId}`, {
      method: "POST",
    });
    assert(unauthRes.status === 401, `Unauthenticated request returned 401 Unauthorized`);

    // --- TEST 6: Invalid Product ID ---
    console.log("\n--- Test 6: Invalid Product ID Validation ---");
    const invalidIdRes = await fetch(`${baseUrl}/wishlist/invalid123`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(invalidIdRes.status === 400, `Invalid product ID returned 400 Bad Request`);

    // --- TEST 7: Non-existent Product ---
    console.log("\n--- Test 7: Non-existent Product ID ---");
    const fakeId = new mongoose.Types.ObjectId().toString();
    const nonExistRes = await fetch(`${baseUrl}/wishlist/${fakeId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(nonExistRes.status === 404, `Non-existent product returned 404 Not Found`);

    // --- TEST 1: Add Product to Wishlist ---
    console.log("\n--- Test 1: Add Product to Wishlist (Bearer Token & Cookie) ---");
    const addRes = await fetch(`${baseUrl}/wishlist/${productId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const addData = await addRes.json();
    assert(
      (addRes.status === 201 || addRes.status === 200) && addData.success === true,
      `Add to wishlist successful (Status ${addRes.status}): ${addData.message}`
    );

    // --- TEST 2: Prevent Duplicates ---
    console.log("\n--- Test 2: Prevent Duplicates ---");
    const dupRes = await fetch(`${baseUrl}/wishlist/${productId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 && dupData.success === false,
      `Duplicate wishlist attempt returned 409 Conflict: "${dupData.message}"`
    );

    // --- TEST 3: Get Current User's Wishlist + populate ---
    console.log("\n--- Test 3: Get Wishlist (Populated) ---");
    const getRes = await fetch(`${baseUrl}/wishlist`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const getData = await getRes.json();
    assert(
      getRes.status === 200 &&
        getData.success === true &&
        getData.count >= 1 &&
        getData.wishlist[0].name === product.name &&
        typeof getData.wishlist[0].price === "number",
      `Get wishlist populated correctly (Count: ${getData.count}, Item: ${getData.wishlist[0]?.name})`
    );

    // --- TEST 8: Wishlist Count ---
    console.log("\n--- Test 8: Get Wishlist Count ---");
    const countRes = await fetch(`${baseUrl}/wishlist/count`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const countData = await countRes.json();
    assert(
      countRes.status === 200 && countData.count >= 1,
      `Wishlist count returned ${countData.count}`
    );

    // --- TEST 4: Remove Product from Wishlist ---
    console.log("\n--- Test 4: Remove Product from Wishlist ---");
    const removeRes = await fetch(`${baseUrl}/wishlist/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const removeData = await removeRes.json();
    assert(
      removeRes.status === 200 && removeData.success === true,
      `Product removed successfully (Status 200): ${removeData.message}`
    );

    // --- TEST 9: Remove non-wishlisted product -> 404 ---
    console.log("\n--- Test 9: Remove Product not in Wishlist ---");
    const removeAgainRes = await fetch(`${baseUrl}/wishlist/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(
      removeAgainRes.status === 404,
      `Removing product not in wishlist returned 404 Not Found`
    );

    // --- TEST 10: Toggle Wishlist Endpoint ---
    console.log("\n--- Test 10: Wishlist Toggle Endpoint ---");
    const toggleAddRes = await fetch(`${baseUrl}/wishlist/${productId}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const toggleAddData = await toggleAddRes.json();
    assert(
      toggleAddRes.status === 200 && toggleAddData.saved === true,
      `Toggle added product (saved = true)`
    );

    const toggleRemoveRes = await fetch(`${baseUrl}/wishlist/${productId}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const toggleRemoveData = await toggleRemoveRes.json();
    assert(
      toggleRemoveRes.status === 200 && toggleRemoveData.saved === false,
      `Toggle removed product (saved = false)`
    );

    // Cleanup test customer
    await Customer.deleteOne({ email: testEmail });

    console.log("\n==================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
}

runTests();
