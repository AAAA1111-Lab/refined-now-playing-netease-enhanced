export const waitForElement = (selector, fun) => {
	selector = selector.split(',');
	let done = true;
	for (const s of selector) {
		if (!document.querySelector(s)) {
			done = false;
		}
	}
	if (done) {
		for (const s of selector) {
			fun.call(this, document.querySelector(s));
		}
		return;
	}
	let interval = setInterval(() => {
		let done = true;
		for (const s of selector) {
			if (!document.querySelector(s)) {
				done = false;
			}
		}
		if (done) {
			clearInterval(interval);
			for (const s of selector) {
				fun.call(this, document.querySelector(s));
			}
		}
	}, 100);
}
export const waitForElementAsync = async (selector) => {
	if (document.querySelector(selector)) {
		return document.querySelector(selector);
	}
	return await betterncm.utils.waitForElement(selector);
}
export const getSetting = (option, defaultValue = '') => {
	if (option.endsWith('-fm')) {
		option = option.replace(/-fm$/, '');
	}
	option = "refined-now-playing-" + option;
	let value = localStorage.getItem(option);
	if (!value) {
		value = defaultValue;
	}
	if (value === 'true') {
		value = true;
	} else if (value === 'false') {
		value = false;
	}
	return value;
}
export const setSetting = (option, value) => {
	option = "refined-now-playing-" + option;
	localStorage.setItem(option, value);
}
export const chunk = (input, size) => {
	return input.reduce((arr, item, idx) => {
		return idx % size === 0
			? [...arr, [item]]
			: [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
	}, []);
};
export const copyTextToClipboard = (text) => {
	const textarea = document.createElement('textarea');
	textarea.style.position = 'fixed';
	textarea.style.top = '0';
	textarea.style.left = '0';
	textarea.style.opacity = '0';
	textarea.style.pointerEvents = 'none';
	textarea.value = text;
	document.body.appendChild(textarea);
	textarea.select();
	document.execCommand('copy', true);
	document.body.removeChild(textarea);
}
export const cyrb53 = (str, seed = 0) => {
	let h1 = 0xdeadbeef ^ seed,
		h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/* 调试日志：默认关闭，设置 localStorage["rnp-debug"]="1" 开启 */
const isDebugEnabled = () => {
	try {
		return localStorage.getItem('rnp-debug') === '1';
	} catch (e) {
		return false;
	}
}
export const debugLog = (...args) => {
	if (isDebugEnabled()) console.log(...args);
}
export const debugGroup = (name, ...args) => {
	if (isDebugEnabled()) {
		console.group(name);
		for (const arg of args) console.log(arg);
		console.groupEnd();
	}
}

export const getPlugin = () => {
	const name = "RefinedNowPlaying Enhanced";
	return Object.values(loadedPlugins).find(x => x.manifest.name === name) || loadedPlugins.RefinedNowPlaying || loadedPlugins["refined-now-playing-netease"];
}
/* 渲染辅助：使用网易云页面提供的全局 ReactDOM（与组件所用的全局 React 配套） */
export const renderRoot = (container, element) => {
	return ReactDOM.render(element, container);
}
export const unmountRoot = (container) => {
	return ReactDOM.unmountComponentAtNode(container);
}

/* 批量合并 setState：原生回调里连续多次 setState 在 legacy 渲染模式下会各自
   触发一次独立的同步全量渲染，合并为一次可降低高频路径的渲染次数 */
export const batchUpdates = (fn) => {
	if (typeof ReactDOM !== 'undefined' && typeof ReactDOM.unstable_batchedUpdates === 'function') {
		ReactDOM.unstable_batchedUpdates(fn);
	} else {
		fn();
	}
}
