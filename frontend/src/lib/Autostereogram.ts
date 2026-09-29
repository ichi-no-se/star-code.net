import { RawImage } from "@huggingface/transformers";

export type ViewMode = "parallel" | "cross";

class DisjointSetUnion {
    parent: Int32Array; // positive value or 0: parent index, negative value: size of the set
    constructor(size: number) {
        this.parent = new Int32Array(size);
        for (let i = 0; i < size; i++) {
            this.parent[i] = -1;
        }
    }

    find(x: number): number {
        if (this.parent[x] < 0) {
            return x;
        }
        this.parent[x] = this.find(this.parent[x]);
        return this.parent[x];
    }

    union(x: number, y: number): boolean {
        let rootX = this.find(x);
        let rootY = this.find(y);
        if (rootX === rootY) {
            return false;
        }
        if (this.parent[rootX] > this.parent[rootY]) {
            [rootX, rootY] = [rootY, rootX];
        }
        this.parent[rootX] += this.parent[rootY];
        this.parent[rootY] = rootX;
        return true;
    }
}

export default function generateRandomDotAutostereogram(depthMap: RawImage, patternWidth?: number, maxShiftRatio?: number, paddingWidth?: number, viewMode?: ViewMode, addGuideDots?:boolean): ImageData {
    const { width: srcWidth, height, data: depthData } = depthMap;
    viewMode = viewMode || "parallel";
    patternWidth = patternWidth || Math.floor(srcWidth / 10);
    paddingWidth = paddingWidth || 0;
    maxShiftRatio = maxShiftRatio || 0.3;
    addGuideDots = addGuideDots || false;
    const outputWidth = srcWidth + 2 * paddingWidth;
    const output = new ImageData(outputWidth, height);
    const outputData = output.data;
    const sign = viewMode === "parallel" ? -1 : 1;
    for (let y = 0; y < height; y++) {
        const dsu = new DisjointSetUnion(outputWidth);
        for (let x = 0; x < srcWidth; x++) {
            const normalizedDepth = depthData[y * srcWidth + x] / 255;
            const totalSeparation = patternWidth + sign * Math.round(normalizedDepth * maxShiftRatio * patternWidth);
            const left = Math.round(x + paddingWidth - totalSeparation / 2);
            const right = left + totalSeparation;
            if (left >= 0 && right < outputWidth) {
                dsu.union(left, right);
            }
        }
        for (let x = 0; x < outputWidth; x++) {
            const colorValue = Math.round(Math.random()) * 255;
            outputData[(y * outputWidth + x) * 4] = colorValue;
            outputData[(y * outputWidth + x) * 4 + 1] = colorValue;
            outputData[(y * outputWidth + x) * 4 + 2] = colorValue;
            outputData[(y * outputWidth + x) * 4 + 3] = 255;
        }
        for (let x = 0; x < outputWidth; x++) {
            const root = dsu.find(x);
            if (root !== x) {
                outputData[(y * outputWidth + x) * 4] = outputData[(y * outputWidth + root) * 4];
                outputData[(y * outputWidth + x) * 4 + 1] = outputData[(y * outputWidth + root) * 4 + 1];
                outputData[(y * outputWidth + x) * 4 + 2] = outputData[(y * outputWidth + root) * 4 + 2];
                outputData[(y * outputWidth + x) * 4 + 3] = 255;
            }
        }
    }
    if (addGuideDots) {
        const centerX = Math.floor(outputWidth / 2);
        const y = Math.floor(height / 20);
        const dotOuterRadius = Math.floor(height / 120);
        const dotInnerRadius = Math.floor(height / 180);
        const leftX = centerX - Math.floor(patternWidth / 2);
        const rightX = centerX + Math.floor(patternWidth / 2);
        for (let dy = -dotOuterRadius; dy <= dotOuterRadius; dy++) {
            for (let dx = -dotOuterRadius; dx <= dotOuterRadius; dx++) {
                if (dx * dx + dy * dy <= dotOuterRadius * dotOuterRadius) {
                    if (leftX + dx >= 0 && leftX + dx < outputWidth && y + dy >= 0 && y + dy < height) {
                        const index = ((y + dy) * outputWidth + (leftX + dx)) * 4;
                        outputData[index] = 255;
                        outputData[index + 1] = 255;
                        outputData[index + 2] = 255;
                        outputData[index + 3] = 255;
                    }
                    if (rightX + dx >= 0 && rightX + dx < outputWidth && y + dy >= 0 && y + dy < height) {
                        const index = ((y + dy) * outputWidth + (rightX + dx)) * 4;
                        outputData[index] = 255;
                        outputData[index + 1] = 255;
                        outputData[index + 2] = 255;
                        outputData[index + 3] = 255;
                    }
                }
            }
        }
        for (let dy = -dotInnerRadius; dy <= dotInnerRadius; dy++) {
            for (let dx = -dotInnerRadius; dx <= dotInnerRadius; dx++) {
                if (dx * dx + dy * dy <= dotInnerRadius * dotInnerRadius) {
                    if (leftX + dx >= 0 && leftX + dx < outputWidth && y + dy >= 0 && y + dy < height) {
                        const index = ((y + dy) * outputWidth + (leftX + dx)) * 4;
                        outputData[index] = 0;
                        outputData[index + 1] = 0;
                        outputData[index + 2] = 0;
                        outputData[index + 3] = 255;
                    }
                    if (rightX + dx >= 0 && rightX + dx < outputWidth && y + dy >= 0 && y + dy < height) {
                        const index = ((y + dy) * outputWidth + (rightX + dx)) * 4;
                        outputData[index] = 0;
                        outputData[index + 1] = 0;
                        outputData[index + 2] = 0;
                        outputData[index + 3] = 255;
                    }
                }
            }
        }
    }
    return output;
}
