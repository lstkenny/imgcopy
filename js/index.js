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

function cutImage(image, pcs = 10) {
	const pw = image.width / pcs
	const ph = image.height / pcs
	const tiles = []
	const rs = (100 / (pcs - 1))
	for (let x = 0; x < pcs; ++x) {
		for (let y = 0; y < pcs; ++y) {
			const rx = x * rs
			const ry = y * rs
			tiles.push({
				x, y, 
				rx, ry, 
				pw, ph,
				src: getTileSrc(image, x, y, pw, ph)
			})
		}
	}
	// return shuffle(tiles)
	return tiles
}

const imageSelector = '[data-type="pimg"]'
const imageContainerClass = "pimg-container"
const pcs = 10
const idGen = getId()

const styles = [
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

document.querySelectorAll(imageSelector).forEach(container => {
	const img = document.createElement("img")
	img.setAttribute("src", `${container.dataset.base}/${container.dataset.src}`)
	img.setAttribute("crossOrigin", "anonymous")
	container.removeAttribute("data-base")
	container.removeAttribute("data-src")
	img.addEventListener("load", e => {
		const pieces = cutImage(img, pcs)
		container.setAttribute("class", imageContainerClass)
		container.style.width = `${container.dataset.width || img.width}px`
		container.style.height = `${container.dataset.height || img.height}px`
		let id = Date.now()
		pieces.forEach(tile => {
			const layer = document.createElement("div")
			layer.id = idGen.next().value
			styles.push([
				`#${layer.id}`,
					["background-image", `url(${tile.src})`],
					["background-size", `${100 / pcs + 0.05}%`],
					["background-position", `${tile.rx}% ${tile.ry}%`],
			])
			container.appendChild(layer)
		})
		addStylesheetRules(styles)
	})
})