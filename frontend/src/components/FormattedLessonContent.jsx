import { ShieldCheck, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

/**
 * FormattedLessonContent Component
 * 
 * Safely parses raw text content, removes markdown artifacts (#, *, **),
 * and converts headings, lists, and callout sections into clean, 
 * highly readable educational UI components.
 */
export default function FormattedLessonContent({ content, compact = false }) {
  if (!content) return null;

  // Helper to parse bold syntax **text** into JSX
  const parseInlineFormatting = (text) => {
    if (!text) return "";
    // Clean up remaining asterisks or hashes
    const cleanText = text.replace(/^[#*•\s]+/, "");
    
    // Split by bold pattern **...**
    const parts = cleanText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Split lines
  const lines = content.split("\n");
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className={compact ? "space-y-1.5 my-2 pl-0.5" : "space-y-2.5 my-4 pl-1"}>
          {currentList.map((item, idx) => (
            <li key={idx} className={`flex items-start gap-2 text-slate-700 dark:text-slate-200 ${compact ? "text-xs leading-relaxed" : "text-sm leading-relaxed"}`}>
              <CheckCircle2 className={`${compact ? "w-3.5 h-3.5 mt-0.5" : "w-4 h-4 mt-1"} text-emerald-600 shrink-0`} />
              <div>{parseInlineFormatting(item)}</div>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Heading level 3 or 4 (e.g. ### Heading or #### Subheading)
    if (line.startsWith("#")) {
      flushList();
      const headingText = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
      elements.push(
        <div key={`h-${index}`} className={compact ? "mt-3 mb-1.5 pt-1" : "mt-6 mb-3 pt-2"}>
          <h3 className={`${compact ? "text-xs sm:text-sm font-black" : "text-lg sm:text-xl font-extrabold"} text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5`}>
            <span className={`${compact ? "w-1.5 h-4" : "w-2 h-6"} bg-emerald-600 rounded-full inline-block shrink-0`} />
            <span>{headingText}</span>
          </h3>
        </div>
      );
      return;
    }

    // Bullet item (starting with *, -, •, or 1., 2.)
    if (/^[*\-•]\s+/.test(line) || /^\d+[\.\)]\s+/.test(line)) {
      const itemText = line.replace(/^[*\-•\d\.\)]+\s*/, "");
      currentList.push(itemText);
      return;
    }

    // Callout box or Golden Rule highlight
    if (line.toLowerCase().includes("rule:") || line.toLowerCase().includes("important:") || line.toLowerCase().includes("protocol:")) {
      flushList();
      elements.push(
        <div key={`callout-${index}`} className={`${compact ? "my-2.5 p-3 rounded-xl" : "my-5 p-4 rounded-2xl"} bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 flex items-start gap-2.5 shadow-2xs`}>
          <Lightbulb className={`${compact ? "w-4 h-4 mt-0.5" : "w-5 h-5 mt-0.5"} text-emerald-600 shrink-0`} />
          <div className={`${compact ? "text-xs" : "text-sm"} leading-relaxed font-medium`}>
            {parseInlineFormatting(line)}
          </div>
        </div>
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${index}`} className={`${compact ? "my-1.5 text-xs" : "my-3 text-sm"} text-slate-700 leading-relaxed`}>
        {parseInlineFormatting(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0.5 font-sans">{elements}</div>;
}
