/**
 * All color function values are percentages [0, 1]
 */

/**
 * clip to the range
 * @param {number} n
 * @param {number} [lower = 0]
 * @param {number} [upper = 1]
 * @returns {number}
 */
function clip(n, lower = 0, upper = 1) {
	return Math.min(Math.max(lower, n), upper);
}

/**
 * wrap around
 * @param {number} n
 * @param {number} [lower = 0]
 * @param {number} [upper = 1]
 * @returns {number}
 */
function wrap(n, lower = 0, upper = 1) {
	n = (n - lower) % (upper - lower);
	return n < 0 ? n + upper : n + lower;
}

/**
 * @param {number} r [0, 1]
 * @param {number} g [0, 1]
 * @param {number} b [0, 1]
 * @returns {number[]} [h[0, 1], s[0, 1], l[0, 1]]
 */
export function rgbToHsl(r, g, b) {
	r = clip(r);
	g = clip(g);
	b = clip(b);

	let max = Math.max(r, g, b);
	let min = Math.min(r, g, b);

	let d = max - min;

	let h = 0,
		s = 0,
		l = (min + max) / 2;
	if (d != 0) {
		s = l == 0 || l == 1 ? 0 : (max - l) / Math.min(l, 1 - l);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			default:
				h = (r - g) / d + 4;
		}

		h /= 6;
	}

	return [h, s, l];
}

/**
 * @param {number} h [0, 1]
 * @param {number} s [0, 1]
 * @param {number} l [0, 1]
 * @returns {number[]} [r[0, 1], g[0, 1], b[0, 1]]
 */
export function hslToRgb(h, s, l) {
	h = wrap(h);
	s = clip(s);
	l = clip(l);

	let chroma = (1 - Math.abs(2 * l - 1)) * s;
	let huePrime = h * 6;
	let x = chroma * (1 - Math.abs((huePrime % 2) - 1));
	let m = l - chroma / 2;

	let r, g, b;
	switch (huePrime | 0) {
		case 0:
			r = chroma;
			g = x;
			b = 0;
			break;
		case 1:
			r = x;
			g = chroma;
			b = 0;
			break;
		case 2:
			r = 0;
			g = chroma;
			b = x;
			break;
		case 3:
			r = 0;
			g = x;
			b = chroma;
			break;
		case 4:
			r = x;
			g = 0;
			b = chroma;
			break;
		default:
			r = chroma;
			g = 0;
			b = x;
			break;
	}

	r += m;
	g += m;
	b += m;

	return [r, g, b];
}

/**
 * @param {string} hex length of either 3, 4, 6, or 8
 * @returns {number[]} [r, g, b[, a]]
 */
export function hexToRgb(hex) {
	let n = parseInt(hex, 16);
	if (Number.isNaN(n)) return null;

	let r, g, b, a;
	switch (hex.length) {
		case 3:
			r = (n >> 8) & 15;
			r |= r << 4;
			g = (n >> 4) & 15;
			g |= g << 4;
			b = n & 15;
			b |= b << 4;
			break;
		case 4:
			r = (n >> 12) & 15;
			r |= r << 4;
			g = (n >> 8) & 15;
			g |= g << 4;
			b = (n >> 4) & 15;
			b |= b << 4;
			a = n & 15;
			a |= a << 4;
			break;
		case 6:
			r = (n >> 16) & 255;
			g = (n >> 8) & 255;
			b = n & 255;
			break;
		case 8:
			r = (n >> 24) & 255;
			g = (n >> 16) & 255;
			b = (n >> 8) & 255;
			a = n & 255;
			break;
		default:
			return null;
	}

	r /= 255;
	g /= 255;
	b /= 255;
	if (a == undefined) return [r, g, b];
	a /= 255;
	return [r, g, b, a];
}

/**
 *
 * @param {number} r [0, 1]
 * @param {number} g [0, 1]
 * @param {number} b [0, 1]
 * @param {number} a [0, 1]
 * @returns {string} #ffffff
 */
export function rgbToHex(r, g, b, a = undefined) {
	r = Math.round(r * 255).toString(16);
	g = Math.round(g * 255).toString(16);
	b = Math.round(b * 255).toString(16);
	if (r.length == 1) r = r + r;
	if (g.length == 1) g = g + g;
	if (b.length == 1) b = b + b;

	if (a != undefined && Math.round(a * 255) != 255) {
		a = Math.round(a * 255).toString(16);
		if (a.length == 1) a = a + a;
		return r + g + b + a;
	}

	return r + g + b;
}

/**
 * @param {number} h [0, 1]
 * @param {number} w [0, 1]
 * @param {number} b [0, 1]
 * @returns {number[]} [r, g, b]
 */
export function hwbToRgb(h, w, b) {
	h = wrap(h);
	w = clip(w);
	b = clip(b);

	if (w + b >= 1) {
		let c = w / (w + b);
		return [c, c, c];
	}

	let m = 1 - w - b;
	let rgb = hslToRgb(h, 1, 0.5);
	for (let i = 0; i < 3; i++) {
		rgb[i] = rgb[i] * m + w;
	}

	return rgb;
}

/**
 * @param {number} r [0, 1]
 * @param {number} g [0, 1]
 * @param {number} b [0, 1]
 * @returns {number[]} [h, w, b]
 */
export function rgbToHwb(r, g, b) {
	let max = Math.max(r, g, b);
	let min = Math.min(r, g, b);
	let delta = max - min;

	let h;
	if (delta == 0) {
		h = 0;
	} else if (max == r) {
		h = ((g - b) / delta) % 6;
	} else if (max == g) {
		h = (b - r) / delta + 2;
	} else {
		h = (r - g) / delta + 4;
	}

	h = h / 6;
	if (h < 0) {
		h += 1;
	}

	return [h, min, 1 - max];
}

