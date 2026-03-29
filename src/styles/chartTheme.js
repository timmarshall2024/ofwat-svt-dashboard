/**
 * Recharts colour constants — derived from Fox Stephens brand tokens.
 * Recharts requires raw hex strings, not CSS variables.
 */
export const chartTheme = {
  svtColor:      '#F47321',   // fs-highlight (Ibis Orange)
  otherColor:    '#E0E0E0',   // fs-border (muted grey)
  gridColor:     '#E0E0E0',   // fs-border
  refLineColor:  '#005030',   // fs-primary (Sebastian Green)
  ampBandAMP7:   '#f5f8f5',   // very light green
  ampBandAMP8:   '#e6f4ef',   // fs-primary-light
  tooltipBg:     '#FFFFFF',   // fs-surface
  tooltipBorder: '#E0E0E0',   // fs-border
  tooltipText:   '#2D2D2D',   // fs-text-primary

  // Full chart palette (Microsoft Office Colorful Palette 1)
  palette: [
    '#F47321', // SVT always first (Ibis Orange)
    '#2E5F7F', // Teal
    '#DA7842', // Orange
    '#34692E', // Green
    '#489CD0', // Light Blue
    '#93358F', // Purple
    '#65A542', // Light Green
    '#1B394C', // Dark Blue
    '#8E451F', // Brown
    '#1E3F1B', // Deep Forest Green
  ],
}
