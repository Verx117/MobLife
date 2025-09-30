import type { Tile } from "../utils/mapGenerator";
import type { FixedEntity, Mission } from "../assets/tileType";
import type { MobileEntity } from "../assets/entitiesType";

interface SidebarBottomProps {
  tile?: Tile;
  tilePosition?: { y: number; x: number };
  fixedEntities: FixedEntity[];
  mobileEntities: MobileEntity[];
  time: number;
}

export default function SidebarBottom({
  tile,
  tilePosition,
  fixedEntities,
  mobileEntities,
  time,
}: SidebarBottomProps) {
  return (
    <div className="h-48 w-full bg-gray-800 text-white overflow-y-auto p-4 flex flex-row">
      {tile ? (
        <>
          <h2 className="font-bold text-lg mb-2">
            Cella ({tilePosition?.y}, {tilePosition?.x}) - {tile.type}
          </h2>

          {/* ENTITÀ FISSE */}
          {fixedEntities.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold">Entità fisse</h3>
              {fixedEntities.map((e) => (
                <div
                  key={e.id}
                  className="border border-gray-600 rounded p-2 mt-1"
                >
                  <p className="font-bold capitalize">{e.type}</p>
                  <p className="text-sm text-gray-300">ID: {e.id}</p>

                  {/* Missioni */}
                  <div className="mt-2">
                    <p className="text-sm underline">Missioni generate:</p>
                    {(e.missions ?? []).map((m: Mission) => {
                      const isCompleted = !!m.completedAt;
                      const expired =
                        isCompleted && time - (m.completedAt ?? 0) > 60;
                      if (expired) return null;

                      return (
                        <div
                          key={m.id}
                          className={`text-xs ${
                            isCompleted ? "text-green-400" : "text-yellow-300"
                          }`}
                        >
                          • {m.type}
                          {isCompleted
                            ? ` (completata al tick ${m.completedAt})`
                            : m.assignedTo
                            ? ` → assegnata a ${m.assignedTo}`
                            : " (disponibile)"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ENTITÀ MOBILI */}

          {mobileEntities.length > 0 && (
            <div className="flex flex-row">
              <h3 className="font-semibold">Entità mobili</h3>
              {mobileEntities.map((m) => (
                <div
                  key={m.id}
                  className="border border-gray-600 rounded p-2 mt-1"
                >
                  <p className="font-bold capitalize">{m.type}</p>
                  <p className="text-sm text-gray-300">ID: {m.id}</p>

                  {/* Missioni */}
                  <div className="mt-2">
                    <p className="text-sm underline">Missioni assegnate:</p>
                    {(m.missions ?? []).map((mission) => {
                      const isCompleted = !!mission.completedAt;
                      const expired =
                        isCompleted && time - (mission.completedAt ?? 0) > 60;
                      if (expired) return null;

                      return (
                        <div
                          key={mission.id}
                          className={`text-xs ${
                            isCompleted ? "text-green-400" : "text-blue-300"
                          }`}
                        >
                          • {mission.type}
                          {isCompleted
                            ? ` (completata al tick ${mission.completedAt})`
                            : ` [fase: ${mission.phase ?? "?"}]`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-400">Seleziona una cella per i dettagli</p>
      )}
    </div>
  );
}
