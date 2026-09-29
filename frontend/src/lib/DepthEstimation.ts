import { pipeline, env, RawImage, DepthEstimationPipeline, ProgressCallback, DepthEstimationOutput } from "@huggingface/transformers";

env.localModelPath = "/models";
env.allowLocalModels = true;
env.allowRemoteModels = false;

if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = 1;
}

export default class DepthEstimator {
    private static model: DepthEstimationPipeline | null = null;
    private static loadingPromise: Promise<void> | null = null;

    public static isLoaded(): boolean {
        return DepthEstimator.model !== null;
    }

    public static async loadModel(): Promise<void> {
        if (this.model) return;
        if (this.loadingPromise) return this.loadingPromise;
        this.loadingPromise = (async () => {
            try {
                const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;
                const device = hasWebGPU ? "webgpu" : "wasm";
                this.model = await pipeline("depth-estimation", "depth-anything-v2-small-ONNX", { device, dtype: "q8" });
            }
            finally {
                this.loadingPromise = null;
            }
        })();
        await this.loadingPromise;
    }

    public static async estimate(input: HTMLImageElement | ImageData): Promise<RawImage> {
        if (!this.model) throw new Error("Depth estimation model is not loaded.");
        let rawImage: RawImage;
        if (input instanceof HTMLImageElement) {
            rawImage = await RawImage.read(input.src);
        }
        else {
            rawImage = new RawImage(
                new Uint8Array(input.data.buffer),
                input.width,
                input.height,
                4
            );
        }
        const result = await this.model(rawImage);
        const depthMap = result.depth;
        return depthMap;
    }
}
