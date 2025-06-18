type LayerParams = {
    weight: Float32Array[];
    bias: Float32Array;
}

type ModelParams = {
    fc1: LayerParams;

    fc2: LayerParams;
    fc3: LayerParams;
}

let cachedModel: ModelParams | null = null;

async function loadModel(): Promise<ModelParams> {
    if (cachedModel) return cachedModel;
    const weightsResponse = await fetch("/digit-classification/model_weights.bin");
    if (!weightsResponse.ok) {
        throw new Error("Failed to load model weights");
    }
    const weightsBuffer = await weightsResponse.arrayBuffer();
    const weights = new Float32Array(weightsBuffer);

    const shapesResponse = await fetch("/digit-classification/model_shapes.json");
    if (!shapesResponse.ok) {
        throw new Error("Failed to load model shapes");
    }
    const shapes = await shapesResponse.json();

    if (!shapes || !shapes.fc1 || !shapes.fc2 || !shapes.fc3) {
        throw new Error("Invalid model shapes");
    }

    let offset = 0;
    function extractWeight1D(shape: number[]): Float32Array {
        if (shape.length !== 1) {
            throw new Error("Invalid weight shape for 1D extraction");
        }
        const size = shape[0];
        const weight = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            weight[i] = weights[offset];
            offset++;
        }
        return weight;
    }
    function extractWeight2D(shape: number[]): Float32Array[] {
        if (shape.length !== 2) {
            throw new Error("Invalid weight shape for 2D extraction");
        }
        const rows = shape[0];
        const cols = shape[1];
        const weight: Float32Array[] = Array.from({ length: rows }, () => new Float32Array(cols));
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                weight[i][j] = weights[offset];
                offset++;
            }
        }
        return weight;
    }
    cachedModel = {
        fc1: {
            weight: extractWeight2D(shapes.fc1.weight),
            bias: extractWeight1D(shapes.fc1.bias)
        },
        fc2: {
            weight: extractWeight2D(shapes.fc2.weight),
            bias: extractWeight1D(shapes.fc2.bias)
        },
        fc3: {
            weight: extractWeight2D(shapes.fc3.weight),
            bias: extractWeight1D(shapes.fc3.bias)
        }
    };
    return cachedModel;
}

export default async function predictDigit(input: number[][]): Promise<number[]> {
    const model = await loadModel();
    if (!model) {
        throw new Error("Model not loaded");
    }
    if (input.length !== 28 || input[0].length !== 28) {
        throw new Error("Input must be a 28x28 matrix");
    }


    function relu(x: Float32Array): Float32Array {
        return x.map(v => v < 0 ? 0 : v);
    }
    function softmax(x: Float32Array): Float32Array {
        const max = Math.max(...x);
        const exps = x.map(v => Math.exp(v - max));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        return exps.map(v => v / sumExps);
    }
    function matmul(weight: Float32Array[], input: Float32Array): Float32Array {
        if (weight.length === 0 || weight[0].length !== input.length) {
            throw new Error("Invalid weight or input dimensions for matmul");
        }
        const output: Float32Array = new Float32Array(weight.length);
        for (let i = 0; i < weight.length; i++) {
            for (let j = 0; j < input.length; j++) {
                output[i] += weight[i][j] * input[j];
            }
        }
        return output;
    }

    // Flatten the input
    const flatInput = new Float32Array(input.flat());
    // First layer: fc1
    let output = matmul(model.fc1.weight, flatInput);
    output = output.map((v, i) => v + model.fc1.bias[i]);
    output = relu(output);
    // Second layer: fc2
    output = matmul(model.fc2.weight, output);
    output = output.map((v, i) => v + model.fc2.bias[i]);
    output = relu(output);
    // Third layer: fc3
    output = matmul(model.fc3.weight, output);
    output = output.map((v, i) => v + model.fc3.bias[i]);
    // Apply softmax to the final output
    output = softmax(output);
    return Array.from(output);
}
