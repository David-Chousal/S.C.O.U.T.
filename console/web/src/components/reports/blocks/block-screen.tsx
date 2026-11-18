import type { BlockView } from "@/lib/report/views";
import { TableBlock } from "./table-block";

/** Draws one block's view model on screen. */
export function BlockScreen({ view }: { view: BlockView }) {
  switch (view.kind) {
    case "summaryTable":
    case "readingsTable":
      return <TableBlock view={view} />;
  }
}
