import { Redis } from "ioredis";

async function runMvpTest() {
  const apiUrl = "http://localhost:3000";
  const runId = Date.now();
  const email = `mvp_${runId}@pulse.test`;
  const password = "Password123!";

  console.log("\n=============================================");
  console.log("🚀 PULSE MVP END-TO-END VERIFICATION SCRIPT");
  console.log("=============================================\n");

  try {
    // 1. Create Account
    console.log("Step 1: Creating Account...");
    const regRes = await fetch(`${apiUrl}/api/accounts/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "MVP Tester" }),
    });
    if (!regRes.ok) throw new Error(`Registration failed: ${await regRes.text()}`);

    const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
    const { token } = (await loginRes.json()) as any;
    console.log("✅ Account created and authenticated.\n");

    // 2. Create Business Draft
    console.log("Step 2: Creating Business Profile Draft...");
    const draftRes = await fetch(`${apiUrl}/api/businesses/drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Pulse Electronics ${runId}`,
        description: "Best electronics in town.",
        businessType: "PHYSICAL",
        phoneNumber: "+2348000000000",
        whatsapp: "+2348000000000",
        email,
        location: "Lagos, Nigeria",
      }),
    });
    if (!draftRes.ok) throw new Error(`Draft creation failed: ${await draftRes.text()}`);
    const { id: draftId } = (await draftRes.json()) as any;
    console.log(`✅ Business Draft created. ID: ${draftId}\n`);

    // Request Verification
    console.log("Step 3: Verifying Business Profile...");
    await fetch(`${apiUrl}/api/businesses/drafts/${draftId}/request-verification`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Fetch OTP from Redis
    const redis = new Redis();
    const otp = await redis.get(`business_verification:${draftId}`);
    if (!otp) throw new Error("OTP not found in Redis!");

    const verifyRes = await fetch(`${apiUrl}/api/businesses/drafts/${draftId}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ otp }),
    });
    if (!verifyRes.ok) throw new Error(`Verification failed: ${await verifyRes.text()}`);
    const { id: businessId, slug: businessSlug } = (await verifyRes.json()) as any;
    console.log(`✅ Business verified & published! Slug: ${businessSlug}\n`);

    // 3. List an item
    console.log("Step 4: Listing an Item...");
    const catRes = await fetch(`${apiUrl}/api/categories`);
    const { children } = ((await catRes.json()) as any)[0];
    const categoryId = children[0].id; // "Restaurants" or similar leaf category

    const listRes = await fetch(`${apiUrl}/api/businesses/${businessId}/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: `PlayStation 5 - ${runId}`,
        description: "Brand new console",
        categoryId,
        price: { minPrice: 800000, isNegotiable: false, currencyCode: "NGN" },
      }),
    });
    if (!listRes.ok) throw new Error(`Listing failed: ${await listRes.text()}`);
    const { id: listingId } = (await listRes.json()) as any;
    console.log(`✅ Item listed successfully. Listing ID: ${listingId}\n`);

    // Publish the listing
    console.log("Step 4b: Publishing the Item...");
    const pubRes = await fetch(`${apiUrl}/api/listings/${listingId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    if (!pubRes.ok) throw new Error(`Publish failed: ${await pubRes.text()}`);

    // 4. Discover
    console.log("Step 5: Discovering Listings & Businesses...");
    const getBizRes = await fetch(`${apiUrl}/api/businesses/${businessSlug}`);
    if (!getBizRes.ok) throw new Error("Business discovery failed");
    console.log(`✅ Business discovered publicly.`);

    const getListingsRes = await fetch(`${apiUrl}/api/listings?search=PlayStation`);
    if (!getListingsRes.ok) throw new Error("Listing discovery failed");
    const { items } = (await getListingsRes.json()) as any;
    if (!items.find((i: any) => i.id === listingId))
      throw new Error("Listing not found in search results");
    console.log(`✅ Listing discovered publicly via search.\n`);

    console.log("🎉 MVP FLOW VERIFIED SUCCESSFULLY! 🎉\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  }
}

runMvpTest();
