export const optimizeImage = (url: string, width = 800, quality = 75) => {
  if (!url) return url;

  const clean = url.split("?")[0];

  const optimized = clean.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  // Maintain correct aspect ratio (no distortion)
  return `${optimized}?width=${width}&quality=${quality}&resize=contain`;
};
