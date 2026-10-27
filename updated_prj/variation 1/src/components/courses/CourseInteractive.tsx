"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Scale, GitBranch, Link2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CourseActivities } from "@/content/course-activities";
import { ScenarioSorter } from "./ScenarioSorter";
import { DecisionPath } from "./DecisionPath";
import { TermMatch } from "./TermMatch";

type TabId = "sorter" | "decision" | "match";

/**
 * The per-course "learn by doing" arena. Renders only the activities a course
 * actually defines, as switchable tabs, so each persona gets a tailored set of
 * interactive drills in one cohesive surface.
 */
export function CourseInteractive({ activities }: { activities: CourseActivities }) {
  const tabs: { id: TabId; label: string; icon: LucideIcon; blurb: string }[] = [];
  if (activities.sorter)
    tabs.push({ id: "sorter", label: activities.sorter.title, icon: Scale, blurb: activities.sorter.lede });
  if (activities.decision)
    tabs.push({ id: "decision", label: activities.decision.title, icon: GitBranch, blurb: activities.decision.lede });
  if (activities.match)
    tabs.push({ id: "match", label: activities.match.title, icon: Link2, blurb: activities.match.lede });

  const [active, setActive] = useState<TabId | undefined>(tabs[0]?.id);

  if (tabs.length === 0) return null;

  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-2/30">
      {/* tab bar */}
      <div
        role="tablist"
        aria-label="Interactive practice"
        className="flex flex-wrap gap-1 border-b border-line bg-glass p-2"
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const selected = t.id === activeTab.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                selected
                  ? "bg-accent/12 text-text"
                  : "text-text-faint hover:bg-glass hover:text-text"
              )}
            >
              <Icon className={cn("h-4 w-4", selected ? "text-accent" : "text-text-faint")} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* panel */}
      <div className="p-6 sm:p-8">
        <p className="mb-6 text-sm leading-relaxed text-text-muted">{activeTab.blurb}</p>
        {activeTab.id === "sorter" && activities.sorter && (
          <ScenarioSorter deck={activities.sorter} />
        )}
        {activeTab.id === "decision" && activities.decision && (
          <DecisionPath tree={activities.decision} />
        )}
        {activeTab.id === "match" && activities.match && <TermMatch set={activities.match} />}
      </div>
    </div>
  );
}
