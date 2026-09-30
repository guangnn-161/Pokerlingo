import Link from "next/link";
import { notFound } from "next/navigation";
import { lessons } from "@/lib/lessons";
import { LessonQuiz } from "@/components/lesson-quiz";
import { LessonComplete } from "@/components/progress";
export function generateStaticParams() {
  return lessons.map((l) => ({ slug: l.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: `${lessons.find((l) => l.id === slug)?.title ?? "Lesson"} · Pokerlingo`,
  };
}
export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    l = lessons.find((l) => l.id === slug);
  if (!l) notFound();
  return (
    <>
      <Link href="/learn" className="text-link">
        ← Back to the library
      </Link>
      <div className="page-heading" style={{ marginTop: 28 }}>
        <div>
          <p className="eyebrow">
            {l.game} / {l.minutes} MIN READ
          </p>
          <h1>{l.title}</h1>
          <p>{l.subtitle}</p>
        </div>
      </div>
      <div className="article-layout">
        <article className="article-body">
          <div className="formula">{l.formula}</div>
          {l.sections.map((s, i) => (
            <section key={s.title} id={`part-${i}`}>
              <h2>{s.title}</h2>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
          <section className="content-panel" style={{ marginTop: 30 }}>
            <p className="eyebrow">WORKED EXAMPLE</p>
            <h3>{l.example.title}</h3>
            <p>{l.example.text}</p>
          </section>
          <LessonQuiz quiz={l.quiz} />
          <div style={{ marginTop: 25 }}>
            <LessonComplete id={l.id} />
          </div>
        </article>
        <aside className="article-aside coach-card">
          <p className="eyebrow">IN THIS LESSON</p>
          {l.sections.map((s, i) => (
            <a key={s.title} href={`#part-${i}`}>
              {String(i + 1).padStart(2, "0")} · {s.title}
            </a>
          ))}
          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--line)",
              margin: "25px 0",
            }}
          />
          <h3>Put it into practice</h3>
          <Link
            href={
              l.id === "card-counting"
                ? "/practice/counting"
                : l.id === "push-fold-gto"
                  ? "/practice/gto"
                  : l.game === "Blackjack"
                    ? "/practice/blackjack"
                    : "/practice/poker"
            }
          >
            Take a seat at the table ↗
          </Link>
          <Link href="/math">Explore the numbers ↗</Link>
          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--line)",
              margin: "25px 0",
            }}
          />
          <h3>Further reading</h3>
          {l.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.label} ↗
            </a>
          ))}
          <p className="quiet">
            Use the source’s stated rules when comparing figures.
          </p>
        </aside>
      </div>
    </>
  );
}
