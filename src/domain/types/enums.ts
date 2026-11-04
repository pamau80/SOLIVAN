export const TransportCondition = {
  UsesTransport: "uses_transport",
  NoTransport: "no_transport",
  PendingValidation: "pending_validation",
} as const;

export type TransportCondition =
  (typeof TransportCondition)[keyof typeof TransportCondition];

export const VehicleStatus = {
  Available: "available",
  Unavailable: "unavailable",
  Maintenance: "maintenance",
  Retired: "retired",
} as const;

export type VehicleStatus =
  (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const OperationStatus = {
  Draft: "draft",
  Planned: "planned",
  Confirmed: "confirmed",
  InExecution: "in_execution",
  Completed: "completed",
  Cancelled: "cancelled",
} as const;

export type OperationStatus =
  (typeof OperationStatus)[keyof typeof OperationStatus];

export const PassengerExecutionStatus = {
  Programmed: "programmed",
  Assigned: "assigned",
  Transported: "transported",
  Absent: "absent",
  Cancelled: "cancelled",
  Reassigned: "reassigned",
} as const;

export type PassengerExecutionStatus =
  (typeof PassengerExecutionStatus)[keyof typeof PassengerExecutionStatus];

export const AppRole = {
  Admin: "admin",
  Planner: "planner",
  Operator: "operator",
  Viewer: "viewer",
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];
