'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';

interface CyberQRProps {
  value: string;
  size?: number;
  logo?: string;
}

export const CyberQR: React.FC<CyberQRProps> = ({ 
    value, 
    size = 200, 
    logo = "https://cryptologos.cc/logos/solana-sol-logo.png?v=026" 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [qrCode] = useState<QRCodeStyling | null>(() => {
    if (typeof window === 'undefined') return null;
    return new QRCodeStyling({
        width: size,
        height: size,
        type: 'svg',
        shape: 'square',
        data: value,
        image: logo,
        margin: 0,
        qrOptions: {
            typeNumber: 11,
            mode: 'Byte',
            errorCorrectionLevel: 'H'
        },
        imageOptions: {
            saveAsBlob: true,
            hideBackgroundDots: true,
            imageSize: 0.2,
            margin: 0,
            crossOrigin: "anonymous"
        },
        dotsOptions: {
            type: "extra-rounded",
            color: "#6a1a4c",
            gradient: {
              type: "linear",
              rotation: 45,
              colorStops: [
                  { offset: 0, color: "#9945FF" }, // Purple
                  { offset: 1, color: "#14F195" }  // Green
              ]
            }
        },
        backgroundOptions: {
            color: "transparent",
        },
        cornersSquareOptions: {
            type: "extra-rounded",
            color: "#14F195",
            gradient: {
              type: "linear",
              rotation: 45,
              colorStops: [
                  { offset: 0, color: "#14F195" }, // Green
                  { offset: 1, color: "#9945FF" }  // Purple
              ]
            }
        },
        cornersDotOptions: {
            type: "dot",
            color: "#9945FF",
            gradient: {
              type: "linear",
              rotation: 45,
              colorStops: [
                  { offset: 0, color: "#9945FF" }, // Purple
                  { offset: 1, color: "#14F195" }  // Green
              ]
            }
        }
    });
  });

  useEffect(() => {
    if (!qrCode) return;
    qrCode.append(ref.current || undefined);
  }, [qrCode]);

  useEffect(() => {
    if (!qrCode) return;
    qrCode.update({
      data: value,
      width: size,
      height: size,
      margin: 0,
      imageOptions: {
        saveAsBlob: true,
        hideBackgroundDots: true,
        imageSize: 0.2,
        margin: 0,
        crossOrigin: "anonymous"
      },
      dotsOptions: {
          type: "extra-rounded",
          color: "#6a1a4c",
          gradient: {
              type: "linear",
              rotation: 45,
              colorStops: [
                  { offset: 0, color: "#9945FF" }, // Purple
                  { offset: 1, color: "#14F195" }  // Green
              ]
          }
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#14F195",
        gradient: {
            type: "linear",
            rotation: 45,
            colorStops: [
                { offset: 0, color: "#14F195" },
                { offset: 1, color: "#9945FF" }
            ]
        }
      },
      cornersDotOptions: {
        type: "dot",
        color: "#9945FF",
        gradient: {
            type: "linear",
            rotation: 45,
            colorStops: [
                { offset: 0, color: "#9945FF" },
                { offset: 1, color: "#14F195" }
            ]
        }
      },
      backgroundOptions: {
          color: "transparent"
      }
    });
  }, [value, size, qrCode]);

  return (
    <div ref={ref} className="cyber-qr-container h-full w-full scale-150" />
  );
};
