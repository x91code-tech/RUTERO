"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const collectorIdKey = "rutero_collector_id";

export function CollectorLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const collectorId = window.localStorage.getItem(collectorIdKey);
    if (!collectorId) return;

    const nextPath = searchParams.get("next") ?? "/seller";
    const params = new URLSearchParams();
    params.set("next", nextPath);
    router.replace(`/mobile-login?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}
