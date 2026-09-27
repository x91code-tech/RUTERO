import { prisma } from "../src/lib/db";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const confirmation = process.env.RUTERO_CONFIRM_PLATFORM_OWNER_EMAIL?.trim().toLowerCase();
  if (!email || confirmation !== email) {
    throw new Error("Pass the account email and set RUTERO_CONFIRM_PLATFORM_OWNER_EMAIL to the same value.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || user.role !== "ADMIN") {
    throw new Error("The target must be an existing, active company administrator.");
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } });
  console.info(`Platform-owner access enabled for ${user.email}. Sign out and sign back in.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Failed to promote platform owner.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
