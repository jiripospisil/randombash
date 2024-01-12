import { Hono } from "hono"
import { secureHeaders } from "hono/secure-headers"
import { logger } from "hono/logger"
import { etag } from "hono/etag"
import { renderBrowserResponse, renderOtherResponse } from "./responses"

type Bindings = {
  db: D1Database
}

const app = new Hono<{ Bindings: Bindings }>();

app.get("*", async (c, next) => {
  await next();
  // CF does not support the Vary header and I want to support non-html
  // responses as well.
  c.res.headers.append("Cache-Control", "no-cache");
});

app.use("*", secureHeaders());
app.use("*", logger());
app.use("*", etag());

app.onError((err, c) => {
  // Queues are a paid feature for reasons.
  console.log(err);
  return c.text("You broke it! Or the site has passed CF's free tier limits.", { status: 500 });
});

app.get("/", async c => {
  const quote = await loadRandomQuote(c.env.db);
  return renderQuote(c, quote);
})

app.get("/:id{[0-9]+}", async c => {
  const id = parseInt(c.req.param("id"), 10);
  const quote = await loadQuote(c.env.db, id);

  return renderQuote(c, quote);
});

function renderQuote(c: any, quote: Record<string, unknown> | null) {
  if (quote === null) {
    return c.text("Not found", { status: 404 });
  }

  if (isBrowser(c.req.header("Accept"))) {
    return renderBrowserResponse(c, quote);
  }

  return renderOtherResponse(c, quote);
}

function isBrowser(accept: string | undefined): boolean {
  return !!accept?.includes("html");
}

function loadRandomQuote(db: D1Database): Promise<Record<string, unknown> | null> {
  // Databases love random(), ask anyone. And more importantly I'm not running
  // the db server.
  return db.prepare("SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1").first();
}

function loadQuote(db: D1Database, id: number): Promise<Record<string, unknown> | null> {
  return db.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
}

export default app
