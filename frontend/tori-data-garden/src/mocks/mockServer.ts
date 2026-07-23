/**
 * Dev-only mock layer.
 *
 * When VITE_USE_MOCKS === "true", this:
 *   1. Seeds a fake logged-in session so you skip the Google login gate.
 *   2. Patches window.fetch so any request to `/api/...` returns canned,
 *      believable data instead of hitting a real backend.
 *
 * Everything else (fonts, Vite assets, HMR) passes straight through.
 * This file is a complete no-op unless the flag is set, so it is safe to
 * leave imported in main.tsx permanently. To connect a real backend later,
 * just remove (or set to "false") VITE_USE_MOCKS in your .env and restart.
 */

const MOCKS_ENABLED = (import.meta as any).env?.VITE_USE_MOCKS === "true";

// ---- helpers ---------------------------------------------------------------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A tiny (intentionally simple) PDF so the "Download PDF" button produces a
// real file during design review. It is a preview placeholder, not a real book.
const MOCK_PDF = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 96 >>
stream
BT /F1 24 Tf 72 700 Td (Mock E-Book) Tj 0 -30 Td /F1 12 Tf (Design preview only - no real backend) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>
%%EOF`;

// ---- mock data -------------------------------------------------------------

const RECIPE_TITLES = [
  "Persian Herb Frittata (Kuku Sabzi)",
  "Classic Potato Latkes",
  "Shakshuka with Feta",
  "Honey Cake (Lekach)",
  "Matzo Ball Soup",
  "Sephardic Rice with Fava Beans",
  "Braised Brisket with Dried Fruit",
  "Homemade Challah",
  "Roasted Eggplant with Tahini",
  "Sufganiyot (Jelly Doughnuts)",
  "Chicken Shawarma Bowls",
  "Creamy Hummus with Za'atar",
  "Moroccan Harira Soup",
  "Stuffed Grape Leaves (Dolma)",
  "Za'atar Roasted Vegetables",
  "Apple & Honey Cake",
  "Falafel with Tahini Sauce",
  "Lemon Olive Oil Cake",
];

const STATUSES = ["posted", "pending", "generated", "not_generated"];

function recentRecipes(n = 5) {
  return Array.from({ length: n }).map((_, i) => {
    const status = STATUSES[i % STATUSES.length];
    return {
      id: 1400 + i,
      title: RECIPE_TITLES[i % RECIPE_TITLES.length],
      image_url: `https://loremflickr.com/320/320/food,dish?lock=${i + 10}`,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      content_status: { status, posted: status === "posted" },
    };
  });
}

function recentClips() {
  const platforms = ["youtube_shorts", "instagram_reels", "facebook_reels"];
  const statuses = ["completed", "processing", "completed", "failed", "posted"];
  return Array.from({ length: 5 }).map((_, i) => {
    const status = statuses[i];
    const name = RECIPE_TITLES[i % RECIPE_TITLES.length];
    const when = new Date(Date.now() - i * 3600000).toISOString();
    const sampleVideos = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    ];
    const clips =
      status === "completed" || status === "posted"
        ? Array.from({ length: 3 }).map((__, j) => ({
            videoId: `vid_${1000 + i}_${j}`,
            title: `${name} — Highlight ${j + 1}`,
            videoUrl: sampleVideos[j % sampleVideos.length],
            coverUrl: `https://loremflickr.com/360/640/food,cooking,meal?lock=9${i}${j}`,
            status: status === "posted" && j === 0 ? "posted" : "ready",
          }))
        : [];
    return {
      id: `clip_${1000 + i}`,
      projectId: `${1000 + i}`,
      projectName: `${name} — Reel`,
      platform: platforms[i % platforms.length],
      createdAt: when,
      created_at: when,
      video_url: `https://youtube.com/watch?v=mock${i}`,
      status,
      message:
        status === "failed" ? "Source video was too short to clip." : undefined,
      generated_clips: clips,
    };
  });
}

