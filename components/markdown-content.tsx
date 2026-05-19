import { Fragment, ReactNode } from "react";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const inlinePattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/) ?? [];
      nodes.push(
        <a
          key={match.index}
          href={href}
          className="underline underline-offset-4"
          rel="noopener noreferrer"
          target={href?.startsWith("http") ? "_blank" : undefined}
        >
          {label}
        </a>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return null;
  }

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          return <h3 key={index}>{renderInline(block.slice(4))}</h3>;
        }

        if (block.startsWith("## ")) {
          return <h2 key={index}>{renderInline(block.slice(3))}</h2>;
        }

        if (block.startsWith("# ")) {
          return <h1 key={index}>{renderInline(block.slice(2))}</h1>;
        }

        const lines = block.split("\n");
        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return (
            <ul key={index}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
