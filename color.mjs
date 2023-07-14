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

	let fractionDigits = 2;

	let colorFields = {
		rgb: {
			label: 'RGB',
			text(rgba) {
				let [r, g, b, a] = rgba;
				[r, g, b] = [r, g, b].map(c => Math.round(c * 255));
				a = +(a * 100).toFixed(fractionDigits);
				if (a == 100) {
					return `rgb(${r} ${g} ${b})`;
				}
				return `rgb(${r} ${g} ${b} / ${a}%)`;
			},
		},
		rgbLegacy: {
			label: 'RGB`',
			text(rgba) {
				let [r, g, b, a] = rgba;
				[r, g, b] = [r, g, b].map(c => Math.round(c * 255));
				a = +(a * 100).toFixed(fractionDigits);
				if (a == 100) {
					return `rgb(${r}, ${g}, ${b})`;
				}
				return `rgb(${r}, ${g}, ${b}, ${a}%)`;
			},
		},
		hex: {
			label: 'HEX',
			text(rgba) {
				let [r, g, b, a] = rgba;
				return `#${rgbToHex(r, g, b, a).toUpperCase()}`;
			},
		},
		named: {
			label: 'Named',
			text(rgba) {
				if (rgba[3] == 1) {
					return `${rgbToNamed(...rgba)}`;
				}
				return 'null';
			},
		},
		hsl: {
			label: 'HSL',
			text(rgba) {
				let [r, g, b, a] = rgba;

				let [h, s, l] = rgbToHsl(r, g, b);
				h = Math.round(h * 360);
				[s, l, a] = [s, l, a].map(c => +(c * 100).toFixed(fractionDigits));
				if (a == 100) {
					return `hsl(${h} ${s}% ${l}%)`;
				}
				return `hsl(${h} ${s}% ${l}% / ${a}%)`;
			},
		},
		hwb: {
			label: 'HWB',
			text(rgba) {
				let [r, g, b, a] = rgba;

				let [h, w, black] = rgbToHwb(r, g, b);
				h = Math.round(h * 360);

				[w, black, a] = [w, black, a].map(c => +(c * 100).toFixed(2));
				if (a == 100) {
					return `hwb(${h} ${w}% ${black}%)`;
				}
				return `hwb(${h} ${w}% ${black}% / ${a}%)`;
			},
		},
		cmyk: {
			label: 'CMYK',
			text(rgba) {
				let [r, g, b, a] = rgba;

				let [c, m, y, k] = rgbToCmyk(r, g, b);
				[c, m, y, k, a] = [c, m, y, k, a].map(c => +(c * 100).toFixed(2));
				if (a == 100) {
					return `cmyk(${c}% ${m}% ${y}% ${k}%)`;
				}
				return `cmyk(${c}% ${m}% ${y}% ${k}% / ${a}%)`;
			},
		},
		lab: {
			label: 'LAB',
			text(rgba) {
				let [r, g, b, a] = rgba;

				let [l, a_, b_] = rgbToLab(r, g, b);
				[l, a_, b_, a] = [l, a_, b_, a].map(c => +(c * 100).toFixed(2));
				if (a == 100) {
					return `lab(${l}% ${a_}% ${b_}%)`;
				}
				return `lab(${l}% ${a_}% ${b_}% / ${a}%)`;
			},
		},
	};

	function createFields(colorFields) {
		let template = document.createElement('template');
		template.innerHTML = `
<div class="field">
	<label>RGB</label>
	<input type="text" spellcheck="false" name="rgb" />
	<button type="button" class="copy"></button>
</div>
`;
		let fields = document.createDocumentFragment();
		for (let name of Object.keys(colorFields)) {
			let fragment = template.content.cloneNode(true);
			fragment.querySelector('label').innerHTML = colorFields[name].label;
			let input = fragment.querySelector('input');
			input.name = name;
			fragment.querySelector('button').onclick = function () {
				navigator.clipboard.writeText(input.value);
			};
			fields.append(fragment);
		}
		return fields;
	}

	let colorList = document.querySelector('#colorList');
	colorList.append(createFields(colorFields));

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
		overflow: hidden;
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
			let rect = image.parentElement.getBoundingClientRect();
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
			// image.style.left = Math.round(width / 2 - rect.width * centerX + (rect.width - width)) + 'px';
			// image.style.top = Math.round(height / 2 - rect.height * centerY + (rect.height - height)) + 'px';
		}

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

		function setCenter(centerX, centerY, parentX = 0.5, parentY = 0.5) {
			let { width, height } = getAbsoluteRect(image);
			let { width: parentWidth, height: parentHeight } = getAbsoluteRect(image.parentElement);
			let x = -width * centerX + parentWidth * parentX;
			let y = -height * centerY + parentHeight * parentY;
			image.style.left = `${Math.round(x)}px`;
			image.style.top = `${Math.round(y)}px`;
			console.log(width, height, x, y, parentWidth, centerX, centerY);
		}

		function getCenter(parentX = 0.5, parentY = 0.5) {
			let rect = getAbsoluteRect(image);
			let parentRect = getAbsoluteRect(image.parentElement);
			let { width, height } = rect;
			let { width: parentWidth, height: parentHeight } = parentRect;

			let x = rect.x - parentRect.x;
			let y = rect.y - parentRect.y;
			let centerX = (x - parentWidth * parentX) / -width;
			let centerY = (y - parentHeight * parentY) / -height;
			return { centerX, centerY };
		}

		/**
		 * @param {HTMLElement} element
		 * @returns {DOMRect}
		 */
		function getAbsoluteRect(element) {
			let { x, y, width, height } = element.getBoundingClientRect();
			x += window.scrollX;
			y += window.scrollY;
			return DOMRect.fromRect({ x, y, width, height });
		}

		container.onwheel = function (event) {
			if (!event.ctrlKey) return;
			event.preventDefault();
			let parentRect = getAbsoluteRect(container);
			let parentX = (event.clientX + window.scrollX - parentRect.x) / parentRect.width,
				parentY = (event.clientY + window.scrollY - parentRect.y) / parentRect.height;

			let rect = getAbsoluteRect(image);
			// centerX = ;
			// centerY = ;

			zoomLevel = Math.round(zoomLevel + -event.deltaY / 20);
			zoomLevel = Math.min(Math.max(zoomLevel, minZoomLevel), maxZoomLevel);

			resize();

			setCenter(
				(event.clientX + window.scrollX - rect.x - parentRect.x) / rect.width,
				(event.clientY + window.scrollY - rect.y - parentRect.y) / rect.height,
				parentX,
				parentY
			);
			({ centerX, centerY } = getCenter());
		};

		eyedropper.ondblclick = function (event) {
			centerX = 0.5;
			centerY = 0.5;
			zoomLevel = 0;
			resize();
			setCenter(centerX, centerY);
		};

		eyedropper.onpointerenter = function (event) {
			onmove(event);
			lens.style.visibility = 'visible';
			lens.style.display = '';
		};

		eyedropper.onpointerleave = function (event) {
			lens.style.visibility = 'hidden';
			lens.style.display = 'none';
		};

		eyedropper.onpointermove = function (event) {
			if (pointerdown) {
				let [x, y] = getCoords(event);
				pickColor(x, y);
			}

			if (rightButton) {
				let prevOffsetX = offsetX;
				let prevOffsetY = offsetY;
				offsetX = event.clientX + window.scrollX;
				offsetY = event.clientY + window.scrollY;

				let { x, y } = getAbsoluteRect(image);

				x += offsetX - prevOffsetX;
				y += offsetY - prevOffsetY;
				console.log(prevOffsetX, x, y);

				image.style.left = `${Math.round(x)}px`;
				image.style.top = `${Math.round(y)}px`;

				({ centerX, centerY } = getCenter());
			}

			onmove(event);
		};

		function pickColor(x, y) {
			let rgba = getPixel(x, y);
			if (rgba[0] == undefined) {
				rgba = [0, 0, 0, 0];
			}
			rgba = rgba.map(c => c / 255);
			for (let name of Object.keys(colorFields)) {
				colorList[name].value = colorFields[name].text(rgba);
			}
			document.querySelector('#colorBar').style.background = colorList.rgb.value;
		}

		let pointerdown = false;
		let rightButton = false;

		let LEFT_MOUSE = 0,
			RIGHT_MOUSE = 2;
		let offsetX, offsetY;
		eyedropper.onpointerdown = function (event) {
			document.activeElement?.blur();
			if (event.button == LEFT_MOUSE) {
				event.preventDefault();
				pointerdown = true;
				let [x, y] = getCoords(event);
				pickColor(x, y);
			}

			if (event.button == RIGHT_MOUSE) {
				eyedropper.style.cursor = 'move';
				event.preventDefault();
				rightButton = true;
				offsetX = event.clientX + window.scrollX;
				offsetY = event.clientY + window.scrollY;
			}
		};

		eyedropper.onpointerup = function (event) {
			if (pointerdown && event.button == LEFT_MOUSE) {
				event.preventDefault();
				let [x, y] = getCoords(event);
				pickColor(x, y);
			}
		};

		eyedropper.oncontextmenu = function (event) {
			event.preventDefault();
		};

		document.addEventListener('pointerup', function (event) {
			if (event.button == LEFT_MOUSE) {
				pointerdown = false;
			}

			if (event.button == RIGHT_MOUSE) {
				eyedropper.style.cursor = '';
				rightButton = false;
			}
		});

		eyedropper.querySelector('.image').append(image);
		lens.prepend(zoomed);

		let shadow = container.shadowRoot ?? container.attachShadow({ mode: 'open' });
		shadow.replaceChildren(fragment);

		new ResizeObserver(entries => {
			for (const entry of entries) {
			}
			resize();
			setCenter(centerX, centerY);
		}).observe(image.offsetParent);

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

			let root = eyedropper;

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

			if (x < 0 || y < 0 || x >= image.naturalWidth || y >= image.naturalHeight) {
				return [0, 0, 0, 0];
			}
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

	// for (let color of colors) {
	// 	console.log(parseColor(color));
	// }

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
