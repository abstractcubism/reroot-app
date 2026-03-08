import { createRoot } from "react-dom/client";
import App from "./app";
import "./styles/tailwind.css";

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
