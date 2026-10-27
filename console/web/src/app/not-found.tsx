import { EmptyState } from "@/components/feedback/empty-state";

export default function NotFound() {
  return (
    <main className="sc-main">
      <EmptyState status="404" title="No such page" action={<a className="sc-key" href="/fleet/">Go to the fleet</a>}>
        The console has Fleet, Stations, Team, Audit log and Account.
      </EmptyState>
    </main>
  );
}
