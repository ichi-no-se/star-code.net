export interface CircleSplattingInstance {
    getInputBuffer(): Uint8Array;
    run(numCircles: number, numEpochs: number, radiusMax: number): void;
    getDrawImageData(): Uint8Array;
    delete(): void;
}

export interface CircleSplattingModule extends EmscriptenModule {
    CircleSplatting: {
        new (width: number, height: number): CircleSplattingInstance;
    };
}
