import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size?: number;
}

export default function QrCode({ value, size = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 1,
        color: { dark: '#0b0e1a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      },
      () => {
        /* ignorar errores de render */
      },
    );
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
