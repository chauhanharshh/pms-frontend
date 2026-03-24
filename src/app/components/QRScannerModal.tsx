import { useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, X, Camera } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";

export function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;

    if (isOpen) {
      const startScanner = async () => {
        try {
          // Adjust QR box size based on device
          const qrBoxSize = isMobile ? 220 : 250;

          scanner = new Html5Qrcode("qr-reader");
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 15, // Slightly higher FPS for smoother scanning
              qrbox: { width: qrBoxSize, height: qrBoxSize },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (scanner) {
                scanner.stop().then(() => {
                  onScanSuccess(decodedText);
                }).catch(err => {
                  console.error("Failed to stop scanner after success", err);
                  onScanSuccess(decodedText);
                });
              }
            },
            () => {}
          );
        } catch (err) {
          console.error("Failed to start scanner:", err);
        }
      };

      const timer = setTimeout(startScanner, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(e => console.error("Failed to stop scanner on cleanup", e));
        }
      };
    }
  }, [isOpen, onScanSuccess, isMobile]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/90 ${isMobile ? '' : 'p-4'}`}>
      <div className={`bg-white overflow-hidden relative shadow-2xl transition-all duration-300 ${isMobile ? 'w-full h-full' : 'rounded-2xl w-full max-w-md'}`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isMobile ? 'pt-10' : ''}`} style={{ background: "#F9FAFB" }}>
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <QrCode className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-none">QR Scanner</h3>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Scan Check-In Code</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Scanner View */}
        <div className={`flex flex-col items-center justify-center ${isMobile ? 'h-[calc(100%-180px)]' : 'p-8'}`}>
          <div className="relative w-full max-w-[300px] aspect-square">
             {/* Corner Accents */}
             <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-lg z-10"></div>
             <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-lg z-10"></div>
             <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-lg z-10"></div>
             <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-lg z-10"></div>

             <div id="qr-reader" className="w-full h-full overflow-hidden rounded-xl bg-black border-2 border-amber-100/20 shadow-inner" />
          </div>
          
          <div className="mt-8 px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase mb-3">
              <Camera className="w-3 h-3" />
              Live Scanner Enabled
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Align the QR code within the frame
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Check-in will start automatically upon successful scan
            </p>
          </div>
        </div>

        {/* Footer/Action */}
        <div className={`absolute bottom-0 left-0 right-0 p-6 bg-white border-t flex flex-col gap-3 ${isMobile ? 'pb-10' : ''}`}>
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all"
          >
            CLOSE SCANNER
          </button>
        </div>
      </div>
    </div>
  );
}
