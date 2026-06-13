import { Test } from '@nestjs/testing';
import { AppModule } from './src/app.module.js';
import { CreateListingUseCase } from './src/features/listing/application/use-cases/create-listing.use-case.js';
import { PrismaService } from './src/prisma/prisma.service.js';

async function run() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const createListing = app.get(CreateListingUseCase);
  const prisma = app.get(PrismaService);

  const biz = await prisma.businessProfile.findFirst();
  const cat = await prisma.category.findFirst({ where: { parentId: { not: null } } });

  try {
    const res = await createListing.execute({
      businessProfileId: biz.id,
      title: 'Debug Item',
      categoryId: cat.id,
      price: { minPrice: 1000, isNegotiable: false, currencyCode: 'NGN' },
    });
    console.log(res);
  } catch (err) {
    console.error(err);
  }

  await app.close();
}
run();
