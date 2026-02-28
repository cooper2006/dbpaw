import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const baseThemeSpec: Parameters<typeof EditorView.theme>[0] = {
  "&": {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  ".cm-content": {
    caretColor: "var(--foreground)",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--foreground)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--background)",
    color: "color-mix(in oklab, var(--foreground) 60%, transparent)",
    borderRight: "1px solid var(--border)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--muted) 55%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in oklab, var(--muted) 55%, transparent)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in oklab, var(--primary) 22%, transparent)",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
  },
  ".cm-tooltip-autocomplete": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "color-mix(in oklab, var(--primary) 18%, transparent)",
    color: "var(--popover-foreground)",
  },
  ".cm-panels": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    borderTop: "1px solid var(--border)",
  },
  ".cm-panel input": {
    backgroundColor: "var(--input-background)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
  },
  ".cm-panel button": {
    backgroundColor: "var(--secondary)",
    color: "var(--secondary-foreground)",
    border: "1px solid var(--border)",
  },
};

export const sqlEditorThemeLight: Extension = EditorView.theme(baseThemeSpec, { dark: false });
export const sqlEditorThemeDark: Extension = EditorView.theme(baseThemeSpec, { dark: true });

