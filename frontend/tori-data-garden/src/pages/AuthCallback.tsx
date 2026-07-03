import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
	const navigate = useNavigate();
	const { login, logout } = useAuth();

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const token = params.get("access_token");
		const tokenType = params.get("token_type") || "bearer";
		const id = params.get("id");
		const email = params.get("email");
		const name = params.get("name");
		const picture = params.get("picture");
		const isSuperAdmin = params.get("is_super_admin") === "true";

		if (token) {
			// Backend handles authorization. If we got a token, we are good.
			if (email) {
				login({
					token,
					tokenType,
					id: id || undefined,
					name: name || undefined,
					email: email || undefined,
					picture: picture || undefined,
					isSuperAdmin
				});
				navigate("/cms/dashboard", { replace: true });
			} else {
				// Should not happen if backend sent token, but safety check
				logout();
				navigate("/", { replace: true });
			}
		} else {
			// If no token present, send the user back to Login
			navigate("/", { replace: true });
		}
	}, [navigate]);

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<p className="text-lg">Completing sign-in...</p>
			</div>
		</div>
	);
}
