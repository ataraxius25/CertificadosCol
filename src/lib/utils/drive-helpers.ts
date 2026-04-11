/**
 * Extrae el ID limpio de cualquier formato de URL de Google Drive
 */
export const extractDriveId = (url: string): string | null => {
  if (!url || url === '#') return null;
  // Caso 1: URL tipo /file/d/XXXXX/view
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) return matchD[1];
  // Caso 2: URL tipo uc?id=XXXXX
  const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  // Caso 3: Ya es solo un ID puro
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) return url;
  return null;
};

/**
 * Genera la URL de previsualización de Google Drive
 */
export const getDrivePreviewUrl = (url: string) => {
  const fileId = extractDriveId(url);
  if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
  return url;
};

/**
 * Genera la URL de descarga directa de Google Drive
 */
export const getDriveDownloadUrl = (url: string) => {
  const fileId = extractDriveId(url);
  if (fileId) return `https://drive.google.com/uc?id=${fileId}&export=download`;
  return url;
};
