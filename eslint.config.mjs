import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      "coverage/**",
      ".data/**",
    ],
  },
  {
    rules: {
      // Fetch async en mount es patrón válido en páginas cliente de esta app.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
