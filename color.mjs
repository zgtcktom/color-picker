import { hslToRgb, hexToRgb, hwbToRgb, namedToRgb } from './color-convert.mjs';

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
	.eyedropper {
		position: relative;
	}
	.eyedropper > img {
		cursor: crosshair;
		margin: 2vw;
	}
	.lens {
		z-index: 999;
		position: absolute;
		overflow: hidden;
		display: none;
		width: 110px;
		aspect-ratio: 1 / 1;
		background: #444;
		border-radius: 50%;
		box-shadow: 0 0 3px rgb(0, 0, 0, 0.7);
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
		background: rgb(0, 0, 0, 0.3);
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
		top: 0;
		left: 0;
		width: calc(100% / ${grids} + 1px);
		aspect-ratio: 1 / 1;
		border: 1px solid red;
		top: calc(50% - (100% / ${grids} + 1px) / 2);
		left: calc(50% - (100% / ${grids} + 1px) / 2);
		filter: invert(100%);
	}

	.lens > img {
		position: absolute;
		image-rendering: pixelated;
	}
</style>
<div class="eyedropper">
	<div class="lens">
		<div class="vgrid">${'<i></i>'.repeat(grids + 1)}</div>
		<div class="hgrid">${'<i></i>'.repeat(grids + 1)}</div>
		<div class="center"></div>
	</div>
	<canvas class="sampler" hidden></canvas>
</div>
`;

document.body.addEventListener('paste', function (event) {
	for (let file of event.clipboardData.files) {
		if (file.type.startsWith('image/')) {
			readAsImage(file).then(image => {
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

				image.onpointerenter = function (event) {
					zoom(event.offsetX, event.offsetY);
					lens.style.display = 'block';
				};

				image.onpointerleave = function (event) {
					lens.style.display = 'none';
				};

				image.onpointermove = function (event) {
					zoom(event.offsetX, event.offsetY);
					console.log(getPixel(event.offsetX, event.offsetY));
				};

				eyedropper.append(image);
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

					lens.style.left = x + image.offsetLeft + 10 + 'px';
					lens.style.top = y + image.offsetTop + 10 + 'px';

					let pixelSize = Math.round(lens.clientWidth / grids);
					zoomed.style.width = image.width * pixelSize + 'px';

					let ratio = zoomed.clientWidth / image.clientWidth;
					let offset = lens.clientWidth / 2 - pixelSize / 2;
					zoomed.style.left = Math.round(-x * ratio + offset) + 'px';
					zoomed.style.top = Math.round(-y * ratio + offset) + 'px';
				}

				sampler.width = image.width;
				sampler.height = image.height;
				let ctx = sampler.getContext('2d');
				ctx.drawImage(image, 0, 0);
				let data = ctx.getImageData(0, 0, image.width, image.height).data;

				/**
				 * @param {number} x
				 * @param {number} y
				 */
				function getPixel(x, y) {
					x = Math.round(x);
					y = Math.round(y);

					let position = (y * image.width + x) * 4;
					return [data[position], data[position + 1], data[position + 2], data[position + 3]];
				}
			});
		}
		console.log(file);
	}

	let text = event.clipboardData.getData('text/plain');
	console.log('event.clipboardData', text);
});

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

let patterns = (() => {
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
				return Math.min(Math.max(value, 0), 255);
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
				return Math.min(Math.max(value, 0), 255);
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
		if (string == 'none') return 0;

		let hue = dimension.exec(string)?.groups;
		if (!hue) return null;

		let unit = hue.unit;
		hue = +hue.number;

		if (unit == '' || unit == 'deg') hue = hue;
		else if (unit == 'grad') hue = hue * 0.9;
		else if (unit == 'rad') hue = (hue / Math.PI) * 180;
		else if (unit == 'turn') hue = hue * 360;
		else return null;

		return hue % 360;
	}

	function parsePercentage(string, lower = 0, upper = 1) {
		if (string == 'none') return 0;

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
				return parseHSL(components);
			}
			if (type == 'hwb') {
				return parseHWB(components);
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
})();

console.log('hslToRgb', hslToRgb(12, 34, 56));
console.log('hexToRgb', hexToRgb('5db69a'));
console.log('hwbToRgb', hwbToRgb(12, 34, 56));

// navigator.clipboard.readText().then(text => {
// 	console.log(text);
// });
