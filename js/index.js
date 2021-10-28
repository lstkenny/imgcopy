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
function getTileSrc(image, x, y, w, h) {
	const cnv = document.createElement("canvas")
	cnv.width = w
	cnv.height = h
	const ctx = cnv.getContext("2d")
	ctx.drawImage(
		image,
		x * w, y * h,
		w, h,
		0, 0,
		cnv.width, cnv.height
	)
	return cnv.toDataURL()
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
function createTiles(image, cols, rows) {
	const width = image.width / cols
	const height = image.height / rows
	const tiles = []
	const relWidth = (100 / (cols - 1))
	const relHeight = (100 / (rows - 1))
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			const relX = col * relWidth
			const relY = row * relHeight
			tiles.push({
				col, row,
				relX, relY,
				width, height,
				src: getTileSrc(image, col, row, width, height)
			})
		}
	}
	return shuffle(tiles)
}
function createPuzzle(img, container) {
	const cols = container.dataset.cols || 10
	const rows = container.dataset.rows || 10
	for (let name in container.dataset) {
		container.removeAttribute(`data-${name}`)
	}
	const colSize = 100 / cols
	const rowSize = 100 / rows
	const tiles = createTiles(img, cols, rows)
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
	return styles
}
function makeProtectedPicture(container) {
	const img = document.createElement("img")
	img.setAttribute("src", `${container.dataset.base}/${container.dataset.src}`)
	img.setAttribute("crossOrigin", "anonymous")
	container.style.width = `${container.dataset.width || img.width}px`
	container.style.height = `${container.dataset.height || img.height}px`
	return new Promise((resolve, reject) => {
		img.addEventListener("load", e => {
			resolve(createPuzzle(img, container))
		})
	})
}
async function processImages(imageSelector) {
	const imageContainerClass = "pimg-container"
	let styles = [
		[`.${imageContainerClass}`,
			["position", "relative"]
		],
		[`.${imageContainerClass} div`,
			["position", "absolute"],
			["top", "0"],
			["right", "0"],
			["bottom", "0"],
			["left", "0"],
			["background-repeat", "no-repeat"]
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
processImages('[data-type="pimg"]')