// Debug/comparison switch: TWT.setLegacyArt(true) renders the ORIGINAL art (procedural painters and
// legacy palette-string sprites) through the same renderer, so before/after captures are framed and
// lit identically. Never enabled in normal play.
// TWT.setLegacyParallax(true) keeps everything native except the parallax layers and the train,
// for comparing just those.
export const artMode = { legacy: false, legacyParallax: false };
