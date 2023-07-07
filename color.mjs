if (typeof window != 'undefined') {
	if (navigator.clipboard) {
		console.log('ok');
	} else {
		// nope 😢
	}

	/**
	 * @param {File} file
	 * @returns {Promise<HTMLImageElement>}
	 */
	function readAsImage(file) {
		return new Promise((resolve, reject) => {
			let image = new Image();
			let reader = new FileReader();

			reader.onload = function () {
				image.src = reader.result;
			};
			reader.onerror = reject;

			image.onload = function () {
				resolve(image);
			};
			image.onerror = reject;

			reader.readAsDataURL(file);
		});
	}

	let container = document.querySelector('#colorpicker');

	let grids = 9;

	let template = document.createElement('template');
	template.innerHTML = `
<style>
	*{
		box-sizing: border-box;
	}
	.eyedropper {
		width: 100%;
		height: 100%;
		position: relative;
		cursor: crosshair;
		display: flex;
	}
	.eyedropper > .image{
		flex: 1;
		overflow: hidden;
		position:relative;
	}
	.eyedropper > .image > img {
		position:absolute;
		image-rendering: pixelated;
	}
	.lens {
		z-index: 999;
		position: absolute;
		overflow: hidden;
		visibility: hidden;
		width: 110px;
		aspect-ratio: 1 / 1;
		background: #444;
		border-radius: 50%;
		box-shadow: 0 0 3px rgb(0, 0, 0, 0.5);
		pointer-events: none;
		margin: 0;
		transition: margin 0.2s ease-out;
	}
	.lens::after{
		content: '';
		display: block;
		width:100%;height:100%;
		border-radius: 50%;
		position: absolute;
		top:0;
		left:0;
		box-shadow: inset 0 0 7px rgb(0 0 0 / 0.1);
	}
	.vgrid,
	.hgrid {
		display: flex;
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		justify-content: space-between;
	}
	.vgrid {
		flex-direction: column;
	}
	.vgrid > *,
	.hgrid > * {
		display: block;
		background: rgb(0 0 0 / 0.2);
	}
	.vgrid > * {
		width: 100%;
		height: 1px;
	}
	.hgrid > * {
		width: 1px;
		height: 100%;
	}
	.center {
		box-sizing: border-box;
		position: absolute;
		width: calc(100% / ${grids} + 1.5px);
		aspect-ratio: 1 / 1;
		border: 1px solid red;
		top: calc(50% - (100% / ${grids} + 1.5px) / 2);
		left: calc(50% - (100% / ${grids} + 1.5px) / 2);
		filter: invert(100%);
	}

	.lens > img {
		position: absolute;
		image-rendering: pixelated;
	}
</style>
<div class="eyedropper">
	<canvas class="sampler" hidden></canvas>
	<div class="image"></div>
	<div class="lens">
		<div class="vgrid">${'<i></i>'.repeat(grids + 1)}</div>
		<div class="hgrid">${'<i></i>'.repeat(grids + 1)}</div>
		<div class="center"></div>
	</div>
</div>
`;

	let preferredWidth = 500,
		preferredHeight = 500;

	/**
	 *
	 * @param {HTMLImageElement} image
	 */
	function imageHandler(image) {
		/** @type {DocumentFragment} */
		let fragment = template.content.cloneNode(true);

		/** @type {HTMLElement} */
		let eyedropper = fragment.querySelector('.eyedropper');

		/** @type {HTMLElement} */
		let lens = fragment.querySelector('.lens');

		/** @type {HTMLImageElement} */
		let zoomed = image.cloneNode();

		/** @type {HTMLCanvasElement} */
		let sampler = fragment.querySelector('.sampler');

		let centerX = 0.5,
			centerY = 0.5;

		function resize() {
			let rect = container.getBoundingClientRect();
			let width, height;
			if (image.naturalWidth / rect.width > image.naturalHeight / rect.height) {
				width = rect.width * zoomScale();
				height = (width / image.naturalWidth) * image.naturalHeight;
			} else {
				height = rect.height * zoomScale();
				width = (height / image.naturalHeight) * image.naturalWidth;
			}
			image.style.width = Math.round(width) + 'px';
			image.style.height = Math.round(height) + 'px';
			image.style.left = Math.round(width / 2 - rect.width * centerX + (rect.width - width)) + 'px';
			image.style.top = Math.round(height / 2 - rect.height * centerY + (rect.height - height)) + 'px';
		}

		new ResizeObserver(entries => {
			for (const entry of entries) {
				let container = entry.target;
				resize();
				console.log('image resize', image.style.width, image.style.height);
				console.log(container.clientWidth, container.clientHeight);
			}
		}).observe(fragment.querySelector('.image'));

		function getCoords(event) {
			let rect = image.getBoundingClientRect();
			let x = event.clientX - rect.x,
				y = event.clientY - rect.y;
			return [x, y];
		}

		function onmove(event) {
			let [x, y] = getCoords(event);

			// console.log(event.x, event.pageX);
			zoom(x, y);
		}

		let zoomLevel = 0;
		let [maxZoomLevel, minZoomLevel] = [200, -50];

		function zoomScale() {
			return 1.02 ** zoomLevel;
		}

		eyedropper.onwheel = function (event) {
			event.preventDefault();
			let rect = container.getBoundingClientRect();
			let focusX = (event.clientX - rect.x) / rect.width,
				focusY = (event.clientY - rect.y) / rect.height;

			let currentZoomScale = zoomScale();
			zoomLevel = Math.round(zoomLevel + -event.deltaY / 20);
			zoomLevel = Math.min(Math.max(zoomLevel, minZoomLevel), maxZoomLevel);
			let [x, y] = getCoords(event).map(c => c / zoomScale());

			centerX -= ((0.5 - focusX) / 0.5) * (zoomScale() / currentZoomScale - 1);
			centerY -= ((0.5 - focusY) / 0.5) * (zoomScale() / currentZoomScale - 1);

			console.log('center', centerX - focusX, currentZoomScale / zoomScale() / 2);

			resize();
		};

		eyedropper.onpointerenter = function (event) {
			onmove(event);
			lens.style.visibility = 'visible';
		};

		eyedropper.onpointerleave = function (event) {
			lens.style.visibility = 'hidden';
		};

		eyedropper.onpointermove = function (event) {
			onmove(event);
			if (pointerdown) {
				let [x, y] = getCoords(event);
				pickColor(x, y);
			}
		};

		function pickColor(x, y) {
			let pixel = getPixel(x, y);
			if (pixel[0] == undefined) {
				pixel = [0, 0, 0, 0];
			}
			pixel = pixel.map(c => c / 255);
			{
				let text;
				let [r, g, b, a] = pixel;
				r = Math.round(r * 255);
				g = Math.round(g * 255);
				b = Math.round(b * 255);
				a = +(a * 100).toFixed(2) + '%';
				if (a == '100%') {
					text = `rgb(${r} ${g} ${b})`;
				} else {
					text = `rgb(${r} ${g} ${b} / ${a})`;
				}
				colorList.rgb.value = text;
			}
			{
				let text;
				let [r, g, b, a] = pixel;
				r = Math.round(r * 255);
				g = Math.round(g * 255);
				b = Math.round(b * 255);
				a = +a.toFixed(2);
				if (a == 1) {
					text = `rgb(${r}, ${g}, ${b})`;
				} else {
					text = `rgba(${r}, ${g}, ${b}, ${a})`;
				}
				colorList.rgbLegacy.value = text;
			}
			{
				let text = `#${rgbToHex(...pixel).toUpperCase()}`;
				colorList.hex.value = text;
			}
			{
				let text;
				if (pixel[3] == 1) {
					text = `${rgbToNamed(...pixel)}`;
				} else {
					text = 'null';
				}

				colorList.named.value = text;
			}
			{
				let text;
				let [r, g, b, a] = pixel;
				a = +(a * 100).toFixed(2) + '%';

				let [h, s, l] = rgbToHsl(r, g, b);
				h = Math.round(h * 360);
				s = +(s * 100).toFixed(2) + '%';
				l = +(l * 100).toFixed(2) + '%';
				if (a == '100%') {
					text = `hsl(${h} ${s} ${l})`;
				} else {
					text = `hsl(${h} ${s} ${l} / ${a})`;
				}

				colorList.hsl.value = text;
			}
			{
				let text;
				let [r, g, b, a] = pixel;
				a = +(a * 100).toFixed(2) + '%';

				let [h, w, black] = rgbToHwb(r, g, b);
				h = Math.round(h * 360);
				w = +(w * 100).toFixed(2) + '%';
				black = +(black * 100).toFixed(2) + '%';
				if (a == '100%') {
					text = `hwb(${h} ${w} ${black})`;
				} else {
					text = `hwb(${h} ${w} ${black} / ${a})`;
				}

				colorList.hwb.value = text;
			}
			{
				let text;
				let [r, g, b, a] = pixel;
				a = +(a * 100).toFixed(2) + '%';

				let [c, m, y, k] = rgbToCmyk(r, g, b);
				c = +(c * 100).toFixed(2) + '%';
				m = +(m * 100).toFixed(2) + '%';
				y = +(y * 100).toFixed(2) + '%';
				k = +(k * 100).toFixed(2) + '%';
				if (a == '100%') {
					text = `cmyk(${c} ${m} ${y} ${k})`;
				} else {
					text = `cmyk(${c} ${m} ${y} ${k} / ${a})`;
				}

				colorList.cmyk.value = text;
			}
			{
				let text;
				let [r, g, b, a] = pixel;
				a = +(a * 100).toFixed(2) + '%';

				let [l, a_, b_] = rgbToLab(r, g, b);
				[l, a_, b_] = [l, a_, b_].map(c => +(c * 100).toFixed(2) + '%');
				if (a == '100%') {
					text = `lab(${l} ${a_} ${b_})`;
				} else {
					text = `lab(${l} ${a_} ${b_} / ${a})`;
				}

				colorList.lab.value = text;
			}
			console.log(pixel);

			console.log(rgbToLab(1, 1, 1));
		}

		let pointerdown = false;
		eyedropper.onpointerdown = function (event) {
			pointerdown = true;
			event.preventDefault();
			let [x, y] = getCoords(event);
			pickColor(x, y);
		};

		eyedropper.onpointerup = function (event) {
			pointerdown = false;
			let [x, y] = getCoords(event);
			pickColor(x, y);
		};

		eyedropper.querySelector('.image').append(image);
		lens.prepend(zoomed);

		let shadow = container.shadowRoot ?? container.attachShadow({ mode: 'open' });
		shadow.replaceChildren(fragment);

		/**
		 * @param {number} x
		 * @param {number} y
		 */
		function zoom(x, y) {
			x = Math.round(x);
			y = Math.round(y);

			let offsetLeft = 5,
				offsetTop = 5;

			let left = x + image.offsetLeft + offsetLeft;
			let top = y + image.offsetTop + offsetTop;

			let rect = image.offsetParent.getBoundingClientRect();

			// console.log(rect.x + left + lens.clientWidth, document.documentElement.clientWidth);

			let root = document.documentElement;

			let right = rect.left + left + lens.clientWidth,
				bottom = rect.top + top + lens.clientHeight;
			let overflowX = right > root.getBoundingClientRect().right || right > window.innerWidth,
				overflowY = bottom > root.getBoundingClientRect().bottom || bottom > window.innerHeight;

			lens.style.marginTop = overflowY ? -lens.clientHeight - offsetTop * 2 + 'px' : 0;
			lens.style.marginLeft = overflowX ? -lens.clientWidth - offsetLeft * 2 + 'px' : 0;

			lens.style.top = top + 'px';
			lens.style.left = left + 'px';

			// console.log(lens.clientWidth);

			let pixelSize = Math.round(lens.clientWidth / grids);
			zoomed.style.width = image.naturalWidth * pixelSize + ((image.naturalWidth * pixelSize) % 2) + 'px';

			let ratio = zoomed.clientWidth / image.width;
			let offset = (lens.clientWidth - pixelSize) / 2;

			let scale = image.width / image.naturalWidth;

			zoomed.style.left = Math.round(((-x / scale) | 0) * scale * ratio + offset) + 'px';
			zoomed.style.top = Math.round(((-y / scale) | 0) * scale * ratio + offset) + 'px';
		}

		sampler.width = image.naturalWidth;
		sampler.height = image.naturalHeight;
		let ctx = sampler.getContext('2d');
		ctx.drawImage(image, 0, 0);
		let data = ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight).data;

		/**
		 * @param {number} x
		 * @param {number} y
		 */
		function getPixel(x, y) {
			let scale = image.width / image.naturalWidth;
			// console.log(x, y, image.width, image.height);
			x = (x / scale) | 0;
			y = (y / scale) | 0;

			let position = (y * image.naturalWidth + x) * 4;
			return [data[position], data[position + 1], data[position + 2], data[position + 3]];
		}
	}

	function createImage(pixels) {
		return new Promise((resolve, reject) => {
			let image = new Image();
			image.onload = function () {
				resolve(image);
			};
			image.onerror = reject;
			let canvas = document.createElement('canvas');
			canvas.width = 1;
			canvas.height = 1;
			let ctx = canvas.getContext('2d');
			let data = new ImageData(new Uint8ClampedArray(pixels), 1, 1);
			ctx.putImageData(data, 0, 0);

			image.src = canvas.toDataURL();
		});
	}

	document.body.addEventListener('paste', function (event) {
		for (let file of event.clipboardData.files) {
			if (file.type.startsWith('image/')) {
				readAsImage(file).then(imageHandler);
			}
			console.log(file);
			return;
		}

		let text = event.clipboardData.getData('text/plain');
		let color = parseColor(text);
		if (color == null) return;

		// #f00
		console.log('event.clipboardData', color);
		createImage(color.map(c => Math.round(c * 255))).then(imageHandler);
	});

	let colorList = document.querySelector('#colorList');
}

