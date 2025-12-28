import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, QrCode, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface QRCodeCardProps {
  title: string;
  subtitle: string;
  url: string;
  code: string;
}

export const QRCodeCard = ({ title, subtitle, url, code }: QRCodeCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${code}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `qrcode-${code}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
    toast({
      title: "QR Code baixado!",
      description: "O arquivo foi salvo no seu dispositivo.",
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-start gap-4">
        <div className="bg-white p-3 rounded-lg border border-border">
          <QRCodeSVG
            id={`qr-${code}`}
            value={url}
            size={120}
            level="H"
            includeMargin={false}
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          <div className="mt-3 p-2 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Código:</p>
            <p className="font-mono font-medium text-foreground">{code}</p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" />
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Baixar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
