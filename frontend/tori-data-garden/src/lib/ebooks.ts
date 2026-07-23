import { API_BASE, apiGet, apiPost } from "./api";
import { authFetch } from "./oauth";

// ---- Types (mirror backend src/domain/schemas/ebook_schemas.py) ----

export type EbookTopicSuggestion = {
  topic: string;
  reason: string;
  holiday_date?: string | null;
  holiday_type?: string | null;
  estimated_recipe_matches?: number | null;
};

export type EbookTopicSuggestionsResponse = {
  total: number;
  suggestions: EbookTopicSuggestion[];
};

export type GenerateEbookRequest = {
  title?: string;
  subtitle?: string;
  topic?: string;
  recipe_ids?: number[];
  max_recipes?: number;
  author?: string;
  tone?: string;
  include_nutrition?: boolean;
  cover_style?: string;
  format?: "pdf";
};

export type RecipeChoice = {
  id: number;
  title: string;
  image_url?: string;
  date?: string;
};

export async function fetchRecipeChoices(limit = 40) {
  const res = await apiGet<{ recipes: RecipeChoice[]; total: number }>(
    `/api/content/wprm-recipes?limit=${limit}`,
  );
  return res.recipes || [];
}

export type GenerateEbookResponse = {
  success: boolean;
  message: string;
  title: string;
  filename: string;
  download_url: string;
  format: "pdf";
  recipe_count: number;
  file_size_bytes: number;
  funnel: Record<string, unknown>;
};

// ---- API calls ----

export async function fetchEbookTopics(days = 60) {
  return apiGet<EbookTopicSuggestionsResponse>(
    `/api/ebooks/topics?days=${days}`,
  );
}

export async function generateEbook(body: GenerateEbookRequest) {
  return apiPost<GenerateEbookResponse>("/api/ebooks/generate", body);
}

/**
 * The download route is behind the auth gate, so we can't just point the
 * browser at it. Fetch it as a blob (with the auth header attached by
 * authFetch), then trigger a client-side save.
 */
export async function downloadEbook(filename: string) {
  const resp = await authFetch(
    `${API_BASE}/api/ebooks/download/${encodeURIComponent(filename)}`,
  );
  if (!resp.ok) {
    throw new Error(`Download failed: ${resp.status}`);
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
