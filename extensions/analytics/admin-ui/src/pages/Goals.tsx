import { api } from "../api/client";
import { FilterBar } from "../components/FilterBar";
import { PageShell } from "../components/PageShell";
import { useAsync } from "../hooks/useAsync";
import { useViewState } from "../hooks/useViewState";
import { GoalsPanel } from "./goals/GoalsPanel";
import { LinksPanel } from "./goals/LinksPanel";

export default function AnalyticsGoals() {
  const vm = useViewState();
  const q = new URLSearchParams(vm.query);
  q.delete("compare");
  const goals = useAsync((s) => api.goals(s), "goals");
  const links = useAsync((s) => api.links(s), "links");
  const stats = useAsync((s) => api.goalStats(q, s).catch(() => null), `stats|${q.toString()}`);

  const refresh = () => {
    goals.reload(true);
    links.reload(true);
    stats.reload(true);
  };

  return (
    <PageShell active="goals" title="Goals & links">
      <FilterBar vm={vm} showCompare={false} />
      <div className="space-y-4">
        <GoalsPanel goals={goals.data} goalsError={goals.error} stats={stats.data} links={links.data ?? []} onChanged={refresh} />
        <LinksPanel links={links.data} error={links.error} onChanged={refresh} />
      </div>
    </PageShell>
  );
}
