import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Layers, Target, Users } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CtaBand } from "@/components/sections/CtaBand";
import { CourseInteractive } from "@/components/courses/CourseInteractive";
import { CourseCurriculum } from "@/components/courses/CourseCurriculum";
import { CourseScenery } from "@/components/courses/CourseScenery";
import { COURSES, getCourse } from "@/content/courses";
import { getCourseActivities } from "@/content/course-activities";
import { getCourseLessons } from "@/content/course-lessons";

export function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return { title: "Course not found | TrustStack" };
  return {
    title: `${course.title} | DPDP course ${course.persona.toLowerCase()} | TrustStack`,
    description: course.blurb,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const totalMinutes = course.modules.reduce((sum, m) => sum + m.minutes, 0);
  const activities = getCourseActivities(course.slug);
  const lessons = getCourseLessons(course.slug);

  return (
    <>
      <PageHero
        kicker={course.persona}
        title={<>{course.title}</>}
        subhead={course.blurb}
        stats={[
          { value: `${course.modules.length}`, label: "Modules" },
          { value: course.hours, label: "Time" },
          { value: course.level.split(" ")[0], label: "Level" },
          course.certificate
            ? { value: "Included", label: "Certificate" }
            : { value: "Self-paced", label: "Format" },
        ]}
      />

      {/* who it's for + actions */}
      <section className="section pb-0">
        <div className="container-x">
          <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-surface-2/30 p-5">
            <span className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-wider text-text-faint">
              <Users className="h-4 w-4" /> Who it&apos;s for
            </span>
            {course.forWho.map((w) => (
              <span key={w} className="chip">
                {w}
              </span>
            ))}
            <span className="chip">{course.level}</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {course.actions.map((a) => (
              <Link
                key={a.href + a.label}
                href={a.href}
                className={a.primary ? "btn btn-accent" : "btn btn-ghost"}
              >
                {a.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* outcomes */}
      <section className="section relative overflow-hidden">
        <CourseScenery slug={course.slug} />
        <div className="container-x relative z-10">
          <SectionHeader
            eyebrow="Outcomes"
            title="What you'll be able to do"
            lede="Concrete capabilities you carry away - not just knowledge, but what to do with it."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {course.outcomes.map((o) => (
              <div
                key={o}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/30 p-5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-glass text-accent">
                  <Target className="h-4 w-4" />
                </span>
                <p className="text-sm leading-relaxed text-text">{o}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* curriculum */}
      <section className="section pt-0">
        <div className="container-x">
          <SectionHeader
            eyebrow="The curriculum"
            title={`${course.modules.length} modules, mapped to the Act`}
            lede={`About ${Math.round(totalMinutes / 5) * 5} minutes of focused study, each module tied to the sections it draws from.`}
          />
          <div className="mt-10">
            <CourseCurriculum modules={course.modules} lessons={lessons} />
          </div>
        </div>
      </section>

      {/* interactive practice */}
      {activities && (
        <section className="section pt-0">
          <div className="container-x">
            <SectionHeader
              eyebrow="Learn by doing"
              title="Interactive practice"
              lede={
                activities.intro ??
                "Put the theory to work - judge real situations, follow the decision tools, and lock in the vocabulary."
              }
            />
            <div className="mt-8">
              <CourseInteractive activities={activities} />
            </div>
          </div>
        </section>
      )}

      {/* start strip */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="flex flex-col gap-6 rounded-2xl border border-line bg-gradient-to-br from-surface-2/60 to-bg-2 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              {course.certificate ? (
                <span className="badge">
                  <BadgeCheck className="h-3 w-3" /> Certificate track
                </span>
              ) : (
                <span className="badge">
                  <Layers className="h-3 w-3" /> {course.modules.length} modules
                </span>
              )}
              <h2 className="mt-3 font-display text-2xl font-semibold text-text sm:text-3xl">
                Ready to start {course.title}?
              </h2>
              <p className="mt-2 max-w-xl text-text-muted">{course.tagline}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3">
              {course.actions.map((a) => (
                <Link
                  key={a.href + a.label}
                  href={a.href}
                  className={a.primary ? "btn btn-accent" : "btn btn-ghost"}
                >
                  {a.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-text-faint transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> All courses
          </Link>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
