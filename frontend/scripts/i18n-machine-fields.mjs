// Stable code values are not prose. Keep them out of translation catalogs and
// restore them from the English schema on import. Values inside arrays use
// null placeholders so parallel array positions remain stable.
export const isMachineField = (path) =>
  /\.(?:id|state|group|campaignId|instrumentClass|instrumentSeniority)$/.test(path) ||
  /profiles\.list\[\d+\]\.country$/.test(path) ||
  /\.(?:seniorityStates|instrumentOverlays)(?:\[\d+\])?$/.test(path);
