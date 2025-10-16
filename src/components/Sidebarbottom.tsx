import type { Tile } from "../utils/mapGenerator";
import type {
  MobileEntity,
  FixedEntity,
  Mission,
} from "../assets/entitiesType";

interface SidebarBottomProps {
  tile?: Tile;
  tilePosition?: { y: number; x: number };
  fixedEntities: FixedEntity[];
  mobileEntities: MobileEntity[];
  missionRegistry: Record<string, Mission>;
  time: number;
}

export default function SidebarBottom({
  tile,
  tilePosition,
  fixedEntities,
  mobileEntities,
  missionRegistry,
  time,
}: SidebarBottomProps) {
  return (
    <div className="h-48 w-full bg-gray-800 text-white overflow-x-auto overflow-y-auto p-4 flex flex-row gap-2">
      {tile ? (
        <>
          <h2 className="font-bold text-lg mb-2">
            Cella ({tilePosition?.y}, {tilePosition?.x}) - {tile.type}
          </h2>

          {/* ENTITÀ FISSE */}
          {fixedEntities.length > 0 && (
            <div className="mb-2">
              <h3 className="font-semibold mb-1">Entità fisse</h3>
              <div className="flex flex-row flex-wrap gap-2">
                {fixedEntities.map((e) => {
                  const missions = e.missionIds
                    ?.map((id) => missionRegistry[id])
                    .filter((m): m is Mission => !!m);

                  return (
                    <div
                      key={e.id}
                      className="border border-gray-600 rounded p-2 min-w-[120px] flex-shrink-0"
                    >
                      <p className="font-bold capitalize text-sm">{e.type}</p>
                      <p className="text-xs text-gray-300">ID: {e.id}</p>

                      <div className="mt-1 text-xs">
                        <p className="underline">Missioni:</p>
                        {missions.length === 0 && (
                          <p className="italic text-gray-500">Nessuna</p>
                        )}
                        {missions.map((m) => {
                          const isCompleted = !!m.completedAt;
                          const expired =
                            isCompleted && time - (m.completedAt ?? 0) > 60;
                          if (expired) return null;

                          return (
                            <div
                              key={m.id}
                              className={`${
                                isCompleted
                                  ? "text-green-400"
                                  : m.assignedTo
                                  ? "text-yellow-300"
                                  : "text-gray-300"
                              }`}
                            >
                              • {m.type}
                              {isCompleted
                                ? ` (completata al tick ${m.completedAt})`
                                : m.assignedTo
                                ? ` a ${m.assignedTo} [fase: ${m.phase ?? "?"}]`
                                : " (disponibile)"}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ENTITÀ MOBILI */}
          {mobileEntities.length > 0 && (
            <div className="mb-2">
              <h3 className="font-semibold mb-1">Entità mobili</h3>
              <div className="flex flex-row flex-wrap gap-2">
                {mobileEntities.map((m) => {
                  const missions = m.missionIds
                    ?.map((id) => missionRegistry[id])
                    .filter((mission): mission is Mission => !!mission);

                  return (
                    <div
                      key={m.id}
                      className="border border-gray-600 rounded p-2 min-w-[120px] flex-shrink-0"
                    >
                      <p className="font-bold capitalize text-sm">{m.type}</p>
                      <p className="text-xs text-gray-300">ID: {m.id}</p>

                      <div className="mt-1 text-xs">
                        <p className="underline">Missioni:</p>
                        {missions.length === 0 && (
                          <p className="italic text-gray-500">Nessuna</p>
                        )}
                        {missions.map((mission) => {
                          const isCompleted = !!mission.completedAt;
                          const expired =
                            isCompleted &&
                            time - (mission.completedAt ?? 0) > 60;
                          if (expired) return null;

                          return (
                            <div
                              key={mission.id}
                              className={`${
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
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-400">Seleziona una cella per i dettagli</p>
      )}
    </div>
  );
}
