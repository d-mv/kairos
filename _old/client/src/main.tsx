import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { Provider } from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import { recoverFromChunkLoadError } from "./lib/chunk-load-recovery.js";
import { initSentry } from "./lib/sentry.js";

window.addEventListener("vite:preloadError", (event) => {
  recoverFromChunkLoadError(event, window.sessionStorage, () => window.location.reload());
});

initSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <Provider>
        <App />
      </Provider>
    </MantineProvider>
  </React.StrictMode>,
);