function generatedContentItems(n = 6, status = "generated") {
  const tags = [
    "#toriavey",
    "#recipe",
    "#homecooking",
    "#mediterranean",
    "#foodie",
  ];
  return Array.from({ length: n }).map((_, i) => {
    const name = RECIPE_TITLES[i % RECIPE_TITLES.length];
    return {
      id: 1500 + i,
      recipe_id: 1500 + i,
      title: name,
      recipe_name: name,
      post_title: name,
      image_url: `https://loremflickr.com/480/360/food,plated,meal?lock=${i + 30}`,
      status,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      generated_content: {
        instagram: {
          caption: `Fresh from the kitchen: ${name}. A warm, story-driven favorite you'll want to make again and again.`,
          hashtags: tags,
          platform_specific: {
            hook: `You have to try this ${name}`,
            cta: "Save this for the weekend!",
            key_highlight: "Ready in under an hour",
          },
          alternative_captions: [
            `Meet your new favorite: ${name}.`,
            `${name}, made simple.`,
          ],
        },
        twitter: {
          tweet: `${name} — simple, seasonal, and so good. Recipe on the blog.`,
          hashtags: tags.slice(0, 3),
        },
        facebook: {
          post: `We're sharing our beloved ${name} today. The kind of dish that brings everyone to the table.`,
          hashtags: tags.slice(0, 3),
        },
        pinterest: {
          title: `${name} Recipe`,
          description: `How to make ${name} at home — step by step.`,
          keywords: ["dinner", "easy", "mediterranean"],
        },
        tiktok: { caption: `Making ${name} at home`, hashtags: tags },
      },
    };
  });
}

const EBOOK_TOPICS = {
  total: 5,
  suggestions: [
    {
      topic: "Hanukkah",
      reason:
        "The Festival of Lights is approaching — latkes, sufganiyot, and brisket are perennial favorites and among your most-viewed recipes.",
      holiday_date: "December 14, 2026",
      holiday_type: "Jewish holiday",
      estimated_recipe_matches: 18,
    },
    {
      topic: "Cozy Winter Soups",
      reason:
        "Seasonal search interest in soups and stews peaks in the coming weeks; you have a deep, well-photographed soup archive.",
      holiday_date: null,
      holiday_type: null,
      estimated_recipe_matches: 24,
    },
    {
      topic: "Passover",
      reason:
        "Readers plan Seder menus early. A curated matzo-friendly collection performs strongly as a lead magnet.",
      holiday_date: "April 1, 2027",
      holiday_type: "Jewish holiday",
      estimated_recipe_matches: 31,
    },
    {
      topic: "Mediterranean Weeknight Dinners",
      reason:
        "Evergreen, high-converting theme that pairs well with your shakshuka and grain-bowl recipes.",
      holiday_date: null,
      holiday_type: null,
      estimated_recipe_matches: 42,
    },
    {
      topic: "Rosh Hashanah",
      reason:
        "Sweet, symbolic dishes (honey cake, apples, round challah) cluster naturally into a giftable collection.",
      holiday_date: "September 11, 2026",
      holiday_type: "Jewish holiday",
      estimated_recipe_matches: 15,
    },
  ],
};

// ---- router ----------------------------------------------------------------

