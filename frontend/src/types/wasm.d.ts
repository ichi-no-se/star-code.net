export interface CircleSplattingInstance {
    getInputBuffer(): Uint8Array;
    run(numShapes: number, numEpochs: number, radiusMax: number, mode: string): void;
    getDrawImageData(): Uint8Array;
    delete(): void;
}

export interface CircleSplattingModule extends EmscriptenModule {
    CircleSplatting: {
        new(width: number, height: number): CircleSplattingInstance;
    };
}
