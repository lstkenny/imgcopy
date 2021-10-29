function addStylesheetRules (rules) {
	const styleEl = document.createElement("style")
	document.head.appendChild(styleEl)
	const styleSheet = styleEl.sheet
	for (let i = 0; i < rules.length; i++) {
		let j = 1,
        	rule = rules[i],
        	selector = rule[0],
        	propStr = ""
		if (Array.isArray(rule[1][0])) {
			rule = rule[1]
			j = 0
		}
		for (var pl = rule.length; j < pl; j++) {
			let prop = rule[j]
			propStr += `${prop[0]}: ${prop[1]}${(prop[2] ? " !important" : "")};\n`
		}
		styleSheet.insertRule(
			`${selector} {${propStr}}`, 
			styleSheet.cssRules.length
		)
	}
}
function shuffle(a) {
	let ci = a.length, 
		ri
	while (ci != 0) {
		ri = Math.floor(Math.random() * ci)
		ci--
		[a[ci], a[ri]] = [a[ri], a[ci]]
	}
	return a
}
function* getId(range = 100) {
	let index = Date.now() % 1000000
	while (true) {
		index += Math.floor(Math.random() * range) + 1
		yield `t${index.toString(16)}`
	}
}
function getTileSrc(image, col, row, width, height, overlap) {
	const cnv = document.createElement("canvas")
	cnv.width = width + overlap
	cnv.height = height + overlap
	const ctx = cnv.getContext("2d")
	ctx.drawImage(
		image,
		col * width, row * height,
		width + overlap, height + overlap,
		0, 0,
		cnv.width, cnv.height
	)
	return cnv.toDataURL()
}
function createTiles(img, cols, rows, overlap) {
	const width = img.width / cols
	const height = img.height / rows
	const tiles = []
	const relWidth = 100 / (cols - 1) * (1 + overlap / img.width)
	const relHeight = 100 / (rows - 1) * (1 + overlap / img.height)
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			const relX = col * relWidth
			const relY = row * relHeight
			tiles.push({
				col, row,
				relX, relY,
				width, height,
				src: getTileSrc(img, col, row, width, height, overlap)
			})
		}
	}
	return tiles
}
function setContainerSize(img, container) {
	let width = container.dataset.width
	let height = container.dataset.height
	if (!width && !height) {
		width = img.width
		height = img.height
	} else if (!width) {
		width = height * img.width / img.height
	} else if (!height) {
		height = width * img.height / img.width
	}
	container.style.width = `${width}px`
	container.style.height = `${height}px`
}
function createPuzzle(img, container, overlap) {
	setContainerSize(img, container)
	const cols = container.dataset.cols || options.cols
	const rows = container.dataset.rows || options.rows
	const colSize = 100 * (1 / cols + overlap / img.width)
	const rowSize = 100 * (1 / rows + overlap / img.height)
	let tiles = createTiles(img, cols, rows, Number(overlap))
	if (container.dataset.shuffle) {
		tiles = shuffle(tiles)
	}
	const styles = []
	tiles.forEach(tile => {
		const layer = document.createElement("div")
		layer.id = idGen.next().value
		styles.push([
			`#${layer.id}`,
				["background-image", `url(${tile.src})`],
				["background-size", `${colSize}% ${rowSize}%`],
				["background-position", `${tile.relX}% ${tile.relY}%`],
		])
		container.appendChild(layer)
	})
	for (let name in container.dataset) {
		container.removeAttribute(`data-${name}`)
	}
	return styles
}
function makeProtectedPicture(container) {
	const img = document.createElement("img")
	img.setAttribute("src", `${container.dataset.base}/${container.dataset.src}`)
	img.setAttribute("crossOrigin", "anonymous")
	return new Promise((resolve, reject) => {
		img.addEventListener("load", e => {
			resolve(createPuzzle(img, container, container.dataset.overlap || options.overlap))
		})
	})
}
async function processImages(imageSelector) {
	const imageContainerClass = options.imageContainerClass
	let styles = [
		[`.${imageContainerClass}`,
			["position", "relative"],
			// ["background-image", "url(img/grid120.png)"],
		],
		[`.${imageContainerClass} div`,
			["position", "absolute"],
			["top", "0"],
			["right", "0"],
			["bottom", "0"],
			["left", "0"],
			["background-repeat", "no-repeat"],
		]
	]
	let rules = []
	document.querySelectorAll(imageSelector).forEach(container => {
		container.setAttribute("class", imageContainerClass)
		rules.push(makeProtectedPicture(container))
	})
	rules = await Promise.all(rules)
	rules.forEach(rule => {
		styles = styles.concat(rule)
	})
	addStylesheetRules(styles)
}
const idGen = getId()
const options = {
	overlap: 4,
	cols: 10,
	rows: 10,
	imageContainerClass: "pimg-container",
	imageSelector: "[data-type=\"pimg\"]",

}
processImages(options.imageSelector)