import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installMocks } from "./mocks/mockServer";

// No-op unless VITE_USE_MOCKS === "true" (see .env). Must run before render
// so the fake session is in place when the app reads it.
installMocks();

createRoot(document.getElementById("root")!).render(<App />);
