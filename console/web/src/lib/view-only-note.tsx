"use client";

import { createContext, useContext, useEffect } from "react";

/** A page's "View only: …" note for people whose role cannot change what it shows. The page sets
 * it; the shell shows it in the top bar instead of a banner on the page. */
export const ViewOnlyNoteContext = createContext<(note: string | null) => void>(() => undefined);

/** Show `note` in the top bar while this page is open; null shows nothing. */
export function useViewOnlyNote(note: string | null): void {
  const setNote = useContext(ViewOnlyNoteContext);
  useEffect(() => {
    setNote(note);
    return () => setNote(null);
  }, [note, setNote]);
}