/**
 * @param {number} c [0, 1]
 * @param {number} m [0, 1]
 * @param {number} y [0, 1]
 * @param {number} k [0, 1]
 * @returns {number[]} [r, g, b]
 */
export function cmykToRgb(c, m, y, k) {
	c = clip(c);
	m = clip(m);
	y = clip(y);
	k = clip(k);

	let r = (1 - c) * (1 - k),
		g = (1 - m) * (1 - k),
		b = (1 - y) * (1 - k);

	return [r, g, b];
}

/**
 * @param {number} r [0, 1]
 * @param {number} g [0, 1]
 * @param {number} b [0, 1]
 * @returns {number[]} [c, m, y, k]
 */
export function rgbToCmyk(r, g, b) {
	r = clip(r);
	g = clip(g);
	b = clip(b);

	let k = 1 - Math.max(r, g, b),
		c = (1 - r - k) / (1 - k),
		m = (1 - g - k) / (1 - k),
		y = (1 - b - k) / (1 - k);

	return [c, m, y, k];
}

/**
 * @param {number} l [0, 1]
 * @param {number} a [-1, 1]
 * @param {number} b [-1, 1]
 * @returns {number[]} [r, g, b]
 */
export function labToRgb(l, a, b) {
	l = clip(l);
	a = clip(a, -1, 1);
	b = clip(b, -1, 1);

	return xyz2rgb(...lab2xyz(l, a, b));
}

let refX = 0.95047,
	refY = 1.0,
	refZ = 1.08883;
function lab2xyz(l, a, b) {
	l *= 100;
	a *= 125;
	b *= 125;

	let y = (l + 16) / 116;
	let x = a / 500 + y;
	let z = y - b / 200;

	x = x ** 3 > 0.008856 ? x ** 3 : (x - 16 / 116) / 7.787;
	y = y ** 3 > 0.008856 ? y ** 3 : (y - 16 / 116) / 7.787;
	z = z ** 3 > 0.008856 ? z ** 3 : (z - 16 / 116) / 7.787;

	x *= refX;
	y *= refY;
	z *= refZ;

	return [x, y, z];
}

function xyz2rgb(x, y, z) {
	let r = x * 3.2406255 + y * -1.537208 + z * -0.4986286;
	let g = x * -0.9689307 + y * 1.8757561 + z * 0.0415175;
	let b = x * 0.0557101 + y * -0.2040211 + z * 1.0569959;

	r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : 12.92 * r;
	g = g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : 12.92 * g;
	b = b > 0.0031308 ? 1.055 * b ** (1 / 2.4) - 0.055 : 12.92 * b;

	r = clip(r);
	g = clip(g);
	b = clip(b);

	return [r, g, b];
}

/**
 * @param {number} r [0, 1]
 * @param {number} g [0, 1]
 * @param {number} b [0, 1]
 * @returns {number[]} [r, g, b]
 */
export function rgbToLab(r, g, b) {
	r = clip(r);
	g = clip(g);
	b = clip(b);

	return xyz2lab(...rgb2xyz(r, g, b));
}

function rgb2xyz(r, g, b) {
	r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
	g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
	b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;

	let x = r * 0.4123956 + g * 0.3575834 + b * 0.1804926;
	let y = r * 0.2125862 + g * 0.7151703 + b * 0.0722005;
	let z = r * 0.0192972 + g * 0.1191839 + b * 0.9504971;

	return [x, y, z];
}

function xyz2lab(x, y, z) {
	x /= refX;
	y /= refY;
	z /= refZ;

	x = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
	y = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
	z = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 16 / 116;

	let l = 116 * y - 16;
	let a = 500 * (x - y);
	let b = 200 * (y - z);

	return [l / 100, a / 125, b / 125];
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

const colorNameds = Object.fromEntries(
	Object.entries(namedColors)
		.reverse()
		.map(([name, [r, g, b]]) => [(r << 16) | (g << 8) | b, name])
);

/**
 * @param {string} name
 * @returns {number[]} [r, g, b]
 */
export function namedToRgb(name) {
	name = name.toLowerCase();
	return Object.hasOwn(namedColors, name) ? namedColors[name].map(c => c / 255) : null;
}

/**
 * @param {number} r [0, 1]
 * @param {number} g [0, 1]
 * @param {number} b [0, 1]
 * @returns {string} name
 */
export function rgbToNamed(r, g, b) {
	[r, g, b] = [r, g, b].map(c => Math.round(c * 255));
	let rgb = (r << 16) | (g << 8) | b;
	return Object.hasOwn(colorNameds, rgb) ? colorNameds[rgb] : null;
}

if (typeof process != 'undefined' && process.env.NODE_ENV != 'production') {
	let color = [154 / 255, 205 / 255, 50 / 255];

	function test(anyToRgb, rgbToAny, singleArg = false) {
		let rgb;
		if (singleArg) {
			rgb = anyToRgb(rgbToAny(...color));
		} else {
			rgb = anyToRgb(...rgbToAny(...color));
		}
		return rgbToHex(...color) == rgbToHex(...rgb);
	}

	console.log('namedToRgb', test(namedToRgb, rgbToNamed, true));

	console.log('hexToRgb', test(hexToRgb, rgbToHex, true));

	console.log('rgbToHwb', test(hwbToRgb, rgbToHwb));

	console.log('rgbToHsl', test(hslToRgb, rgbToHsl));

	console.log('rgbToCmyk', test(cmykToRgb, rgbToCmyk));

	console.log('rgbToLab', test(labToRgb, rgbToLab));
}
