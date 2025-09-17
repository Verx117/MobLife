import { useState } from "react";
import MapSetupPage from "./MapSetupPage";

export default function Menu() {
  const [page, setPage] = useState<"menu" | "setup">("menu");

  if (page === "setup") return <MapSetupPage />;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
      <div className="flex flex-col gap-4 rounded-2xl bg-gray-800 p-8 shadow-lg">
        <button
          onClick={() => setPage("setup")}
          className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-500"
        >
          Inizia partita
        </button>
        <button className="rounded-lg bg-blue-600 px-6 py-3 text-white opacity-50">
          Carica partita
        </button>
        <button className="rounded-lg bg-red-600 px-6 py-3 text-white opacity-50">
          Esci
        </button>
      </div>
    </div>
  );
}
