import { redirect } from "next/navigation";
import { RuteroLogo } from "@/components/brand/rutero-logo";
import { DeviceRegistered } from "@/components/auth/device-registered";
import { getSessionUser } from "@/lib/session";

export default async function DeviceSetupPage({ searchParams }: { searchParams: Promise<{ pin?: string }> }) {
  const { pin } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "SELLER") redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-carbon-950 px-5 py-8">
      <div className="w-full">
        <RuteroLogo href="/" size="sm" className="mx-auto mb-6 w-fit" />
        <DeviceRegistered identifier={user.mobileIdentifier ?? undefined} pin={pin} />
      </div>
    </main>
  );
}
