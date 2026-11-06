import { useEffect, useRef } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

/**
 * FormattedLessonContent Component
 * 
 * Safely parses raw text content, removes markdown artifacts (#, *, **),
 * and converts headings, lists, and callout sections into clean, 
 * highly readable educational UI components.
 * 
 * Supports live synchronized karaoke highlighting for the active spoken sentence
 * and click-to-listen interactivity.
 */
export default function FormattedLessonContent({
  content,
  compact = false,
  activeSentence = "",
  onSentenceClick = null,
}) {
  const activeElementRef = useRef(null);

  // Auto-scroll the active highlighted sentence into view gracefully
  useEffect(() => {
    if (activeSentence && activeElementRef.current) {
      activeElementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSentence]);

  if (!content) return null;

  const normalizedActive = activeSentence ? activeSentence.trim().toLowerCase() : "";

  // Helper to parse bold syntax **text** into JSX and highlight active sentence
  const parseInlineFormatting = (text, isSentenceActive = false) => {
    if (!text) return "";
    const cleanText = text.replace(/^[#*•\s]+/, "");

    const parts = cleanText.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isSentenceActive) {
      return (
        <span
          ref={activeElementRef}
          className="bg-blue-100/90 text-blue-950 font-medium px-2 py-1 rounded-lg border-l-4 border-[#0056D2] shadow-2xs inline-block transition-all duration-300"
        >
          {renderedParts}
        </span>
      );
    }

    return renderedParts;
  };

  const checkIsActive = (line) => {
    if (!normalizedActive || normalizedActive.length < 5) return false;
    const cleanLine = line.toLowerCase().replace(/[*#_`]/g, "").trim();
    return cleanLine.includes(normalizedActive) || normalizedActive.includes(cleanLine);
  };

  // Split lines
  const lines = content.split("\n");
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className={
            compact
              ? "space-y-1.5 my-2 pl-0.5 w-full min-w-0"
              : "space-y-2.5 my-4 pl-1 w-full min-w-0"
          }
        >
          {currentList.map((item, idx) => {
            const isActive = checkIsActive(item);
            return (
              <li
                key={idx}
                onClick={() => onSentenceClick && onSentenceClick(item)}
                className={`flex items-start gap-2 text-slate-700 min-w-0 w-full transition-colors ${
                  onSentenceClick ? "cursor-pointer hover:text-slate-950" : ""
                } ${compact ? "text-xs leading-relaxed" : "text-sm leading-relaxed"}`}
              >
                <CheckCircle2
                  className={`${
                    compact ? "w-3.5 h-3.5 mt-0.5" : "w-4 h-4 mt-1"
                  } ${isActive ? "text-[#0056D2]" : "text-emerald-600"} shrink-0`}
                />
                <div className="min-w-0 flex-1 break-words">
                  {parseInlineFormatting(item, isActive)}
                </div>
              </li>
            );
          })}
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

    // Heading level 3 or 4
    if (line.startsWith("#")) {
      flushList();
      const headingText = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
      const isActive = checkIsActive(headingText);
      elements.push(
        <div
          key={`h-${index}`}
          className={
            compact
              ? "mt-3 mb-1.5 pt-1 min-w-0 w-full"
              : "mt-6 mb-3 pt-2 min-w-0 w-full"
          }
        >
          <h3
            onClick={() => onSentenceClick && onSentenceClick(headingText)}
            className={`${
              compact ? "text-xs sm:text-sm font-black" : "text-lg sm:text-xl font-extrabold"
            } text-slate-900 tracking-tight flex items-center gap-1.5 break-words min-w-0 ${
              onSentenceClick ? "cursor-pointer" : ""
            }`}
          >
            <span
              className={`${
                compact ? "w-1.5 h-4" : "w-2 h-6"
              } ${isActive ? "bg-[#0056D2]" : "bg-emerald-600"} rounded-full inline-block shrink-0`}
            />
            <span className="min-w-0 flex-1 break-words">
              {parseInlineFormatting(headingText, isActive)}
            </span>
          </h3>
        </div>
      );
      return;
    }

    // Bullet item
    if (/^[*\-•]\s+/.test(line) || /^\d+[\.\)]\s+/.test(line)) {
      const itemText = line.replace(/^[*\-•\d\.\)]+\s*/, "");
      currentList.push(itemText);
      return;
    }

    // Callout box or Golden Rule highlight
    if (
      line.toLowerCase().includes("rule:") ||
      line.toLowerCase().includes("important:") ||
      line.toLowerCase().includes("protocol:")
    ) {
      flushList();
      const isActive = checkIsActive(line);
      elements.push(
        <div
          key={`callout-${index}`}
          onClick={() => onSentenceClick && onSentenceClick(line)}
          className={`${
            compact ? "my-2.5 p-3 rounded-xl" : "my-5 p-4 rounded-2xl"
          } ${
            isActive
              ? "bg-blue-50/90 border-blue-400 text-blue-950 shadow-md ring-2 ring-blue-500/20"
              : "bg-emerald-50/80 border-emerald-200/80 text-emerald-950"
          } border flex items-start gap-2.5 shadow-2xs min-w-0 w-full overflow-hidden transition-all ${
            onSentenceClick ? "cursor-pointer" : ""
          }`}
        >
          <Lightbulb
            className={`${
              compact ? "w-4 h-4 mt-0.5" : "w-5 h-5 mt-0.5"
            } ${isActive ? "text-[#0056D2]" : "text-emerald-600"} shrink-0`}
          />
          <div
            className={`${
              compact ? "text-xs" : "text-sm"
            } leading-relaxed font-medium min-w-0 flex-1 break-words`}
          >
            {parseInlineFormatting(line, isActive)}
          </div>
        </div>
      );
      return;
    }

    // Regular paragraph
    flushList();
    const isActive = checkIsActive(line);
    elements.push(
      <p
        key={`p-${index}`}
        onClick={() => onSentenceClick && onSentenceClick(line)}
        className={`${
          compact ? "my-1.5 text-xs" : "my-3 text-sm"
        } text-slate-700 leading-relaxed break-words min-w-0 w-full transition-all ${
          onSentenceClick ? "cursor-pointer hover:text-slate-950" : ""
        }`}
      >
        {parseInlineFormatting(line, isActive)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0.5 font-sans min-w-0 w-full">{elements}</div>;
}
