
export function getImageDataFromImage(image: HTMLImageElement): ImageData {
	const canvas = document.createElement("canvas");
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas context is not available");
	ctx.drawImage(image, 0, 0);
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function rgbToHsv(red: number, green: number, blue: number): [number, number, number] {
	const r = red / 255;
	const g = green / 255;
	const b = blue / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const v = max;

	const delta = max - min;
	s = max === 0 ? 0 : delta / max;
	if (delta === 0) {
		h = 0;
	} else if (r === max) {
		h = 60 * ((g - b) / delta);
	} else if (g === max) {
		h = 60 * (2 + (b - r) / delta);
	} else {
		h = 60 * (4 + (r - g) / delta);
	}
	if (h < 0) h += 360;
	return [h, s, v];
}

export function downloadImageData(imageData:ImageData, filename: string): void {
	const canvas = document.createElement("canvas");
	canvas.width = imageData.width;
	canvas.height = imageData.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas context is not available");
	ctx.putImageData(imageData, 0, 0);
	const link = document.createElement("a");
	link.href = canvas.toDataURL("image/png");
	link.download = filename;
	link.click();
}