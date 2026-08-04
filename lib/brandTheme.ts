/**
 * Plain hex/string constants mirrored from `app/globals.css`'s CSS custom properties. CSS itself
 * can't be shared between the site, the PDF (`@react-pdf/renderer`'s `StyleSheet.create()`, a
 * JS/Yoga-flexbox subset of CSS with no cascading) and the email (plain inline-styled HTML, since
 * external stylesheets aren't reliable across email clients) — but the underlying values can, so a
 * palette/font change only has to happen here.
 */
export const brandColors = {
  gold: "#c9a877",
  ink: "#2b2926",
  inkSoft: "#3d3a34",
  muted: "#4a453d",
  mutedLight: "#6b6459",
  taupe: "#8a7a63",
  taupeLight: "#8a8477",
  bg: "#f3f1ed",
  bgAlt: "#faf8f4",
  border: "#e6e0d3",
} as const;

export const brandFonts = {
  /** Script/display font used for the couple's names — self-hosted, registrable in the PDF. */
  display: "Slight",
  /** Body/label font — self-hosted, registrable in the PDF. */
  label: "Poppins",
} as const;
