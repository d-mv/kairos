import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { Provider } from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import { recoverFromChunkLoadError } from "./lib/chunk-load-recovery.js";

window.addEventListener("vite:preloadError", (event) => {
  recoverFromChunkLoadError(event, window.sessionStorage, () => window.location.reload());
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <Provider>
        <App />
      </Provider>
    </MantineProvider>
  </React.StrictMode>,
);
