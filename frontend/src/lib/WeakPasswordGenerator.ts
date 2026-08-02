interface ModelMeta {
	vocab_size: number;
	embed_dim: number;
	hidden_dim: number;
	max_len: number;
	id_to_char: Record<string, string>;
	sos_token_id: number;
	eos_token_id: number;
	pad_token_id: number;
};

export default class WeakPasswordGenerator {
	private vocabSize : number = 0;
	private embedDim : number = 0;
	private hiddenDim: number = 0;
	private maxLen: number = 0;
	private idToChar: Record<number, string> = {};
	private charToId: Record<string, number> = {};
	private vocab: string[] = [];
	private sosTokenId: number = 0;
	private eosTokenId: number = 0;
	private padTokenId: number = 0;
	private weights: Record<string, Float32Array> = {};
	private isLoaded: boolean = false;

	async load(metaUrl: string, weightsUrl: string) {
		const metaResponse = await fetch(metaUrl);
		const meta: ModelMeta = await metaResponse.json();
		this.vocabSize = meta.vocab_size;
		this.embedDim = meta.embed_dim;
		this.hiddenDim = meta.hidden_dim;
		this.maxLen = meta.max_len;
		this.idToChar = Object.fromEntries(Object.entries(meta.id_to_char).map(([k, v]) => [parseInt(k), v]));
		this.charToId = Object.fromEntries(Object.entries(this.idToChar).map(([k, v]) => [v, parseInt(k)]));
		this.vocab = Object.values(this.idToChar);
		this.sosTokenId = meta.sos_token_id;
		this.eosTokenId = meta.eos_token_id;
		this.padTokenId = meta.pad_token_id;

		const weightsResponse = await fetch(weightsUrl);
		const buffer = await weightsResponse.arrayBuffer();
		const fullWeightArray = new Float32Array(buffer);

		let offset = 0;
		const take = (size: number) => {
			const view = fullWeightArray.subarray(offset, offset + size);
			offset += size;
			return view;
		};

		this.weights = {
			"embed": take(this.vocabSize * this.embedDim),
			"w_ih_l0": take(this.hiddenDim * (this.embedDim + 1)),
			"w_hh_l0": take(this.hiddenDim * this.hiddenDim),
			"b_ih_l0": take(this.hiddenDim),
			"b_hh_l0": take(this.hiddenDim),
			"w_ih_l1": take(this.hiddenDim * this.hiddenDim),
			"w_hh_l1": take(this.hiddenDim * this.hiddenDim),
			"b_ih_l1": take(this.hiddenDim),
			"b_hh_l1": take(this.hiddenDim),
			"fc_w": take(this.vocabSize * this.hiddenDim),
			"fc_b": take(this.vocabSize),
		};
		this.isLoaded = true;
	}

	public getVocab(): string[] {
		return this.vocab;
	}

	public isValidPrefix(prefix: string): boolean {
		for (const char of prefix) {
			if (!(char in this.charToId)) {
				return false;
			}
		}
		return true;
	}

	generate(targetLen: number, temp: number = 1.0, prefix: string = ""): string {
		if (!this.isLoaded) {
			throw new Error("Model not loaded");
		}
		if (!this.isValidPrefix(prefix)) {
			throw new Error("Invalid prefix");
		}
		if (prefix.length > targetLen) {
			prefix = prefix.substring(0, targetLen);
		}

		let h0: Float32Array = new Float32Array(this.hiddenDim).fill(0);
		let h1: Float32Array = new Float32Array(this.hiddenDim).fill(0);
		let generated = "";
		let currentTokenId = this.sosTokenId;

		for (let i = 0; i < targetLen; i++) {
			const normLen = (targetLen - i) / this.maxLen;
			const { h0: newH0, h1: newH1, logits } = this.forward(currentTokenId, normLen, h0, h1);
			h0 = newH0;
			h1 = newH1;
			if (i < prefix.length) {
				generated += prefix[i];
				currentTokenId = this.charToId[prefix[i]];
			}
			else {
				logits[this.padTokenId] = -Infinity; // Prevent padding token
				logits[this.sosTokenId] = -Infinity; // Prevent start token
				logits[this.eosTokenId] = -Infinity; // Prevent end token
				const nextTokenId = this.sample(logits, temp);
				currentTokenId = nextTokenId;
				if (this.idToChar[nextTokenId]) {
					generated += this.idToChar[nextTokenId];
				}
			}
		}
		return generated;
	}

	private sample(logits: Float32Array, temp: number): number {
		let maxLogit = -Infinity;
		for (let i = 0; i < logits.length; i++) {
			maxLogit = Math.max(maxLogit, logits[i]);
		}
		let sumExp = 0;
		const probs = new Float32Array(logits.length);
		for (let i = 0; i < logits.length; i++) {
			if (logits[i] === -Infinity) {
				probs[i] = 0;
			}
			else {
				const expVal = Math.exp((logits[i] - maxLogit) / temp);
				probs[i] = expVal;
				sumExp += expVal;
			}
		}
		if (sumExp === 0) {
			// If all probabilities are zero (which shouldn't happen), return a random index
			return Math.floor(Math.random() * logits.length);
		}

		const r = Math.random();
		let cumulative = 0;
		for (let i = 0; i < probs.length; i++) {
			cumulative += probs[i] / sumExp;
			if (r < cumulative) {
				return i;
			}
		}
		return probs.length - 1; // Fallback
	}

	private forward(charId: number, normLen: number, h0: Float32Array, h1: Float32Array): {
		h0: Float32Array, h1: Float32Array, logits: Float32Array
	} {
		const x0 = new Float32Array(this.embedDim + 1);
		for (let i = 0; i < this.embedDim; i++) {
			x0[i] = this.weights["embed"][charId * this.embedDim + i];
		}
		x0[this.embedDim] = normLen;
		const x_ih_0 = this.linear(x0, this.weights["w_ih_l0"], this.weights["b_ih_l0"], this.embedDim + 1, this.hiddenDim);
		const h_hh_0 = this.linear(h0, this.weights["w_hh_l0"], this.weights["b_hh_l0"], this.hiddenDim, this.hiddenDim);
		const h0_new = new Float32Array(this.hiddenDim);
		for (let i = 0; i < this.hiddenDim; i++) {
			h0_new[i] = Math.tanh(x_ih_0[i] + h_hh_0[i]);
		}
		const x_ih_1 = this.linear(h0_new, this.weights["w_ih_l1"], this.weights["b_ih_l1"], this.hiddenDim, this.hiddenDim);
		const h_hh_1 = this.linear(h1, this.weights["w_hh_l1"], this.weights["b_hh_l1"], this.hiddenDim, this.hiddenDim);
		const h1_new = new Float32Array(this.hiddenDim);
		for (let i = 0; i < this.hiddenDim; i++) {
			h1_new[i] = Math.tanh(x_ih_1[i] + h_hh_1[i]);
		}
		const logits = this.linear(h1_new, this.weights["fc_w"], this.weights["fc_b"], this.hiddenDim, this.vocabSize);
		return { h0: h0_new, h1: h1_new, logits };
	}

	private linear(input: Float32Array, weight: Float32Array, bias: Float32Array, inputDim: number, outDim: number): Float32Array {
		const out = new Float32Array(outDim);
		for (let i = 0; i < outDim; i++) {
			let sum = bias[i];
			for (let j = 0; j < inputDim; j++) {
				sum += input[j] * weight[i * inputDim + j];
			}
			out[i] = sum;
		}
		return out;
	}
}