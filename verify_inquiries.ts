import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function run() {
  console.log('Testing Inquiry flow...');

  // Get a user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    return;
  }

  // Get a business
  const business = await prisma.businessProfile.findFirst();
  if (!business) {
    console.log('No business found');
    return;
  }

  console.log(`Creating inquiry from User(${user.firstName || user.id}) to Business(${business.businessName})`);

  // 1. Create Inquiry
  const inquiry = await prisma.inquiry.create({
    data: {
      userId: user.id,
      businessProfileId: business.id,
      subject: 'Inquiry from test script',
      messages: {
        create: {
          senderId: user.id,
          content: 'Hello, do you offer wholesale pricing?',
        }
      }
    },
    include: { messages: true }
  });

  console.log('Created Inquiry:', inquiry.id, 'Status:', inquiry.status);
  console.log('Initial Message:', inquiry.messages[0].content);

  // 2. Business Replies
  const reply = await prisma.inquiryMessage.create({
    data: {
      inquiryId: inquiry.id,
      senderId: business.ownerId,
      content: 'Yes we do! Please check our website.',
    }
  });

  // Update status
  const updatedInquiry = await prisma.inquiry.update({
    where: { id: inquiry.id },
    data: { status: 'RESPONDED' },
    include: { messages: true }
  });

  console.log('Updated Status:', updatedInquiry.status);
  console.log('Total Messages:', updatedInquiry.messages.length);

  await prisma.$disconnect();
}

run().catch(console.error);
