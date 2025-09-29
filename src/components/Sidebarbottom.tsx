import type { MobileEntity } from "../assets/entitiesType";
import { tileColors, type FixedEntity } from "../assets/tileType";
import type { Tile } from "../utils/mapGenerator";

interface SidebarBottomProps {
  tile?: Tile;
  tilePosition?: { y: number; x: number };
  fixedEntities?: FixedEntity[];
  mobileEntities?: MobileEntity[];
  time?: number;
}

export default function SidebarBottom({
  tile,
  tilePosition,
  fixedEntities = [],
  mobileEntities = [],
  time = 0,
}: SidebarBottomProps) {
  return (
    <div className="h-40 bg-gray-800 text-white p-4 overflow-auto flex flex-row">
      <h2 className="font-bold mb-2">
        Cella ({tilePosition?.y ?? "-"}, {tilePosition?.x ?? "-"})
      </h2>
      {tile ? (
        <p>
          Terreno:{" "}
          <span style={{ color: tileColors[tile.type] }}>{tile.type}</span>
        </p>
      ) : (
        <p>Nessuna cella selezionata</p>
      )}

      <div className="mt-2">
        <h3 className="font-bold">Entità fisse:</h3>
        {fixedEntities.length === 0 && <p>Nessuna</p>}
        {fixedEntities.map((fe) => (
          <div key={fe.id}>
            <strong>
              {fe.type.toUpperCase()} ({fe.id})
            </strong>
            {fe.missions?.length ? (
              <ul className="ml-4">
                {fe.missions.map((m) => (
                  <li key={m.id}>
                    {m.type} → assegnata a {m.assignedTo ?? "nessuno"} (
                    {m.duration} tick)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ml-4">Nessuna missione</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-row">
        <h3 className="font-bold">Entità mobili:</h3>
        {mobileEntities.length === 0 && <p>Nessuna</p>}
        {mobileEntities.map((me) => (
          <div key={me.id}>
            <strong>
              {me.type.toUpperCase()} ({me.id})
            </strong>
            {me.missions
              ?.filter((m) => !m.completedAt || time - m.completedAt <= 60)
              .map((mission) => (
                <p key={mission.id} className="ml-4">
                  Destinazione: ({mission.target.y}, {mission.target.x}) <br />
                  Percorso restante: {mission.path?.length ?? 0} caselle <br />
                  Tempo stimato: {mission.progress ?? 0} / {mission.duration}{" "}
                  <br />
                  Fase: {mission.phase ?? "N/D"}
                  <br />
                  Stato:{" "}
                  {mission.completedAt
                    ? `Completata ${time - mission.completedAt} tick fa`
                    : "Attiva"}
                </p>
              ))}
            {(!me.missions ||
              me.missions.filter(
                (m) => !m.completedAt || time - m.completedAt <= 60
              ).length === 0) && (
              <p className="ml-4">Nessuna missione attiva</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
