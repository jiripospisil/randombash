import { html, raw } from "hono/html"
import { escapeToBuffer } from "hono/utils/html";
import stripAnsi from "strip-ansi";

const Layout = (props: { id: number, children: any }) => html`
  <!-- Refunds at https://github.com/jiripospisil/randombash -->

  <!doctype html>
  <html>
    <head>
      <title>Random quote #${props.id}</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <style>
        @media (prefers-color-scheme: dark) {
          :root {
            background: #000;
            color: #d4d4d4;
          }
        }

        a {
          text-decoration: underscore;
          color: inherit;
        }
        div {
          margin: 0 auto;
          max-width: 600px;
          font-family: monospace;
          line-height: 130%;
        }
      </style>
    </head>

    <body>
      <div>
        <h1><a href="/${props.id}">#${props.id}</a></h1>
        ${props.children}
      </div>
    </body>

  </html>
`;

export function renderBrowserResponse(c: any, quote: Record<string, unknown>) {
  const text = (quote.quote as string).split("\n").map(line => {
    const buffer = [""];
    escapeToBuffer(line, buffer);
    return buffer;
  }).slice(2).join("<br>");

  return c.html(
    <Layout id={quote.id as number}>
      {raw(text)}
    </Layout>
  );
}

export function renderOtherResponse(c: any, quote: Record<string, unknown>) {
  const stripped = stripAnsi(quote.quote as string);

  const id = `#${quote.id}`;
  const text = stripped.split("\n").map(line =>
    line.trim()
  ).slice(2).join("\n");

  return c.text(`${id}\n\n${text}`);
}
