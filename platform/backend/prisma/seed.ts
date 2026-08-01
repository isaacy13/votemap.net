import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { providerId: 'dev:demo@votemap.local' },
    update: {
      isIdentityVerified: true,
      verificationProvider: 'mock',
      zkPassportNullifier: 'seed-nullifier-demo',
      lastVerifiedAt: new Date(),
      ageBand: '18+',
      region: 'US-TX',
      displayName: 'Demo Voter',
      tier: 'silver',
    },
    create: {
      provider: 'dev',
      providerId: 'dev:demo@votemap.local',
      email: 'demo@votemap.local',
      displayName: 'Demo Voter',
      isIdentityVerified: true,
      verificationProvider: 'mock',
      zkPassportNullifier: 'seed-nullifier-demo',
      lastVerifiedAt: new Date(),
      ageBand: '18+',
      region: 'US-TX',
      tier: 'silver',
    },
  });

  const entity = await prisma.entity.upsert({
    where: { slug: 'open-roads-initiative' },
    update: {},
    create: {
      name: 'Open Roads Initiative',
      slug: 'open-roads-initiative',
      type: 'nonprofit',
      walletAddress: 'DemoWallet111111111111111111111111111',
      bio: 'Builds safer streets. Fund outcomes, not promises.',
      ownerUserId: user.id,
      links: {
        create: [
          { label: 'Website', url: 'https://votemap.net', sortOrder: 0 },
          { label: 'X', url: 'https://x.com/vote_map', sortOrder: 1 },
        ],
      },
    },
  });

  const existingOutcome = await prisma.outcome.findFirst({
    where: { title: 'Plant 1,000 street trees in District 5' },
  });

  if (!existingOutcome) {
    await prisma.outcome.create({
      data: {
        entityId: entity.id,
        title: 'Plant 1,000 street trees in District 5',
        description:
          'Measurable urban canopy expansion. Funds release when planting is verified with GPS-tagged photos and city confirmation.',
        successCriteria: '1,000 trees planted and confirmed alive after 30 days; public map published.',
        status: 'open',
      },
    });
  }

  console.log('Seeded demo user, entity, and outcome');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
