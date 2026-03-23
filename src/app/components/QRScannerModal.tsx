import { useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, X } from "lucide-react";

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

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;

    if (isOpen) {
      const startScanner = async () => {
        try {
          scanner = new Html5Qrcode("qr-reader");
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
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
            (errorMessage) => {
              // Silently ignore scan errors
            }
          );
        } catch (err) {
          console.error("Failed to start scanner:", err);
        }
      };

      // Small timeout to ensure DOM element exists
      const timer = setTimeout(startScanner, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(e => console.error("Failed to stop scanner on cleanup", e));
        }
      };
    }
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
        <div className="p-4 border-b flex items-center justify-between" style={{ background: "#F9FAFB" }}>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5" style={{ color: "#C6A75E" }} />
            <h3 className="font-bold text-gray-800" style={{ fontFamily: "Times New Roman, serif" }}>Scan Booking QR</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6">
          <div id="qr-reader" className="overflow-hidden rounded-xl border-2 border-dashed border-gray-200" />
          <p className="text-center text-xs text-gray-500 mt-4 px-4">
            Point your camera at the guest's booking QR code.
          </p>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
