import type { ShikiTransformer } from 'shiki';
import type { Element } from 'hast';

const LANG_LABELS: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  shellscript: 'bash',
  zsh: 'bash',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  plaintext: 'text',
  txt: 'text',
};

/** Reads `title="…"` from a fenced code block meta string. */
function parseTitle(meta: string | undefined): string | undefined {
  if (!meta) return undefined;
  const match = meta.match(/title=(?:"([^"]*)"|'([^']*)')/);
  return match?.[1] ?? match?.[2];
}

/**
 * Wraps every highlighted `<pre>` in a `<figure class="code-block">` with a
 * header that shows the file title or language and a copy button.
 *
 * The button is rendered `hidden`; `CodeCopy.astro` fills in its
 * localized label and icon on the client (progressive enhancement).
 */
export function codeBlockTransformer(): ShikiTransformer {
  return {
    name: 'ozkkar:code-block',
    root(root) {
      const pre = root.children.find(
        (node): node is Element => node.type === 'element' && node.tagName === 'pre',
      );
      if (!pre) return;

      const lang = this.options.lang ?? 'text';
      const title = parseTitle(this.options.meta?.__raw);
      const label = title ?? LANG_LABELS[lang] ?? lang;

      const header: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block__header'] },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-block__lang'] },
            children: [{ type: 'text', value: label }],
          },
          {
            type: 'element',
            tagName: 'button',
            properties: { type: 'button', className: ['code-block__copy'], hidden: true },
            children: [],
          },
        ],
      };

      root.children = [
        {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['code-block'] },
          children: [header, pre],
        },
      ];
    },
  };
}
