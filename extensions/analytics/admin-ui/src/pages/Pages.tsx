import { BreakdownCard } from "../components/BreakdownCard";
import { CARDS } from "../components/breakdownConfig";
import { PagePicker } from "../components/PagePicker";
import { PageShell } from "../components/PageShell";
import { useHashScroll } from "../hooks/useHashScroll";
import { useViewState } from "../hooks/useViewState";

/** Which pages people open, where visits start and end, and dead ends. */
export default function AnalyticsPages() {
  const vm = useViewState();
  useHashScroll();
  return (
    <PageShell active="pages" vm={vm}>
      <div className="an-stack">
        <PagePicker vm={vm} />
        <BreakdownCard def={CARDS.pages} vm={vm} limit={12} />
        <div className="an-grid-2">
          <div id="missing" className="an-anchor">
            <BreakdownCard def={CARDS.missing} vm={vm} limit={8} empty="No broken links in this period. Nice." />
          </div>
          <BreakdownCard def={CARDS.files} vm={vm} limit={8} empty="Nothing in this period." />
        </div>
      </div>
    </PageShell>
  );
}
