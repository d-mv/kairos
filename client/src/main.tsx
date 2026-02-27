import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "jotai";
import App from "./App.js";
import { ThemeProvider } from "./components/ThemeProvider.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <Provider>
        <App />
      </Provider>
    </ThemeProvider>
  </React.StrictMode>,
);
