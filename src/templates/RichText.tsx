import { parseRichText, type Inline } from "@/lib/richText";

function renderInline(parts: Inline[]) {
  return parts.map((p, i) => {
    if (p.type === "bold") return <strong key={i}>{p.value}</strong>;
    if (p.type === "link") {
      const external = /^https?:\/\//i.test(p.href);
      return (
        <a
          key={i}
          href={p.href}
          className="font-medium underline underline-offset-2"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {p.label}
        </a>
      );
    }
    return <span key={i}>{p.value}</span>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichText(text);
  if (blocks.length === 0) return null;
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i}>{renderInline(b.content)}</p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
