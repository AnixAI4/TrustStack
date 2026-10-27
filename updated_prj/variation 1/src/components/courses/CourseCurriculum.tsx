"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Check,
  X,
  ChevronDown,
  Lightbulb,
  BookOpen,
  ScrollText,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { CourseModule } from "@/content/courses";
import type { CourseLesson } from "@/content/course-lessons";

/**
 * The curriculum as an expandable reader. Each module shows its title, sections
 * and the points it covers; expanding it reveals the actual lesson - a framing,
 * explained topics and a takeaway - so the course teaches, not just outlines.
 * The first module opens by default so there's content on screen immediately.
 */
export function CourseCurriculum({
  modules,
  lessons,
}: {
  modules: CourseModule[];
  lessons?: Record<number, CourseLesson>;
}) {
  const [open, setOpen] = useState<number | null>(modules[0]?.n ?? null);

  return (
    <div className="space-y-4">
      {modules.map((m) => {
        const lesson = lessons?.[m.n];
        const isOpen = open === m.n && !!lesson;
        const hasLesson = !!lesson;

        return (
          <div
            key={m.n}
            className={cn(
              "overflow-hidden rounded-2xl border bg-surface-2/30 transition-colors",
              isOpen ? "border-accent/40" : "border-line"
            )}
          >
            {/* header / toggle */}
            <button
              type="button"
              disabled={!hasLesson}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : m.n)}
              className={cn(
                "flex w-full items-start gap-4 p-6 text-left",
                hasLesson && "cursor-pointer"
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-glass font-display text-lg font-semibold text-accent">
                {m.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-mono text-label text-text-faint">
                  <Clock className="h-3 w-3" />
                  <span>{m.minutes} min</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-semibold text-text">{m.title}</h3>
                <div className="mt-0.5 font-mono text-label uppercase tracking-wider text-accent/80">
                  {m.refs}
                </div>
              </div>
              {hasLesson && (
                <span
                  className={cn(
                    "mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-line px-2.5 py-1 font-mono text-label uppercase tracking-wider transition-colors",
                    isOpen ? "bg-accent/10 text-accent" : "text-text-faint"
                  )}
                >
                  {isOpen ? "Close" : "Read"}
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                  />
                </span>
              )}
            </button>

            {/* points the module covers */}
            <ul className="grid gap-2 px-6 pb-5 sm:grid-cols-2">
              {m.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            {/* the actual lesson */}
            {isOpen && lesson && (
              <div className="border-t border-line bg-bg-2/40 px-6 py-6">
                <div className="flex items-center gap-2 font-mono text-label uppercase tracking-wider text-accent/80">
                  <BookOpen className="h-3.5 w-3.5" /> The lesson
                </div>
                <p className="mt-3 leading-relaxed text-text">{lesson.intro}</p>

                <div className="mt-6 space-y-6">
                  {lesson.topics.map((t) => (
                    <div key={t.heading} className="border-l-2 border-line pl-4">
                      <h4 className="font-display text-base font-semibold text-text">
                        {t.heading}
                      </h4>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-text-muted">{t.body}</p>
                      {t.example && (t.example.good || t.example.bad) && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {t.example.good && (
                            <div className="rounded-lg border border-green/40 bg-green/[0.07] p-3">
                              <div className="flex items-center gap-1.5 font-mono text-label uppercase tracking-wider text-green-soft">
                                <Check className="h-3 w-3" /> Lawful
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                                {t.example.good}
                              </p>
                            </div>
                          )}
                          {t.example.bad && (
                            <div className="rounded-lg border border-red/40 bg-red/[0.07] p-3">
                              <div className="flex items-center gap-1.5 font-mono text-label uppercase tracking-wider text-red-soft">
                                <X className="h-3 w-3" /> Not okay
                              </div>
                              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                                {t.example.bad}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {lesson.keyFacts && lesson.keyFacts.length > 0 && (
                  <div className="mt-6 rounded-xl border border-line bg-glass p-4">
                    <div className="flex items-center gap-2 font-mono text-label uppercase tracking-wider text-text-faint">
                      <ScrollText className="h-3.5 w-3.5 text-accent" /> Key facts
                    </div>
                    <ul className="mt-2.5 grid gap-1.5">
                      {lesson.keyFacts.map((f) => (
                        <li
                          key={f}
                          className="flex gap-2 text-sm leading-relaxed text-text-muted"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lesson.mistakes && lesson.mistakes.length > 0 && (
                  <div className="mt-4 rounded-xl border border-red/30 bg-red/[0.05] p-4">
                    <div className="flex items-center gap-2 font-mono text-label uppercase tracking-wider text-red-soft">
                      <AlertTriangle className="h-3.5 w-3.5" /> Common traps
                    </div>
                    <ul className="mt-2.5 grid gap-1.5">
                      {lesson.mistakes.map((m) => (
                        <li
                          key={m}
                          className="flex gap-2 text-sm leading-relaxed text-text-muted"
                        >
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-soft" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lesson.takeaway && (
                  <div className="mt-6 flex gap-3 rounded-xl border border-accent/25 bg-accent/[0.06] p-4">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="text-sm leading-relaxed text-text">
                      <span className="font-semibold">Takeaway - </span>
                      {lesson.takeaway}
                    </p>
                  </div>
                )}

                {lesson.sections && lesson.sections.length > 0 && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-label uppercase tracking-wider text-text-faint">
                      Read it in the Act
                    </span>
                    {lesson.sections.map((s) => (
                      <Link
                        key={s}
                        href={`/section/${s}`}
                        className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-glass px-3 py-1 text-label font-medium text-accent transition-colors hover:border-accent/40"
                      >
                        Section {s} <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
