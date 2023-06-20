/**
 * @param {number} r [0, 1]
 * @param {number} g [0, 1]
 * @param {number} b [0, 1]
 * @returns {number[]} [h[0, 1], s[0, 1], l[0, 1]]
 */
export function rgbToHsl(r, g, b) {
	let max = Math.max(r, g, b);
	let min = Math.min(r, g, b);

	let h = 0,
		s = 0,
		l = (min + max) / 2;

	let d = max - min;

	if (d !== 0) {
		s = l === 0 || l === 1 ? 0 : (max - l) / Math.min(l, 1 - l);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
		}

		h /= 6;
	}

	return [h, s, l];
}

/**
 * @param {number} hue [0, 360]
 * @param {number} saturation [0, 1]
 * @param {number} lightness [0, 1]
 * @returns {number[]} [r, g, b]
 */
export function hslToRgb(h, s, l) {
	h = h % 360;

	s = s / 100;
	l = l / 100;

	let chroma = (1 - Math.abs(2 * l - 1)) * s;

	let huePrime = h / 60;
	let x = chroma * (1 - Math.abs((huePrime % 2) - 1));
	let m = l - chroma / 2;

	let r, g, b;
	if (huePrime < 1) {
		r = chroma;
		g = x;
		b = 0;
	} else if (huePrime < 2) {
		r = x;
		g = chroma;
		b = 0;
	} else if (huePrime < 3) {
		r = 0;
		g = chroma;
		b = x;
	} else if (huePrime < 4) {
		r = 0;
		g = x;
		b = chroma;
	} else if (huePrime < 5) {
		r = x;
		g = 0;
		b = chroma;
	} else {
		r = chroma;
		g = 0;
		b = x;
	}

	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return [r, g, b];
}

/**
 * @param {string} digits length of either 3, 4, 6, or 8
 * @returns {number[]} [r, g, b[, a]]
 */
export function hexToRgb(digits) {
	let n = parseInt(digits, 16);
	let r, g, b, a;
	if (digits.length == 6) {
		r = (n >> 16) & 255;
		g = (n >> 8) & 255;
		b = n & 255;

		return [r, g, b];
	} else if (digits.length == 8) {
		r = (n >> 24) & 255;
		g = (n >> 16) & 255;
		b = (n >> 8) & 255;
		a = n & 255;
	} else {
		if (digits.length == 3) {
			r = (n >> 8) & 15;
			g = (n >> 4) & 15;
			b = n & 15;
		} else if (digits.length == 4) {
			r = (n >> 12) & 15;
			g = (n >> 8) & 15;
			b = (n >> 4) & 15;
			a = n & 15;
		}
		r = (r << 4) | r;
		g = (g << 4) | g;
		b = (b << 4) | b;
		if (digits.length == 3) return [r, g, b];
		a = (a << 4) | a;
	}
	return [r, g, b, a];
}

/**
 * @param {number} h
 * @param {number} w [0, 100]
 * @param {number} b [0, 100]
 * @returns {number[]}
 */
export function hwbToRgb(hue, white, black) {
	white /= 100;
	black /= 100;
	if (white + black >= 1) {
		let gray = white / (white + black);
		return [gray, gray, gray];
	}
	let rgb = hslToRgb(hue, 100, 50);
	rgb[0] /= 255;
	rgb[1] /= 255;
	rgb[2] /= 255;
	for (let i = 0; i < 3; i++) {
		rgb[i] *= 1 - white - black;
		rgb[i] += white;
	}
	rgb[0] *= 255;
	rgb[1] *= 255;
	rgb[2] *= 255;
	return rgb;
}

export function cmykToRgb(c, m, y, k) {
	c = c / 100;
	m = m / 100;
	y = y / 100;
	k = k / 100;

	var r = 255 * (1 - c) * (1 - k);
	var g = 255 * (1 - m) * (1 - k);
	var b = 255 * (1 - y) * (1 - k);

	return [Math.round(r), Math.round(g), Math.round(b)];
}

