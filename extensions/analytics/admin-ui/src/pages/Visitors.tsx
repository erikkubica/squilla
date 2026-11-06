import { BreakdownCard } from "../components/BreakdownCard";
import { CARDS } from "../components/breakdownConfig";
import { HeatmapCard } from "../components/HeatmapCard";
import { PageShell } from "../components/PageShell";
import { useViewState } from "../hooks/useViewState";

const ROWS = 10;

/** Who visits: how they found the site, where they are, what they use. */
export default function AnalyticsVisitors() {
  const vm = useViewState();
  return (
    <PageShell active="visitors" vm={vm}>
      <div className="an-stack">
        <div className="an-grid-2">
          <BreakdownCard def={CARDS.sources} vm={vm} limit={ROWS} />
          <BreakdownCard def={CARDS.locations} vm={vm} limit={ROWS} />
        </div>
        <HeatmapCard vm={vm} />
        <div className="an-grid-2">
          <BreakdownCard def={CARDS.devices} vm={vm} limit={ROWS} />
          <BreakdownCard
            def={CARDS.campaigns}
            vm={vm}
            limit={ROWS}
            empty="No tagged links in this period. Add ?utm_campaign=summer-sale to a link you share in a newsletter or ad, and its visits show up here."
          />
        </div>
      </div>
    </PageShell>
  );
}