async function handle(
  path: string,
  method: string,
  body: any,
): Promise<Response> {
  await delay(350); // let loading states show

  // ---- E-Books ----
  if (path.includes("/api/ebooks/topics")) return json(EBOOK_TOPICS);

  if (path.includes("/api/ebooks/generate")) {
    const title = body?.title || `A ${body?.topic || "Tori Avey"} Collection`;
    const count = Math.min(
      body?.max_recipes || 10,
      EBOOK_TOPICS.suggestions[0].estimated_recipe_matches || 10,
    );
    return json(
      {
        success: true,
        message: "E-book generated successfully (mock).",
        title,
        filename: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
        download_url: "/api/ebooks/download/mock.pdf",
        format: "pdf",
        recipe_count: count,
        file_size_bytes: 1_480_000 + count * 22_000,
        funnel: { source: "mock", lead_magnet: true },
      },
      201,
    );
  }

  if (path.includes("/api/ebooks/download/")) {
    return new Response(MOCK_PDF, {
      status: 200,
      headers: { "content-type": "application/pdf" },
    });
  }

  // ---- Writes / actions (approve, decline, generate) -> success ----
  if (
    (method === "POST" &&
      (path.includes("/wprm-approve-content/") ||
        path.includes("/wprm-decline-content/") ||
        path.includes("/wprm-scheduler/generate-single") ||
        path.includes("/clips/generate"))) ||
    (method === "DELETE" && path.includes("/clips/project/"))
  ) {
    return json({ success: true, message: "Done (mock)." });
  }

  // ---- Admin users ----
  if (path.includes("/api/admin/users")) {
    return json([
      {
        id: "mock-user",
        name: "Tori Avey",
        email: "tori@example.com",
        is_super_admin: true,
        isSuperAdmin: true,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "editor-1",
        name: "Sam Editor",
        email: "sam@example.com",
        is_super_admin: false,
        isSuperAdmin: false,
        is_active: true,
        created_at: new Date(Date.now() - 9e8).toISOString(),
      },
      {
        id: "editor-2",
        name: "Dana Cook",
        email: "dana@example.com",
        is_super_admin: false,
        isSuperAdmin: false,
        is_active: false,
        created_at: new Date(Date.now() - 3e9).toISOString(),
      },
    ]);
  }

  // ---- Dashboard ----
  if (path.includes("/api/content/wprm-status-summary")) {
    return json({
      total_recipes: 248,
      content_generated: 148,
      pending_generation: 66,
      completion_percentage: 78.2,
      by_status: { not_generated: 54, generated: 148, pending: 12, posted: 34 },
      by_platform: {
        facebook: 120,
        instagram: 96,
        pinterest: 210,
        twitter: 64,
      },
    });
  }

  if (path.includes("/api/wprm-scheduler/status")) {
    return json({
      is_running: true,
      next_run: new Date(Date.now() + 1000 * 60 * 42).toISOString(),
      interval_minutes: 60,
    });
  }

  if (path.includes("/api/youtube-scheduler/status")) {
    return json({
      is_running: false,
      config: { interval_minutes: 120 },
      next_run: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    });
  }

  if (path.includes("/api/clips/stats")) {
    return json({
      total_projects: 42,
      total_generated_clips: 187,
      total_posted_clips: 143,
      project_status: { processing: 3, completed: 37, failed: 2 },
      by_platform: { youtube: 64, instagram: 71, facebook: 52 },
    });
  }

  // Specific content endpoints MUST come before the generic wprm-recipes match.
  if (path.includes("/api/content/wprm-recipes-generated-not-posted")) {
    return json({ recipes: generatedContentItems(6, "generated"), total: 6 });
  }
  if (path.includes("/api/content/wprm-recipes-pending")) {
    return json({ recipes: generatedContentItems(5, "pending"), total: 5 });
  }
  if (path.includes("/api/content/wprm-recipes")) {
    const m = path.match(/limit=(\d+)/);
    const lim = m ? Math.min(parseInt(m[1], 10), 48) : 5;
    return json({ recipes: recentRecipes(lim), total: 248 });
  }

  if (path.includes("/api/clips/list")) {
    return json(recentClips());
  }

  // ---- Graceful fallback so no page crashes ----

  console.info(`[mock] Unhandled ${method} ${path} — returning empty default.`);
  return json({ items: [], recipes: [], data: [], results: [], total: 0 });
}

// ---- installer -------------------------------------------------------------

export function installMocks() {
  if (!MOCKS_ENABLED) return;

  // 1) Seed a fake session so RequireAuth lets us in.
  if (!localStorage.getItem("access_token")) {
    localStorage.setItem("access_token", "mock-token");
    localStorage.setItem("token_type", "bearer");
    localStorage.setItem("user_id", "mock-user");
    localStorage.setItem("user_name", "Tori Avey");
    localStorage.setItem("user_email", "tori@example.com");
    localStorage.setItem("user_super_admin", "true");
  }

  // 2) Patch fetch for /api calls only.
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (url && url.includes("/api/")) {
      const method = (
        init.method ||
        (input instanceof Request ? input.method : "GET") ||
        "GET"
      ).toUpperCase();
      let body: any = undefined;
      try {
        if (init.body && typeof init.body === "string")
          body = JSON.parse(init.body);
      } catch {
        /* ignore */
      }
      const path = url.replace(/^https?:\/\/[^/]+/, "");
      return handle(path, method, body);
    }
    return originalFetch(input as any, init);
  };

  // 3) If we land on the login page while "authenticated", jump into the app.
  if (window.location.pathname === "/") {
    window.history.replaceState({}, "", "/cms/dashboard");
  }

  console.info(
    "%c[mock] Mock backend active — no real API is being called.",
    "color:#5C6B3F;font-weight:bold",
  );
}
