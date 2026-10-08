export default class Word2Vec {
    private vocab: string[];
    private vocabMap: Map<string, number>;
    private vectors: Float32Array; // Flattened array of shape [numWords * dim]
    private numWords: number;
    private dim: number | null;

    constructor() {
        this.vocab = [];
        this.vocabMap = new Map();
        this.vectors = new Float32Array();
        this.numWords = 0;
        this.dim = null;
    }

    async loadData(vocabURL: string, vectorURL: string, normalize: boolean): Promise<void> {
        const vocabResponse = await fetch(vocabURL);
        if (!vocabResponse.ok) {
            throw new Error("Failed to load vocab");
        }
        const vocabText = await vocabResponse.text();
        this.vocab = vocabText.split("\n").map(word => word.trim()).filter(word => word.length > 0);
        this.vocabMap.clear();
        for (let i = 0; i < this.vocab.length; i++) {
            this.vocabMap.set(this.vocab[i], i);
        }
        const vectorResponse = await fetch(vectorURL);
        if (!vectorResponse.ok) {
            throw new Error("Failed to load vectors");
        }
        const vectorBuffer = await vectorResponse.arrayBuffer();
        const dataView = new DataView(vectorBuffer);
        let offset = 0;
        const numWords = dataView.getInt32(offset, true);
        offset += 4;
        if (numWords !== this.vocab.length) {
            throw new Error("Vocab size and vector count do not match");
        }
        this.numWords = numWords;
        this.dim = dataView.getInt32(offset, true);
        offset += 4;
        this.vectors = new Float32Array(numWords * this.dim);
        for (let i = 0; i < numWords * this.dim; i++) {
            this.vectors[i] = dataView.getFloat32(offset, true);
            offset += 4;
        }
        if (normalize) {
            for (let i = 0; i < numWords; i++) {
                let norm = 0;
                for (let j = 0; j < this.dim; j++) {
                    const val = this.vectors[i * this.dim + j];
                    norm += val * val;
                }
                norm = Math.sqrt(norm);
                if (norm > 0) {
                    for (let j = 0; j < this.dim; j++) {
                        this.vectors[i * this.dim + j] /= norm;
                    }
                }
            }
        }
    }

    calcSimilarity(vecA: Float32Array, vecB: Float32Array): number {
        let dotProduct = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
        }
        return dotProduct;
    }

    getWordVec(word: string): Float32Array | null {
        const index = this.vocabMap.get(word);
        if (index === undefined || this.dim === null) {
            return null;
        }
        return this.vectors.subarray(index * this.dim, (index + 1) * this.dim);
    }

    getWordVecByIndex(index: number): Float32Array | null {
        if (index < 0 || index >= this.numWords || this.dim === null) {
            return null;
        }
        return this.vectors.subarray(index * this.dim, (index + 1) * this.dim);
    }

    getWordIndex(word: string): number | null {
        const index = this.vocabMap.get(word);
        return index !== undefined ? index : null;
    }

    isWordInVocab(word: string): boolean {
        return this.vocabMap.has(word);
    }

    getWordByIndex(index: number): string | null {
        if (index < 0 || index >= this.numWords) {
            return null;
        }
        return this.vocab[index];
    }

    getNumWords(): number {
        return this.numWords;
    }

    getDim(): number | null {
        return this.dim;
    }

    getVocab(): string[] {
        return this.vocab;
    }
}