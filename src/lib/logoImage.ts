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
// Usa apenas APIs nativas do navegador (sem html2canvas) para máxima confiabilidade.
export async function getLogoDataUrl(scale = 4): Promise<string | null> {
  try {
    const svgEl = document.querySelector('svg[aria-label="SIM — Still In Movement"]') as SVGSVGElement | null;
    if (!svgEl) return null;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    // Garante cor preta na logo (no app ela usa currentColor branco)
    clone.querySelectorAll('path').forEach((p) => p.setAttribute('fill', '#0a0a0a'));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const vb = svgEl.viewBox.baseVal;
    const w = vb && vb.width ? vb.width : 1192;
    const h = vb && vb.height ? vb.height : 380;
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const dataUrl = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = w * scale;
          canvas.height = h * scale;
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
