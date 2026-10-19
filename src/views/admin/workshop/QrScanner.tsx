import React, { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Box } from '@chakra-ui/react';

interface QrScannerProps {
    onScan: (result: string) => void;
    onError?: (err: string) => void;
    active: boolean;
}

const SCANNER_ID = 'ybs-qr-scanner';

export default function QrScanner({ onScan, onError, active }: QrScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isRunning = useRef(false);
    const hasFired = useRef(false);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current && isRunning.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (_) {}
            isRunning.current = false;
        }
    }, []);

    useEffect(() => {
        if (!active) {
            stopScanner();
            return;
        }

        hasFired.current = false;
        const qr = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = qr;

        qr.start(
            { facingMode: 'environment' },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1,
            },
            (decodedText) => {
                if (hasFired.current) return;
                hasFired.current = true;
                stopScanner().then(() => onScan(decodedText));
            },
            (_errorMsg) => {
                // scanning in progress — ignore individual frame errors
            }
        ).then(() => {
            isRunning.current = true;
        }).catch((err: any) => {
            const msg = err?.message ?? String(err);
            if (onError) onError(msg);
        });

        return () => {
            stopScanner();
        };
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Box
            id={SCANNER_ID}
            w="100%"
            maxW="320px"
            mx="auto"
            borderRadius="16px"
            overflow="hidden"
            sx={{
                '& video': { borderRadius: '16px', width: '100%' },
                '& canvas': { borderRadius: '16px' },
            }}
        />
    );
}
