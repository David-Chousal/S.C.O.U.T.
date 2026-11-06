"use client";

import { useEffect, useState } from "react";
import { Ago } from "@/components/ui/ago";
import { api } from "@/lib/api/client";
import type { FredBrief } from "@/lib/api/types";
import { FredMarkdown } from "./fred-markdown";

const SOURCE: Record<FredBrief["provider"], string> = {
  gemini: "Fred",
  facts: "Fred · facts only",
};

/** Fred's morning brief, at the top of the Dashboard. Shows nothing until the first brief exists,
 * or if it cannot be loaded: the Dashboard works without it. */
export function MorningBrief() {
  const [brief, setBrief] = useState<FredBrief | null>(null);

  useEffect(() => {
    let live = true;
    api.fredBrief().then((reply) => { if (live) setBrief(reply.brief); }, () => undefined);
    return () => { live = false; };
  }, []);

  if (!brief) return null;
  return (
    <section className="sc-brief" aria-labelledby="sc-brief-title">
      <div className="sc-brief__head">
        <h2 className="sc-brief__title" id="sc-brief-title">Morning brief</h2>
        <span className="sc-brief__meta">{SOURCE[brief.provider]} · <Ago ms={brief.created_at} /></span>
      </div>
      <div className="sc-fred__a"><FredMarkdown text={brief.text} /></div>
    </section>
  );
}
