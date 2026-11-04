export const WORKSHOP_MACHINE_IDS = [
  "tour-potier",
  "tour-bois",
  "scie-format",
  "degau-rabot",
] as const;

export type WorkshopMachineId = (typeof WORKSHOP_MACHINE_IDS)[number];

export type WorkshopMachine = {
  id: WorkshopMachineId;
  label: string;
  discipline: "ceramique" | "menuiserie";
};

export const WORKSHOP_MACHINES: WorkshopMachine[] = [
  { id: "tour-potier", label: "Tour de potier", discipline: "ceramique" },
  { id: "tour-bois", label: "Tour à bois", discipline: "menuiserie" },
  { id: "scie-format", label: "Scie à format", discipline: "menuiserie" },
  { id: "degau-rabot", label: "Dégau rabot", discipline: "menuiserie" },
];

const MACHINE_ID_SET = new Set<string>(WORKSHOP_MACHINE_IDS);

export function isWorkshopMachineId(value: string): value is WorkshopMachineId {
  return MACHINE_ID_SET.has(value);
}

export function machinesForDiscipline(
  discipline: string | null | undefined,
): WorkshopMachine[] {
  if (discipline !== "ceramique" && discipline !== "menuiserie") {
    return [];
  }

  return WORKSHOP_MACHINES.filter((machine) => machine.discipline === discipline);
}

export function machineLabel(id: string) {
  return WORKSHOP_MACHINES.find((machine) => machine.id === id)?.label ?? id;
}
