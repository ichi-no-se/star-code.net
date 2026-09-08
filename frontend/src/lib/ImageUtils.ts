
export function getImageDataFromImage(image: HTMLImageElement, newWidth?: number, newHeight?: number, smooth?: boolean): ImageData {
	const canvas = document.createElement("canvas");
	const targetWidth = newWidth ?? image.naturalWidth;
	const targetHeight = newHeight ?? image.naturalHeight;
	canvas.width = targetWidth;
	canvas.height = targetHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas context is not available");
	if (smooth !== undefined) {
		ctx.imageSmoothingEnabled = smooth;
		if (smooth) {
			ctx.imageSmoothingQuality = "high";
		}
	}
	ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
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


export function hsvToRgb(hue: number, saturation: number, value: number): [number, number, number] {
	hue = (hue % 360 + 360) % 360;
	const c = value * saturation;
	const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
	const m = value - c;

	let r = 0, g = 0, b = 0;

	if (hue >= 0 && hue < 60) {
		r = c; g = x; b = 0;
	} else if (hue >= 60 && hue < 120) {
		r = x; g = c; b = 0;
	} else if (hue >= 120 && hue < 180) {
		r = 0; g = c; b = x;
	} else if (hue >= 180 && hue < 240) {
		r = 0; g = x; b = c;
	} else if (hue >= 240 && hue < 300) {
		r = x; g = 0; b = c;
	} else {
		r = c; g = 0; b = x;
	}

	return [
		(r + m) * 255,
		(g + m) * 255,
		(b + m) * 255
	];
}

export function downloadImageData(imageData: ImageData, filename: string): void {
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