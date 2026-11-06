import { StrictMode, Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/heebo/hebrew-400.css";
import "@fontsource/heebo/hebrew-500.css";
import "@fontsource/heebo/hebrew-600.css";
import "@fontsource/heebo/hebrew-700.css";
import "@fontsource/heebo/latin-400.css";
import "./index.css";
import App from "./App";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Keep technical details out of the wedding UI. */
  }
  render() {
    return this.state.failed ? (
      <main className="fatal-error" dir="rtl">
        <h1>הלו״ז צריך רגע להתאפס</h1>
        <p>השינויים שכבר נשמרו נשארים בטוחים.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          טעינה מחדש
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
