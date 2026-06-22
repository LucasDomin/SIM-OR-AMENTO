// Converte base64 (sem prefixo data:) para Uint8Array — usado pelo docx ImageRun.
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Gera uma imagem PNG (dataURL) da logo SIM a partir do SVG renderizado na página.
// Recorta o viewBox para focar apenas na área da logo (sem espaço vazio extra).
export async function getLogoDataUrl(scale = 4): Promise<string | null> {
  try {
    const svgEl = document.querySelector('svg[aria-label="SIM — Still In Movement"]') as SVGSVGElement | null;
    if (!svgEl) return null;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    // Garante cor preta na logo
    clone.querySelectorAll('path').forEach((p) => p.setAttribute('fill', '#0a0a0a'));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Recorta o viewBox para a área exata da logo (do "S" até o fim da barra)
    // viewBox original: 0 0 1192 380. A logo vai de ~0 a ~1192, barra termina em y=334.
    clone.setAttribute('viewBox', '0 0 1192 340');
    clone.setAttribute('width', '1192');
    clone.setAttribute('height', '340');

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const dataUrl = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1192 * scale;
          canvas.height = 340 * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });

    return dataUrl;
  } catch {
    return null;
  }
}
