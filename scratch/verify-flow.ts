import { Redis } from 'ioredis';

async function main() {
  const base_url = 'http://localhost:3000/api';
  const email = `test-owner-${Date.now()}@pulse.app`;
  const password = 'TestPassword123!';
  const name = 'Test User';

  console.log(`1. Registering account with email: ${email}`);
  const registerRes = await fetch(`${base_url}/accounts/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!registerRes.ok) {
    const errorText = await registerRes.text();
    throw new Error(`Registration failed: ${registerRes.status} - ${errorText}`);
  }

  const registerData = await registerRes.json();
  console.log('Registration success:', registerData);

  console.log('2. Logging in...');
  const loginRes = await fetch(`${base_url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    const errorText = await loginRes.text();
    throw new Error(`Login failed: ${loginRes.status} - ${errorText}`);
  }

  const loginData = (await loginRes.json()) as { token: string };
  console.log('Login success! Got token.');
  const token = loginData.token;

  console.log('3. Creating business draft...');
  const draftRes = await fetch(`${base_url}/businesses/drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Super Shop',
      description: 'The best storefront on the platform',
      phoneNumber: '+1234567890',
      whatsapp: '+1234567890',
      email: email,
      businessType: 'ONLINE',
      websiteUrl: 'https://supershop.com',
      location: 'New York City',
    }),
  });

  if (!draftRes.ok) {
    const errorText = await draftRes.text();
    throw new Error(`Draft creation failed: ${draftRes.status} - ${errorText}`);
  }

  const draftData = (await draftRes.json()) as { id: string };
  console.log('Draft created successfully, ID:', draftData.id);
  const draftId = draftData.id;

  console.log('4. Requesting verification...');
  const reqVerRes = await fetch(`${base_url}/businesses/drafts/${draftId}/request-verification`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!reqVerRes.ok) {
    const errorText = await reqVerRes.text();
    throw new Error(`Requesting verification failed: ${reqVerRes.status} - ${errorText}`);
  }

  console.log('Verification request queued successfully.');

  console.log('5. Retrieving OTP from Redis...');
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  });

  const redisKey = `business_verification:${draftId}`;
  const otp = await redis.get(redisKey);
  await redis.quit();

  if (!otp) {
    throw new Error(`Could not retrieve OTP from Redis for key: ${redisKey}`);
  }
  console.log(`Retrieved OTP from Redis: ${otp}`);

  console.log('6. Submitting verification OTP...');
  const verifyRes = await fetch(`${base_url}/businesses/drafts/${draftId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp }),
  });

  if (!verifyRes.ok) {
    const errorText = await verifyRes.text();
    throw new Error(`Verification submission failed: ${verifyRes.status} - ${errorText}`);
  }

  const publishedProfile = await verifyRes.json();
  console.log('Verification successful! Business published:', publishedProfile);
  console.log('Flow verified successfully! All steps succeeded.');
}

main().catch((err) => {
  console.error('FLOW VERIFICATION FAILED:', err);
  process.exit(1);
});