/**
 * Use variables in regexp
 * @param {string[]} strings
 * @param  {...RegExp} patterns
 * @returns
 */
function $(strings, ...patterns) {
	strings = strings.raw;
	let result = [strings[0]];
	for (let i = 0; i < patterns.length; i++) {
		result.push(`(?:${patterns[i].source})`, strings[i + 1]);
	}
	return new RegExp(result.join(''));
}

let parseColor = (() => {
	let colors = [
		'currentcolor',
		'transparent',
		'red',
		'magenta',
		'#234',
		'#FEDCBA',
		'rgb(2, 3, 4)',
		'rgb(100%, 0%, 0%)',
		'rgba(2, 3, 4, 0.5)',
		'rgba(2, 3, 4, 50%)',
		'hsl(120, 100%, 50%)',
		'hsla(120, 100%, 50%, 0.25)',
		'hsl(120 100% 50% /50%)',
		'rgb(-2, 3, 4)',
		'rgb(100, 200, 300)',
		'rgb(20, 10, 0, -10)',
		'rgb(100%, 200%, 300%)',

		'rgb(none none none)',
		'rgb(none none none / none)',
		'rgb(128 none none)',
		'rgb(128 none none / none)',
		'rgb(none none none / .5)',
		'rgb(20% none none)',
		'rgb(20% none none / none)',
		'rgb(none none none / 50%)',
		'rgba(none none none)',
		'rgba(none none none / none)',
		'rgba(128 none none)',
		'rgba(128 none none / none)',
		'rgba(none none none / .5)',
		'rgba(20% none none)',
		'rgba(20% none none / none)',
		'rgba(none none none / 50%)',
		'rgb(-2 3 4)',
		'rgb(-20% 20% 40%)',
		'rgb(257 30 40)',
		'rgb(250% 20% 40%)',
		'rgba(-2 3 4)',
		'rgba(-20% 20% 40%)',
		'rgba(257 30 40)',
		'rgba(250% 20% 40%)',
		'rgba(-2 3 4 / .5)',
		'rgba(-20% 20% 40% / 50%)',
		'rgba(257 30 40 / 50%)',
		'rgba(250% 20% 40% / .5)',
	];

	let number = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/;
	let dimension = $`(?<number>${number})(?<unit>[A-z]*)`;

	let colorFunction = /(?<type>\w+)\((?<components>[^)]*)\)/;

	let hexDigit = /[0-9a-fA-F]/;
	let hex = $`#(?<digits>${hexDigit}{8}|${hexDigit}{6}|${hexDigit}{4}|${hexDigit}{3})`;

	function parseRGB(components) {
		components = components.trim();
		function parseAlpha(string) {
			return Math.min(Math.max(parsePercentage(string) ?? +string, 0), 1);
		}
		if (components.includes(',')) {
			// comma-separated
			components = components.split(/\s*,\s*/);

			if (components.length != 3 && components.length != 4) return null;

			let alpha = 1;
			if (components.length == 4) alpha = parseAlpha(components[3]);

			function parseRGB(component) {
				let value = parsePercentage(component, 0, 255) ?? +component | 0;
				return Math.min(Math.max(value, 0), 255) / 255;
			}

			return [...components.slice(0, 3).map(parseRGB), alpha];
		} else {
			// space-separated
			let index = components.indexOf('/');
			let alpha;

			function parseRGB(component) {
				let value;
				if (component == 'none') {
					value = 0;
				} else {
					value = parsePercentage(component, 0, 255) ?? +component | 0;
				}
				return Math.min(Math.max(value, 0), 255) / 255;
			}

			if (index != -1) {
				alpha = parseAlpha(components.slice(index + 1).trimLeft());
				components = components.slice(0, index).trimRight();
			} else {
				alpha = 1;
			}

			components = components.split(/\s+/);
			if (components.length != 3) return null;

			return [...components.map(parseRGB), alpha];
		}
	}

	function parseHue(string) {
		if (string == 'none' || string == '0') return 0;

		let hue = dimension.exec(string)?.groups;
		if (!hue) return null;

		let unit = hue.unit;
		hue = +hue.number;

		if (unit == '' || unit == 'deg') hue = hue;
		else if (unit == 'grad') hue = hue * 0.9;
		else if (unit == 'rad') hue = (hue / Math.PI) * 180;
		else if (unit == 'turn') hue = hue * 360;
		else return null;

		return (hue % 360) / 360;
	}

	function parsePercentage(string, lower = 0, upper = 1) {
		if (string == 'none' || string == '0') return 0;

		if (string.at(-1) != '%') return null;

		let percentage = lower + (+string.slice(0, -1) / 100) * (upper - lower);
		return percentage;
	}

	function parseAlpha(string) {
		let alpha = parsePercentage(string) ?? +string;
		return alpha;
	}

	function parseColorFunctionParams(paramText) {
		paramText = paramText.trim();

		let params;
		let alpha = 1;

		let index = paramText.indexOf('/');
		if (index != -1) {
			alpha = parseAlpha(paramText.slice(index + 1).trimLeft());
			paramText = paramText.slice(0, index).trimRight();
		}

		params = paramText.split(/\s+/);
		params.alpha = alpha;

		return params;
	}

	function parseHSL(components) {
		components = components.trim();

		// Legacy format: hsl(0, 10%, 50%, 1.0)
		if (components.includes(',')) {
			components = components.split(/\s*,\s*/);

			let a;
			if (components.length == 4) {
				a = parseAlpha(components[3]);
			} else {
				if (components.length != 3) return null;
				a = 1;
			}

			let [h, s, l] = components;
			return [parseHue(h), parsePercentage(s), parsePercentage(l), a];
		}

		let params = parseColorFunctionParams(components);
		if (params.length != 3) return null;

		let [h, s, l] = params;
		return [parseHue(h), parsePercentage(s), parsePercentage(l), params.alpha];
	}

	function parseHWB(paramText) {
		let params = parseColorFunctionParams(paramText);
		if (params.length != 3) return null;

		let [h, w, b] = params;
		return [parseHue(h), parsePercentage(w), parsePercentage(b), params.alpha];
	}

	function parseCMYK(paramText) {
		let params = parseColorFunctionParams(paramText);
		if (params.length != 4) return null;

		let [c, m, y, k] = params;
		return [parsePercentage(c), parsePercentage(m), parsePercentage(y), parsePercentage(k), params.alpha];
	}

	function parseLAB(paramText) {
		let params = parseColorFunctionParams(paramText);
		if (params.length != 3) return null;

		let [l, a, b] = params;
		return [
			parsePercentage(l) ?? +l / 100,
			parsePercentage(a) ?? +a / 125,
			parsePercentage(b) ?? +b / 125,
			params.alpha,
		];
	}

	/**
	 * @param {string} string
	 */
	function parseColor(string) {
		string = string.trim();
		let result = colorFunction.exec(string);
		if (result) {
			let { type, components } = result.groups;
			if (type == 'rgb' || type == 'rgba') {
				return parseRGB(components);
			}
			if (type == 'hsl' || type == 'hsla') {
				let [h, s, l, a] = parseHSL(components);
				return [...hslToRgb(h, s, l), a];
			}
			if (type == 'hwb') {
				let [h, w, b, a] = parseHWB(components);
				return [...hwbToRgb(h, w, b), a];
			}
			if (type == 'cmyk') {
				let [c, m, y, k, a] = parseCMYK(components);
				return [...cmykToRgb(c, m, y, k), a];
			}
			if (type == 'lab') {
				let [l, a_, b, a] = parseLAB(components);
				return [...labToRgb(l, a_, b), a];
			}
			return null;
		}

		result = hex.exec(string);
		if (result) {
			let { digits } = result.groups;
			let hex = hexToRgb(digits);
			return hex.length == 3 ? [...hex, 1] : hex;
		}

		if (string == 'transparent') {
			return [0, 0, 0, 0];
		}

		if (namedToRgb(string)) {
			return [...namedToRgb(string), 1];
		}
		return null;
	}

	for (let color of colors) {
		console.log(parseColor(color));
	}

	return parseColor;
})();

import {
	hslToRgb,
	hexToRgb,
	hwbToRgb,
	namedToRgb,
	cmykToRgb,
	labToRgb,
	rgbToHsl,
	rgbToHex,
	rgbToNamed,
	rgbToHwb,
	rgbToCmyk,
	rgbToLab,
} from './color-convert.mjs';
console.log(rgbToCmyk(0, 0, 0));

// navigator.clipboard.readText().then(text => {
// 	console.log(text);
// });
