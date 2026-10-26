"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// A static export has no server redirect; send the browser to the Fleet page.
export default function Home() {
  const router = useRouter();
  useEffect(() => router.replace("/fleet/"), [router]);
  return <main className="sc-main"><a className="sc-link" href="/fleet/">Open the fleet</a></main>;
}
