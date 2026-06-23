// Converte base64 (sem prefixo data:) para Uint8Array — usado pelo docx ImageRun.
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Dimensões da logo (viewBox completo + margem de segurança para não cortar nada).
// O traçado da assinatura "Sim" tem leve sombra/curvas que extrapolam o viewBox.
const LOGO_VB_W = 1192;
const LOGO_VB_H = 380;
const LOGO_PAD = 24; // margem de respiro em unidades de viewBox
export const LOGO_ASPECT = (LOGO_VB_W + LOGO_PAD * 2) / (LOGO_VB_H + LOGO_PAD * 2);

// Gera uma imagem PNG (dataURL) da logo SIM a partir do SVG renderizado na página.
// Usa o viewBox completo com padding para garantir que a logo NUNCA seja cortada.
export async function getLogoDataUrl(scale = 4): Promise<string | null> {
  try {
    const svgEl = document.querySelector('svg[aria-label="SIM — Still In Movement"]') as SVGSVGElement | null;
    if (!svgEl) return null;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    // Garante cor preta na logo
    clone.querySelectorAll('path').forEach((p) => p.setAttribute('fill', '#0a0a0a'));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // viewBox completo com padding em todos os lados (evita corte de qualquer traço)
    const vbX = -LOGO_PAD;
    const vbY = -LOGO_PAD;
    const vbW = LOGO_VB_W + LOGO_PAD * 2;
    const vbH = LOGO_VB_H + LOGO_PAD * 2;
    clone.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
    clone.setAttribute('width', String(vbW));
    clone.setAttribute('height', String(vbH));
    clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const dataUrl = await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = vbW * scale;
          canvas.height = vbH * scale;
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
