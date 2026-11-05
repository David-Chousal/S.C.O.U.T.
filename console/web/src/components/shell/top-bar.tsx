"use client";

import Link from "next/link";
import type { User } from "@/lib/api/types";
import { AccountMenu } from "./account-menu";

/** The bar across the top of every page: the S.C.O.U.T. mark and the signed-in account over the
 * menu, and on the right the assistant, Fred, which is not built yet. Page titles live on the
 * pages themselves. */
export function TopBar({ user }: { user?: User }) {
  return (
    <header className="sc-top">
      <div className="sc-top__brand">
        <Link href="/dashboard/" className="sc-logo" aria-label="S.C.O.U.T. Console, go to the Dashboard" title="S.C.O.U.T. Console">
          <span className="sc-logo__mark" aria-hidden="true" />
        </Link>
        {user && <AccountMenu user={user} />}
      </div>
      <div className="sc-top__end">
        <button type="button" className="sc-ask" disabled title="Fred, the console's assistant, is coming soon">
          Ask Fred <span className="sc-tag">Soon</span>
        </button>
      </div>
    </header>
  );
}
