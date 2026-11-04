import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite fetch del browser vía 127.0.0.1 en desarrollo (Next 16).
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Evita regenerar AGENTS.md en cada `next dev`.
  agentRules: false,
};

export default nextConfig;
