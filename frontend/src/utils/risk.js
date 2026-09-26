export function riskColor(risk) {
  if (risk === "critical") return "#ff6b6b";
  if (risk === "at-risk") return "#f4b860";
  return "#5ee0a0";
}