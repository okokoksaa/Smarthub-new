import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, QrCode } from 'lucide-react';
import { useRef } from 'react';

interface DocumentQRCodeProps {
  documentId: string;
  documentName?: string;
  size?: number;
  showActions?: boolean;
}

const DocumentQRCode = ({ 
  documentId, 
  documentName,
  size = 200,
  showActions = true 
}: DocumentQRCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Generate the verification URL
  const verificationUrl = `${window.location.origin}/verify/${documentId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrSvg = qrRef.current?.querySelector('svg');
    if (!qrSvg) return;

    const svgData = new XMLSerializer().serializeToString(qrSvg);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Document QR Code - ${documentName || documentId}</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #166534;
              padding: 30px;
              border-radius: 8px;
            }
            .header {
              color: #166534;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 12px;
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .doc-name {
              font-weight: 600;
              margin-top: 15px;
              color: #333;
            }
            .doc-id {
              font-family: monospace;
              font-size: 10px;
              color: #666;
              margin-top: 5px;
              word-break: break-all;
            }
            .verify-text {
              font-size: 11px;
              color: #888;
              margin-top: 15px;
            }
            @media print {
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Republic of Zambia - CDF Document</div>
            <div class="subtitle">Scan to Verify Authenticity</div>
            <div class="qr-code">${svgData}</div>
            ${documentName ? `<div class="doc-name">${documentName}</div>` : ''}
            <div class="doc-id">ID: ${documentId}</div>
            <div class="verify-text">Visit: ${verificationUrl}</div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownload = () => {
    const qrSvg = qrRef.current?.querySelector('svg');
    if (!qrSvg) return;

    const svgData = new XMLSerializer().serializeToString(qrSvg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 80;
      
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 20, 20, size, size);
        
        // Add text below
        ctx.fillStyle = '#166534';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan to Verify', canvas.width / 2, size + 45);
        
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText(documentId.substring(0, 20) + '...', canvas.width / 2, size + 65);
        
        // Download
        const link = document.createElement('a');
        link.download = `qr-${documentId.substring(0, 8)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Card className="w-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          Verification QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={qrRef}
          className="bg-white p-4 rounded-lg border flex items-center justify-center"
        >
          <QRCode 
            value={verificationUrl}
            size={size}
            level="H"
            bgColor="#ffffff"
            fgColor="#166534"
          />
        </div>
        
        {documentName && (
          <p className="text-sm text-center font-medium text-foreground truncate max-w-[200px]">
            {documentName}
          </p>
        )}
        
        <p className="text-xs text-center text-muted-foreground">
          Scan to verify document authenticity
        </p>

        {showActions && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentQRCode;
