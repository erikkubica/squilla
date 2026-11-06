import { api } from "../api/client";
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

  const clearNew = () => {
    const next = new URLSearchParams(vm.searchParams);
    next.delete("new");
    vm.setSearchParams(next, { replace: true });
  };

  return (
    <PageShell active="goals" vm={vm}>
      <div className="an-stack">
        <GoalsPanel
          goals={goals.data}
          goalsError={goals.error}
          stats={stats.data}
          links={links.data ?? []}
          autoOpen={vm.searchParams.get("new") === "1" && !!goals.data}
          onAutoOpened={clearNew}
          onChanged={refresh}
        />
        <LinksPanel links={links.data} error={links.error} onChanged={refresh} />
      </div>
    </PageShell>
  );
}
