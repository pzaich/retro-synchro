export interface RoutineSlot {
  elementId: string;
  formationId: string;
}

export interface RoutineData {
  id: string;
  name: string;
  slots: RoutineSlot[];
}

let nextRoutineId = 1;

export function createRoutine(name: string): RoutineData {
  return {
    id: `routine-${nextRoutineId++}`,
    name,
    slots: [],
  };
}
