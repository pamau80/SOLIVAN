export type NavItem = {
  href: string;
  label: string;
  module: string;
  phase: string;
  enabled: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", module: "K", phase: "9", enabled: true },
  { href: "/personas", label: "Personas", module: "A", phase: "2", enabled: true },
  { href: "/geografia", label: "Geografía", module: "B", phase: "3", enabled: true },
  { href: "/flota", label: "Flota", module: "C/D", phase: "3", enabled: true },
  { href: "/importacion", label: "Importación", module: "E", phase: "4", enabled: true },
  { href: "/planificacion", label: "Planificación", module: "F/G", phase: "5-6", enabled: true },
  { href: "/nominas", label: "Nóminas", module: "H", phase: "7", enabled: true },
  { href: "/ejecucion", label: "Ejecución", module: "I/J", phase: "8", enabled: true },
  { href: "/admin", label: "Administración", module: "L", phase: "10", enabled: true },
];
