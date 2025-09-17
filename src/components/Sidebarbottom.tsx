import { useNavigate } from "react-router-dom";

export default function SidebarBottom() {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate("/game"); // nuova pagina di gioco
  };

  return (
    <div className="h-16 bg-gray-800 text-white flex items-center justify-center">
      <button
        onClick={handleStartGame}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
      >
        Inizia Partita
      </button>
    </div>
  );
}
