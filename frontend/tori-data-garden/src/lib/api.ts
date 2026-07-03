import { authFetch } from "./oauth";

export const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiGet<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const resp = await authFetch(`${API_BASE}${path}`, init);
  if (resp.status === 401) {
    // Auth failed, clear local storage and redirect
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_picture");
    window.location.href = "/";
    throw new Error("Authentication expired. Redirecting to login...");
  }
  if (!resp.ok) {
    let msg = `API ${path} failed: ${resp.status}`;
    try {
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await resp.json();
        if (j?.detail) msg += ` - ${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)}`;
      } else {
        const t = await resp.text();
        if (t) msg += ` - ${t.substring(0, 300)}`;
      }
    } catch {
      // ignore body parse errors
    }
    throw new Error(msg);
  }
  return resp.json();
}
export async function apiPost<T = any>(path: string, body: any, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  const resp = await authFetch(`${API_BASE}${path}`, { ...init, method: "POST", body: JSON.stringify(body), headers });
  if (resp.status === 401) {
    // Auth failed, clear local storage and redirect
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_picture");
    localStorage.removeItem("user_super_admin");
    window.location.href = "/";
    throw new Error("Authentication expired. Redirecting to login...");
  }
  if (!resp.ok) {
    let msg = `API ${path} failed: ${resp.status}`;
    try {
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await resp.json();
        if (j?.detail) msg += ` - ${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)}`;
      } else {
        const t = await resp.text();
        if (t) msg += ` - ${t.substring(0, 300)}`;
      }
    } catch { }
    throw new Error(msg);
  }
  return resp.json();
}

export async function apiPatch<T = any>(path: string, body: any, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  const resp = await authFetch(`${API_BASE}${path}`, { ...init, method: "PATCH", body: JSON.stringify(body), headers });
  if (resp.status === 401) {
    // Auth failed, clear local storage and redirect
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_picture");
    localStorage.removeItem("user_super_admin");
    window.location.href = "/";
    throw new Error("Authentication expired. Redirecting to login...");
  }
  if (!resp.ok) {
    let msg = `API ${path} failed: ${resp.status}`;
    try {
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await resp.json();
        if (j?.detail) msg += ` - ${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)}`;
      } else {
        const t = await resp.text();
        if (t) msg += ` - ${t.substring(0, 300)}`;
      }
    } catch { }
    throw new Error(msg);
  }
  return resp.json();
}

export async function apiDelete<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const resp = await authFetch(`${API_BASE}${path}`, { ...init, method: "DELETE" });
  if (resp.status === 401) {
    // Auth failed, clear local storage and redirect
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_picture");
    localStorage.removeItem("user_super_admin");
    window.location.href = "/";
    throw new Error("Authentication expired. Redirecting to login...");
  }
  if (!resp.ok) {
    let msg = `API ${path} failed: ${resp.status}`;
    try {
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await resp.json();
        if (j?.detail) msg += ` - ${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)}`;
      } else {
        const t = await resp.text();
        if (t) msg += ` - ${t.substring(0, 300)}`;
      }
    } catch { }
    throw new Error(msg);
  }
  if (resp.status === 204) {
    return null as any;
  }
  return resp.json();
}

export interface GA4ReportRequest {
  property_id: string;
  start_date: string;
  end_date: string;
  dimensions: string[];
  metrics: string[];
  limit?: number;
}

export async function fetchGASummaryMetrics(propertyId: string, startDate: string, endDate: string) {
  const body: GA4ReportRequest = {
    property_id: propertyId,
    start_date: startDate,
    end_date: endDate,
    dimensions: [],
    metrics: ["activeUsers", "newUsers", "averageSessionDuration"],
    limit: 1
  };
  return apiPost("/api/v1/ga4/report", body);
}

export async function fetchGATrendData(propertyId: string, startDate: string, endDate: string) {
  const body: GA4ReportRequest = {
    property_id: propertyId,
    start_date: startDate,
    end_date: endDate,
    dimensions: ["date"],
    metrics: ["activeUsers"],
    limit: 30
  };
  return apiPost("/api/v1/ga4/report", body);
}

export async function fetchGAUserActivityTrend(propertyId: string, startDate: string, endDate: string) {
  const body: GA4ReportRequest = {
    property_id: propertyId,
    start_date: startDate,
    end_date: endDate,
    dimensions: ["date"],
    metrics: ["sessions"],
    limit: 30
  };
  return apiPost("/api/v1/ga4/report", body);
}

export async function fetchGAPageViews(propertyId: string, startDate: string, endDate: string) {
  const body: GA4ReportRequest = {
    property_id: propertyId,
    start_date: startDate,
    end_date: endDate,
    dimensions: ["pageTitle", "pagePath"],
    metrics: ["screenPageViews"],
    limit: 10
  };
  return apiPost("/api/v1/ga4/report", body);
}

export async function fetchGATopContent(propertyId: string, startDate: string, endDate: string) {
  const body: GA4ReportRequest = {
    property_id: propertyId,
    start_date: startDate,
    end_date: endDate,
    dimensions: ["pageTitle"],
    metrics: ["screenPageViews"],
    limit: 5
  };
  return apiPost("/api/v1/ga4/report", body);
}

// Kit API functions
export async function fetchKitBroadcasts() {
  return apiGet("/api/v1/kit/broadcasts");
}

export async function fetchKitBroadcastStats() {
  return apiGet("/api/v1/kit/broadcasts/stats");
}

export async function fetchKitBroadcastClicks(broadcastId: string) {
  return apiGet(`/api/v1/kit/broadcasts/${broadcastId}/clicks`);
}

export async function fetchKitForms() {
  return apiGet("/api/v1/kit/forms");
}

export async function fetchKitFormSubscribers(formId: string) {
  return apiGet(`/api/v1/kit/forms/${formId}/subscribers`);
}

export async function fetchKitSubscriberStats(subscriberId: string) {
  return apiGet(`/api/v1/kit/subscribers/${subscriberId}/stats`);
}

export async function fetchKitSubscriberTags(subscriberId: string) {
  return apiGet(`/api/v1/kit/subscribers/${subscriberId}/tags`);
}

export async function fetchKitTagSubscribers(tagId: string) {
  return apiGet(`/api/v1/kit/tags/${tagId}/subscribers`);
}

export async function fetchKitSequenceSubscribers(sequenceId: string) {
  return apiGet(`/api/v1/kit/sequences/${sequenceId}/subscribers`);
}

export async function fetchKitPurchases() {
  return apiGet("/api/v1/kit/purchases");
}

export async function fetchKitEmailStats() {
  return apiGet("/api/v1/kit/account/email_stats");
}

export async function fetchKitGrowthStats() {
  return apiGet("/api/v1/kit/account/growth_stats");
}

export async function fetchKitSubscribers(page: number = 1, limit: number = 10, sortOrder: string = "desc") {
  return apiGet(`/api/v1/kit/subscribers?page=${page}&limit=${limit}&sort_order=${sortOrder}`);
}

export async function fetchKitFormStats() {
  return apiGet("/api/v1/kit/forms/stats");
}

// Slickstream API functions
export async function fetchSlickstreamSite() {
  return apiGet("/api/v1/slickstream/site");
}

export async function fetchSlickstreamPageMetrics(count: number = 100) {
  const params = new URLSearchParams({ count: String(count) });
  return apiGet(`/api/v1/slickstream/page-metrics?${params.toString()}`);
}
