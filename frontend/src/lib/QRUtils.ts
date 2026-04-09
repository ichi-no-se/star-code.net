import { EncodeHintType, QRCodeWriter,BarcodeFormat } from "@zxing/library";
import ErrorCorrectionLevel from "@zxing/library/esm/core/qrcode/decoder/ErrorCorrectionLevel";

const writer = new QRCodeWriter();

export const encodeToBooleanMatrix = (text:string, level: 'L' | 'M' | 'Q' | 'H' = 'L'): boolean[][] => {
    const hints = new Map();
    let errorCorrectionLevel;
    switch (level) {
        case 'L':
            errorCorrectionLevel = ErrorCorrectionLevel.L;
            break;
        case 'M':
            errorCorrectionLevel = ErrorCorrectionLevel.M;
            break;
        case 'Q':
            errorCorrectionLevel = ErrorCorrectionLevel.Q;
            break;
        case 'H':
            errorCorrectionLevel = ErrorCorrectionLevel.H;
            break;
    }
    hints.set(EncodeHintType.ERROR_CORRECTION, errorCorrectionLevel);
    hints.set(EncodeHintType.MARGIN, 0); // 余白なし

    const bitMatrix = writer.encode(text,BarcodeFormat.QR_CODE, 0, 0, hints);
    const size = bitMatrix.getWidth();
    const matrix: boolean[][] = [];
    for (let y = 0; y < size; y++) {
        const row: boolean[] = [];
        for (let x = 0; x < size; x++) {
            row.push(bitMatrix.get(x, y));
        }
        matrix.push(row);
    }
    return matrix;
}
