import { useMemo } from "react";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  height?: string;
  variables?: string[];
}

export default function CodeEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
  height = "300px",
  variables = [],
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const exts: Extension[] = [html()];

    if (variables.length > 0) {
      const varCompletions = variables.map((v) => ({
        label: `{{.${v}}}`,
        type: "variable" as const,
        info: `Insert template variable ${v}`,
        apply: `{{.${v}}}`,
      }));

      // Also add common Go template constructs
      const templateCompletions = [
        { label: "{{if .var}}", type: "keyword" as const, info: "Conditional block", apply: "{{if .}}" },
        { label: "{{else}}", type: "keyword" as const, info: "Else branch", apply: "{{else}}" },
        { label: "{{end}}", type: "keyword" as const, info: "End block", apply: "{{end}}" },
        { label: "{{range .var}}", type: "keyword" as const, info: "Range loop", apply: "{{range .}}" },
        { label: "{{if .var}}...{{end}}", type: "keyword" as const, info: "Conditional with end", apply: "{{if .}}\n  \n{{end}}" },
      ];

      const allCompletions = [...varCompletions, ...templateCompletions];

      exts.push(
        autocompletion({
          override: [
            (context: CompletionContext) => {
              const word = context.matchBefore(/\{\{\.?\w*\}?\}?|\w+/);
              if (!word) return null;
              return {
                from: word.from,
                options: allCompletions,
                validFor: /^.*$/,
              };
            },
          ],
        })
      );
    }

    return exts;
  }, [variables]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
      <CodeMirror
        value={value}
        onChange={onChange}
        height={height}
        theme={oneDark}
        extensions={extensions}
        readOnly={disabled}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightActiveLine: true,
          indentOnInput: true,
        }}
      />
    </div>
  );
}
