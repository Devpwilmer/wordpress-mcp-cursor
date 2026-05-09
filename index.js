import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";

const WP_BASE_URL = process.env.WP_BASE_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const GSC_SITE_URL = process.env.GSC_SITE_URL;
const GSC_SERVICE_ACCOUNT_JSON = process.env.GSC_SERVICE_ACCOUNT_JSON;
const GSC_OAUTH_CLIENT_ID = process.env.GSC_OAUTH_CLIENT_ID;
const GSC_OAUTH_CLIENT_SECRET = process.env.GSC_OAUTH_CLIENT_SECRET;
const GSC_OAUTH_REFRESH_TOKEN = process.env.GSC_OAUTH_REFRESH_TOKEN;

if (!WP_BASE_URL || !WP_USERNAME || !WP_APP_PASSWORD) {
  console.error("Missing env vars: WP_BASE_URL, WP_USERNAME, WP_APP_PASSWORD");
  process.exit(1);
}

const authHeader =
  "Basic " + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString("base64");

async function wpFetch(path, options = {}) {
  const url = `${WP_BASE_URL.replace(/\/$/, "")}/wp-json/wp/v2${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const raw = await response.text();
  let json = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = { raw };
  }

  if (!response.ok) {
    throw new Error(`WordPress API ${response.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

function parseServiceAccount() {
  if (!GSC_SERVICE_ACCOUNT_JSON) {
    throw new Error(
      "Missing env var: GSC_SERVICE_ACCOUNT_JSON. Add service account JSON text to .env."
    );
  }

  try {
    return JSON.parse(GSC_SERVICE_ACCOUNT_JSON);
  } catch {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
}

function getGscAuthClient() {
  const hasOAuth =
    Boolean(GSC_OAUTH_CLIENT_ID) &&
    Boolean(GSC_OAUTH_CLIENT_SECRET) &&
    Boolean(GSC_OAUTH_REFRESH_TOKEN);

  if (hasOAuth) {
    const oauth2Client = new google.auth.OAuth2(
      GSC_OAUTH_CLIENT_ID,
      GSC_OAUTH_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: GSC_OAUTH_REFRESH_TOKEN });
    return oauth2Client;
  }

  const credentials = parseServiceAccount();
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
  });
}

async function gscSearchAnalytics({
  startDate,
  endDate,
  dimensions,
  rowLimit = 10,
  dimensionFilterGroups
}) {
  if (!GSC_SITE_URL) {
    throw new Error("Missing env var: GSC_SITE_URL");
  }

  const auth = getGscAuthClient();

  const webmasters = google.webmasters({
    version: "v3",
    auth
  });

  const response = await webmasters.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit: Math.max(1, Math.min(25000, Number(rowLimit) || 10)),
      dimensionFilterGroups
    }
  });

  return response.data;
}

const server = new Server(
  { name: "wordpress-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_posts",
        description: "List recent WordPress posts",
        inputSchema: {
          type: "object",
          properties: {
            per_page: { type: "number", default: 5 }
          },
          additionalProperties: false
        }
      },
      {
        name: "create_post",
        description: "Create a WordPress post",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            status: { type: "string", enum: ["draft", "publish"], default: "draft" }
          },
          required: ["title", "content"],
          additionalProperties: false
        }
      },
      {
        name: "delete_post",
        description: "Delete a WordPress post (trash by default)",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number" },
            force: { type: "boolean", default: false }
          },
          required: ["id"],
          additionalProperties: false
        }
      },
      {
        name: "gsc_top_pages",
        description: "Top pages from Google Search Console",
        inputSchema: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "YYYY-MM-DD" },
            end_date: { type: "string", description: "YYYY-MM-DD" },
            row_limit: { type: "number", default: 10 }
          },
          required: ["start_date", "end_date"],
          additionalProperties: false
        }
      },
      {
        name: "gsc_top_queries",
        description: "Top queries from Google Search Console",
        inputSchema: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "YYYY-MM-DD" },
            end_date: { type: "string", description: "YYYY-MM-DD" },
            row_limit: { type: "number", default: 10 },
            page: { type: "string", description: "Optional page URL filter" }
          },
          required: ["start_date", "end_date"],
          additionalProperties: false
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === "list_posts") {
    const perPage = Number(args.per_page ?? 5);
    const posts = await wpFetch(
      `/posts?per_page=${Math.max(1, Math.min(100, perPage))}&_fields=id,date,title,status`
    );
    return {
      content: [{ type: "text", text: JSON.stringify(posts, null, 2) }]
    };
  }

  if (name === "create_post") {
    const body = {
      title: args.title,
      content: args.content,
      status: args.status || "draft"
    };
    const post = await wpFetch("/posts", {
      method: "POST",
      body: JSON.stringify(body)
    });
    return {
      content: [{ type: "text", text: JSON.stringify(post, null, 2) }]
    };
  }

  if (name === "delete_post") {
    const force = args.force === true;
    const result = await wpFetch(`/posts/${args.id}?force=${force}`, {
      method: "DELETE"
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }

  if (name === "gsc_top_pages") {
    const result = await gscSearchAnalytics({
      startDate: args.start_date,
      endDate: args.end_date,
      dimensions: ["page"],
      rowLimit: args.row_limit ?? 10
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }

  if (name === "gsc_top_queries") {
    const filterGroups = args.page
      ? [
          {
            filters: [
              {
                dimension: "page",
                operator: "equals",
                expression: args.page
              }
            ]
          }
        ]
      : undefined;

    const result = await gscSearchAnalytics({
      startDate: args.start_date,
      endDate: args.end_date,
      dimensions: ["query"],
      rowLimit: args.row_limit ?? 10,
      dimensionFilterGroups: filterGroups
    });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
