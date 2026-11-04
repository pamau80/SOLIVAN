import { AppRole } from "@/domain/types";
import type { SessionPayload } from "@/lib/auth/types";

export function assertSessionCanWrite(session: SessionPayload) {
  if (session.role === AppRole.Viewer) {
    throw new Error("Rol viewer: solo lectura");
  }
}
