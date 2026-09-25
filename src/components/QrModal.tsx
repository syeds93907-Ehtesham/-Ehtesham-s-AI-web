import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, ExternalLink, X, Smartphone, Wifi } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredCount?: number;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, registeredCount = 0 }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [buzzerUrl, setBuzzerUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // Deep link to buzzer screen
      const url = `${origin}/?view=buzzer`;
      setBuzzerUrl(url);

      QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('QR generation error:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard && buzzerUrl) {
      navigator.clipboard.writeText(buzzerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (qrDataUrl) {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `peace-day-buzzer-qr.png`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/60 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/20 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Projector Ready • Audience Entry
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {registeredCount} Joined
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 font-gaming">
          PLAYER BUZZER QR
        </h2>

        <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-lg mx-auto">
          Scan using any mobile camera or QR reader to enter the live Peace Day Gaming buzzer arena.
        </p>

        {/* QR Code Container */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-purple-900/50 border-4 border-purple-400/40 transform hover:scale-[1.01] transition">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Player Buzzer QR Code"
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-xl"
              />
            ) : (
              <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center text-slate-400">
                Generating QR...
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Slogan */}
          <div className="mt-5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-amber-900/40 border border-purple-500/30 font-gaming text-lg sm:text-xl font-bold tracking-widest text-amber-300">
            SCAN → REGISTER → WAIT → BUZZ!
          </div>
        </div>

        {/* Direct Link Banner */}
        <div className="mb-6 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 max-w-md mx-auto text-left">
          <div className="truncate text-xs font-mono text-slate-300">
            {buzzerUrl}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition"
          >
            <Download className="w-4 h-4 text-purple-400" />
            DOWNLOAD QR
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-sm font-semibold transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'LINK COPIED' : 'COPY PLAYER LINK'}
          </button>
          <a
            href={buzzerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition"
          >
            <ExternalLink className="w-4 h-4" />
            OPEN PLAYER PAGE
          </a>
        </div>
      </div>
    </div>
  );
};