export function labToRgb(l, a, b) {
	return xyz2rgb(lab2xyz({ l, a, b }));
}

let refX = 0.95047,
	refY = 1.0,
	refZ = 1.08883;
export function lab2xyz(lab, xyz = {}) {
	let { l, a, b, alpha } = lab;

	let y = (l + 16) / 116;
	let x = a / 500 + y;
	let z = y - b / 200;

	x = x ** 3 > 0.008856 ? x ** 3 : (x - 16 / 116) / 7.787;
	y = y ** 3 > 0.008856 ? y ** 3 : (y - 16 / 116) / 7.787;
	z = z ** 3 > 0.008856 ? z ** 3 : (z - 16 / 116) / 7.787;

	x *= refX;
	y *= refY;
	z *= refZ;

	xyz.x = x;
	xyz.y = y;
	xyz.z = z;
	xyz.a = alpha;
	return xyz;
}

export function xyz2rgb(xyz, rgb = {}) {
	let { x, y, z, a } = xyz;

	let r = x * 3.2406255 + y * -1.537208 + z * -0.4986286;
	let g = x * -0.9689307 + y * 1.8757561 + z * 0.0415175;
	let b = x * 0.0557101 + y * -0.2040211 + z * 1.0569959;

	r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : 12.92 * r;
	g = g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : 12.92 * g;
	b = b > 0.0031308 ? 1.055 * b ** (1 / 2.4) - 0.055 : 12.92 * b;

	r *= 255;
	g *= 255;
	b *= 255;
	rgb.r = r;
	rgb.g = g;
	rgb.b = b;
	rgb.a = a;
	return rgb;
}

