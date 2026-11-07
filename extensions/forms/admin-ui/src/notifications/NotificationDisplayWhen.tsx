import React, { useState } from "react";
import { ChevronDown } from "@squilla/icons";
import ConditionBuilder, { ConditionGroup } from "../tabs/builder/ConditionBuilder";


interface NotificationDisplayWhenProps {
  routeWhen: ConditionGroup;
  onChange: (next: ConditionGroup) => void;
  /** All fields available in the form for the condition field dropdown. */
  formFields: any[];
}

/** Collapsible "Send only when…" condition builder section for NotificationCard. */
export default function NotificationDisplayWhen({
  routeWhen,
  onChange,
  formFields,
}: NotificationDisplayWhenProps): React.ReactElement {
  const hasConditions = !!(routeWhen.all?.length || routeWhen.any?.length);
  const [expanded, setExpanded] = useState(hasConditions);

  return (
    <div className="fm-sec" style={{ paddingTop: 18, borderTop: "1px solid var(--divider)", gap: 12 }}>
      <button type="button" className="fm-disclosure" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        <ChevronDown aria-hidden="true" />
        <span>Send only when…</span>
        {hasConditions && (
          <span className="fm-tag" data-tone="warn">
            Active
          </span>
        )}
      </button>
      {expanded && (
        <div className="fm-indent space-y-2">
          <p className="fm-hint">Sent only when every condition matches. Leave empty to always send.</p>
          <ConditionBuilder group={routeWhen} onChange={onChange} fields={formFields} />
          {hasConditions && (
            <button type="button" className="text-[12.5px] text-muted-foreground hover:text-foreground" onClick={() => onChange({})}>
              Clear all conditions
            </button>
          )}
        </div>
      )}
    </div>
  );
}
