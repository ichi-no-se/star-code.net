export interface SimilarityResult {
    kanji: string; similarity: number
}

export class FastTextKanji {
    private vocab: string;
    private vocabMap: Map<string, number>;
    private vectors: Float32Array; // Flattened array of shape [numWords * dim]
    private numWords: number;
    private dim: number | null;

    constructor() {
        this.vocab = "";
        this.vocabMap = new Map();
        this.vectors = new Float32Array();
        this.numWords = 0;
        this.dim = null;
    }

    async loadData(vocabURL: string, vectorURL: string, normalize: boolean = true): Promise<void> {
        const vocabResponse = await fetch(vocabURL);
        if (!vocabResponse.ok) {
            throw new Error("Failed to load vocab");
        }
        const vocabText = await vocabResponse.text();
        this.vocab = vocabText.trim();
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
                const vec = this.vectors.subarray(i * this.dim, (i + 1) * this.dim);
                const normalizedVec = this.normalizeVec(vec);
                if (normalizedVec) {
                    this.vectors.set(normalizedVec, i * this.dim);
                }
            }
        }
    }

    getKanjiVec(n: number): Float32Array | null {
        if (n < 0 || n >= this.numWords || this.dim === null) {
            return null;
        }
        return this.vectors.subarray(n * this.dim, (n + 1) * this.dim);
    }

    getKanjiVecByChar(c: string): Float32Array | null {
        const index = this.vocabMap.get(c);
        if (index === undefined) {
            return null;
        }
        return this.getKanjiVec(index);
    }

    calcSimilarity(normalizedVecA: Float32Array, normalizedVecB: Float32Array): number {
        if (normalizedVecA.length !== normalizedVecB.length) {
            throw new Error("Vector dimensions do not match");
        }
        let dotProduct = 0;
        for (let i = 0; i < normalizedVecA.length; i++) {
            dotProduct += normalizedVecA[i] * normalizedVecB[i];
        }
        return dotProduct;
    }

    normalizeVec(vec: Float32Array): Float32Array | null {
        let norm = 0;
        for (let i = 0; i < vec.length; i++) {
            norm += vec[i] * vec[i];
        }
        norm = Math.sqrt(norm);
        if (norm < 1e-10) {
            return null;
        }
        const normalizedVec = new Float32Array(vec.length);
        for (let i = 0; i < vec.length; i++) {
            normalizedVec[i] = vec[i] / norm;
        }
        return normalizedVec;
    }

    isKanjiInVocab(c: string): boolean {
        return this.vocabMap.has(c);
    }

    getKanji(index: number): string | null {
        if (index < 0 || index >= this.numWords) {
            return null;
        }
        return this.vocab[index];
    }

    getNumWords(): number {
        return this.numWords;
    }

    calcSimilarKanjis(vec: Float32Array, topN: number): SimilarityResult[] | null {
        if (this.dim === null) {
            throw new Error("Model not loaded");
        }
        const similarities: SimilarityResult[] = [];
        const normalizedVec = this.normalizeVec(vec);
        if (!normalizedVec) {
            return null;
        }
        for (let i = 0; i < this.numWords; i++) {
            const kanjiVec = this.getKanjiVec(i);
            if (!kanjiVec) continue;
            const similarity = this.calcSimilarity(normalizedVec, kanjiVec);
            similarities.push({ kanji: this.vocab[i], similarity });
        }
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, topN);
    }
}
