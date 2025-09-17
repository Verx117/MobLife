import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Setup from "./pages/MapSetupPage";
import "./index.css";
import GamePage from "./pages/GamePage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/setup" element={<Setup />} />
        <Route
          path="/gamePage"
          element={
            <GamePage
              config={{
                height: 0,
                width: 0,
                cities: 0,
                towns: 0,
                dungeons: 0,
              }}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
