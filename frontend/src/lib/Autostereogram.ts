import { RawImage } from "@huggingface/transformers";

export type ViewMode = "parallel" | "cross";

export default function generateRandomDotAutostereogram(depthMap: RawImage, patternWidth?: number, maxShiftRatio?: number, paddingWidth?:number, viewMode?: ViewMode): ImageData {
    const {width: srcWidth, height: srcHeight, data: depthData} = depthMap;
    viewMode = viewMode || "parallel";
    patternWidth = patternWidth || Math.floor(srcWidth / 10);
    paddingWidth = paddingWidth || 0;
    maxShiftRatio = maxShiftRatio || 0.3;
    const outputWidth = srcWidth + 2 * paddingWidth;
    const outputHeight = srcHeight;
    const output = new ImageData(outputWidth, outputHeight);
    const outputData = output.data;
}
