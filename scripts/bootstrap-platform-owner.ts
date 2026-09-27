import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function main() {
  const email = required("RUTERO_OWNER_EMAIL").toLowerCase();
  const name = required("RUTERO_OWNER_NAME");
  const password = required("RUTERO_OWNER_PASSWORD");
  const confirmation = required("RUTERO_CONFIRM_BOOTSTRAP");

  if (confirmation !== "CREATE_FIRST_PLATFORM_OWNER") {
    throw new Error("Set RUTERO_CONFIRM_BOOTSTRAP=CREATE_FIRST_PLATFORM_OWNER to continue.");
  }
  if (password.length < 10 || password.length > 72) {
    throw new Error("RUTERO_OWNER_PASSWORD must be between 10 and 72 characters.");
  }

  const existingSuperAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", active: true }, select: { email: true } });
  if (existingSuperAdmin) {
    throw new Error(`A SUPER_ADMIN already exists: ${existingSuperAdmin.email}`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error(`A user with ${email} already exists. Use promote-platform-owner instead.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: "RUTERO Plataforma",
        accountType: "CUSTOMER",
        countryCode: "VE",
        currencyCode: "USD",
        defaultInterestRate: 0.2,
        defaultTermDays: 20,
        paymentFrequency: "DAILY"
      }
    });

    await tx.user.create({
      data: {
        companyId: company.id,
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        active: true
      }
    });
  });

  console.info(`First platform owner created: ${email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Failed to bootstrap platform owner.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
