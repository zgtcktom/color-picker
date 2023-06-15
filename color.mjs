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

let template = document.createElement('template');
template.innerHTML = `
<style>
.eyedropper{
	position:relative;
	cursor:crosshair;
	background:red;
	padding:1vw;
}
.eyedropper>img{
	margin:2vw;
}
.lens{
	position:absolute;
	overflow:hidden;
	display:none;
	width:101px;
	aspect-ratio: 1 / 1;
	background:#444;
	border-radius:50%;
}
.vgrid,.hgrid{
	display:flex;
	width:100%;
	height:100%;
	position:absolute;
	top:0;
	left:0;
	justify-content: space-between;
}
.vgrid{flex-direction:column;}
.vgrid>*, .hgrid>*{
	display:block;
	background:#444;
}
.vgrid>*{
	width:100%;height:1px;
}
.hgrid>*{
	width:1px;height:100%;
}
.center{
	box-sizing:border-box;
	position:absolute;
	top:0;
	left:0;
	width:calc(100% / 9 + 1px);
	aspect-ratio: 1 / 1;
	border:1px solid red;
	top:calc(50% - (100% / 9 + 1px) / 2);
	left:calc(50% - (100% / 9 + 1px) / 2);
	filter:invert(100%);
}

.lens>img{
	position:absolute;
	image-rendering:pixelated;
}
</style>
<div class="eyedropper">
	<div class="lens">
		<div class="vgrid">
			<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
		</div>
		<div class="hgrid">
			<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
		</div>
		<div class="center"></div>
	</div>
</div>
`;

document.body.addEventListener('paste', function (event) {
	for (let file of event.clipboardData.files) {
		if (file.type.startsWith('image/')) {
			console.log('pasted image');
			readAsImage(file).then(image => {
				console.log(image.width, image.height);
				let fragment = template.content.cloneNode(true);
				let eyedropper = fragment.querySelector('.eyedropper');
				let lens = fragment.querySelector('.lens');
				eyedropper.append(image);
				let zoomed = image.cloneNode();
				lens.prepend(zoomed);

				function zoom(x, y) {
					lens.style.left = Math.round(x) + image.offsetLeft + 10 + 'px';
					lens.style.top = Math.round(y) + image.offsetTop + 10 + 'px';

					let pixelSize = lens.clientWidth / (lens.children[1].children.length - 1);
					zoomed.style.width = image.width * Math.round(pixelSize) + 'px';

					console.log(-x / image.clientWidth, zoomed.clientWidth);
					zoomed.style.left =
						(Math.round(-x) / image.clientWidth) * zoomed.clientWidth +
						lens.clientWidth / 2 -
						pixelSize / 2 +
						'px';
					zoomed.style.top =
						(Math.round(-y) / image.clientHeight) * zoomed.clientHeight +
						lens.clientHeight / 2 -
						pixelSize / 2 +
						'px';
				}

				image.addEventListener('pointerenter', function (event) {
					zoom(event.offsetX, event.offsetY);
					lens.style.display = 'block';
				});
				image.addEventListener('pointerleave', function () {
					lens.style.display = 'none';
				});
				image.addEventListener('pointermove', function (event) {
					zoom(event.offsetX, event.offsetY);
				});
				container.append(fragment);
			});
		}
		console.log(file);
	}
	console.log(event.clipboardData.types);
});

// navigator.clipboard.readText().then(text => {
// 	console.log(text);
// });
