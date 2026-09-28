import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Element, ElementContent, Root, RootContent } from "hast";

// Runs of Arabic script (letters, tashkīl, Arabic punctuation) plus the
// spaces/digits between them, so a whole phrase is wrapped as one unit.
const AR = "\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF";
// Brackets are deliberately left out so they stay in the surrounding
// left-to-right text and don't get mirrored into the Arabic run.
const ARABIC_RUN = new RegExp(`[${AR}](?:[${AR}\\u200c\\u200d\\s\\d.,!?:;«»"'-]*[${AR}])?`, "g");

/** rehype plugin: wrap Arabic runs in <span class="ar" lang="ar" dir="rtl">. */
function rehypeArabic() {
  const wrap = (node: Root | Element) => {
    const out: (RootContent | ElementContent)[] = [];
    for (const child of node.children) {
      if (child.type === "text") {
        let last = 0;
        for (const m of child.value.matchAll(ARABIC_RUN)) {
          const start = m.index ?? 0;
          if (start > last) out.push({ type: "text", value: child.value.slice(last, start) });
          out.push({
            type: "element",
            tagName: "span",
            properties: { className: ["ar"], lang: "ar", dir: "rtl" },
            children: [{ type: "text", value: m[0] }],
          });
          last = start + m[0].length;
        }
        if (last < child.value.length) out.push({ type: "text", value: child.value.slice(last) });
      } else {
        if (child.type === "element" && child.tagName !== "code" && child.tagName !== "pre") {
          wrap(child);
        }
        out.push(child);
      }
    }
    node.children = out as typeof node.children;
  };
  return (tree: Root) => wrap(tree);
}

const components: Components = {
  p: ({ children }) => <p dir="auto">{children}</p>,
  li: ({ children }) => <li dir="auto">{children}</li>,
  h1: ({ children }) => <h3 dir="auto">{children}</h3>,
  h2: ({ children }) => <h3 dir="auto">{children}</h3>,
  h3: ({ children }) => <h3 dir="auto">{children}</h3>,
  table: ({ children }) => (
    <div className="-mx-1 overflow-x-auto px-1">
      <table>{children}</table>
    </div>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
      {children}
    </a>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-tutor">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeArabic]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
