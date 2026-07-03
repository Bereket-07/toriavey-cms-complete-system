let memoryToken: string | null = null;

export function setAuthToken(token: string | null) {
	memoryToken = token;
}

export function getAccessToken() {
	return memoryToken || localStorage.getItem("access_token");
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
	const token = getAccessToken();
	const headers = new Headers(init.headers || {});
	if (token) headers.set("Authorization", `Bearer ${token}`);
	return fetch(input, { ...init, headers });
}

export function logout() {
	localStorage.removeItem("access_token");
	localStorage.removeItem("token_type");
	localStorage.removeItem("user_id");
	localStorage.removeItem("user_name");
	localStorage.removeItem("user_picture");
}
