import { useState } from "react";
import Menu from "./pages/Menu";
import MapSetupPage from "./pages/MapSetupPage";

export default function App() {
  const [page, setPage] = useState<"Menu" | "MapSetupPage">("Menu");

  if (page === "Menu") return <Menu onStart={() => setPage("MapSetupPage")} />;
  if (page === "MapSetupPage") return <MapSetupPage />;

  return null;
}