const namedColors = {
	aliceblue: [240, 248, 255],
	antiquewhite: [250, 235, 215],
	aqua: [0, 255, 255],
	aquamarine: [127, 255, 212],
	azure: [240, 255, 255],
	beige: [245, 245, 220],
	bisque: [255, 228, 196],
	black: [0, 0, 0],
	blanchedalmond: [255, 235, 205],
	blue: [0, 0, 255],
	blueviolet: [138, 43, 226],
	brown: [165, 42, 42],
	burlywood: [222, 184, 135],
	cadetblue: [95, 158, 160],
	chartreuse: [127, 255, 0],
	chocolate: [210, 105, 30],
	coral: [255, 127, 80],
	cornflowerblue: [100, 149, 237],
	cornsilk: [255, 248, 220],
	crimson: [220, 20, 60],
	cyan: [0, 255, 255],
	darkblue: [0, 0, 139],
	darkcyan: [0, 139, 139],
	darkgoldenrod: [184, 134, 11],
	darkgray: [169, 169, 169],
	darkgreen: [0, 100, 0],
	darkgrey: [169, 169, 169],
	darkkhaki: [189, 183, 107],
	darkmagenta: [139, 0, 139],
	darkolivegreen: [85, 107, 47],
	darkorange: [255, 140, 0],
	darkorchid: [153, 50, 204],
	darkred: [139, 0, 0],
	darksalmon: [233, 150, 122],
	darkseagreen: [143, 188, 143],
	darkslateblue: [72, 61, 139],
	darkslategray: [47, 79, 79],
	darkslategrey: [47, 79, 79],
	darkturquoise: [0, 206, 209],
	darkviolet: [148, 0, 211],
	deeppink: [255, 20, 147],
	deepskyblue: [0, 191, 255],
	dimgray: [105, 105, 105],
	dimgrey: [105, 105, 105],
	dodgerblue: [30, 144, 255],
	firebrick: [178, 34, 34],
	floralwhite: [255, 250, 240],
	forestgreen: [34, 139, 34],
	fuchsia: [255, 0, 255],
	gainsboro: [220, 220, 220],
	ghostwhite: [248, 248, 255],
	gold: [255, 215, 0],
	goldenrod: [218, 165, 32],
	gray: [128, 128, 128],
	green: [0, 128, 0],
	greenyellow: [173, 255, 47],
	grey: [128, 128, 128],
	honeydew: [240, 255, 240],
	hotpink: [255, 105, 180],
	indianred: [205, 92, 92],
	indigo: [75, 0, 130],
	ivory: [255, 255, 240],
	khaki: [240, 230, 140],
	lavender: [230, 230, 250],
	lavenderblush: [255, 240, 245],
	lawngreen: [124, 252, 0],
	lemonchiffon: [255, 250, 205],
	lightblue: [173, 216, 230],
	lightcoral: [240, 128, 128],
	lightcyan: [224, 255, 255],
	lightgoldenrodyellow: [250, 250, 210],
	lightgray: [211, 211, 211],
	lightgreen: [144, 238, 144],
	lightgrey: [211, 211, 211],
	lightpink: [255, 182, 193],
	lightsalmon: [255, 160, 122],
	lightseagreen: [32, 178, 170],
	lightskyblue: [135, 206, 250],
	lightslategray: [119, 136, 153],
	lightslategrey: [119, 136, 153],
	lightsteelblue: [176, 196, 222],
	lightyellow: [255, 255, 224],
	lime: [0, 255, 0],
	limegreen: [50, 205, 50],
	linen: [250, 240, 230],
	magenta: [255, 0, 255],
	maroon: [128, 0, 0],
	mediumaquamarine: [102, 205, 170],
	mediumblue: [0, 0, 205],
	mediumorchid: [186, 85, 211],
	mediumpurple: [147, 112, 219],
	mediumseagreen: [60, 179, 113],
	mediumslateblue: [123, 104, 238],
	mediumspringgreen: [0, 250, 154],
	mediumturquoise: [72, 209, 204],
	mediumvioletred: [199, 21, 133],
	midnightblue: [25, 25, 112],
	mintcream: [245, 255, 250],
	mistyrose: [255, 228, 225],
	moccasin: [255, 228, 181],
	navajowhite: [255, 222, 173],
	navy: [0, 0, 128],
	oldlace: [253, 245, 230],
	olive: [128, 128, 0],
	olivedrab: [107, 142, 35],
	orange: [255, 165, 0],
	orangered: [255, 69, 0],
	orchid: [218, 112, 214],
	palegoldenrod: [238, 232, 170],
	palegreen: [152, 251, 152],
	paleturquoise: [175, 238, 238],
	palevioletred: [219, 112, 147],
	papayawhip: [255, 239, 213],
	peachpuff: [255, 218, 185],
	peru: [205, 133, 63],
	pink: [255, 192, 203],
	plum: [221, 160, 221],
	powderblue: [176, 224, 230],
	purple: [128, 0, 128],
	rebeccapurple: [102, 51, 153],
	red: [255, 0, 0],
	rosybrown: [188, 143, 143],
	royalblue: [65, 105, 225],
	saddlebrown: [139, 69, 19],
	salmon: [250, 128, 114],
	sandybrown: [244, 164, 96],
	seagreen: [46, 139, 87],
	seashell: [255, 245, 238],
	sienna: [160, 82, 45],
	silver: [192, 192, 192],
	skyblue: [135, 206, 235],
	slateblue: [106, 90, 205],
	slategray: [112, 128, 144],
	slategrey: [112, 128, 144],
	snow: [255, 250, 250],
	springgreen: [0, 255, 127],
	steelblue: [70, 130, 180],
	tan: [210, 180, 140],
	teal: [0, 128, 128],
	thistle: [216, 191, 216],
	tomato: [255, 99, 71],
	turquoise: [64, 224, 208],
	violet: [238, 130, 238],
	wheat: [245, 222, 179],
	white: [255, 255, 255],
	whitesmoke: [245, 245, 245],
	yellow: [255, 255, 0],
	yellowgreen: [154, 205, 50],
};

/**
 * @param {string} name
 * @returns {number[]}
 */
export function namedToRgb(name) {
	name = name.toLowerCase();
	if (Object.hasOwn(namedColors, name)) {
		return namedColors[name];
	}
	return null;
}
