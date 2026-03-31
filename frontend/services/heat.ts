export function calculateHeatRiskScore({
  temperature,
  humidity,
  populationDensity,
  greenCover,
  aqi
}: {
  temperature: number;
  humidity: number;
  populationDensity: number;
  greenCover: number;
  aqi: number;
}) {
  const score = temperature * 1.35 + humidity * 0.22 + populationDensity / 260 - greenCover * 0.28 + aqi * 0.08;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculateHealthRiskScore({
  temperature,
  humidity,
  aqi,
  populationDensity
}: {
  temperature: number;
  humidity: number;
  aqi: number;
  populationDensity: number;
}) {
  const score = temperature * 1.22 + humidity * 0.18 + aqi * 0.14 + populationDensity / 320;
  return Math.round(Math.max(0, Math.min(100, score)));
}
