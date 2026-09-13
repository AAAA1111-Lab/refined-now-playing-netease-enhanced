import { getSetting, setSetting } from "./utils";

// 与其他组件一致，使用网易云页面提供的全局 React
// （此前从 'react' 导入会引入打包内 React 副本，与全局 ReactDOM 渲染脱节导致崩溃）
const useState = React.useState;
const useEffect = React.useEffect;
const useRef = React.useRef;
const useMemo = React.useMemo;

import './font-settings.scss';

/* 轻量的多选字体选择器，替代原先的 MUI Autocomplete。
   MUI + emotion 仅在此处使用却占打包体积的约三分之一，
   自行实现多选 + 过滤 + 自由输入可显著减小产物体积、加快启动。 */
export function FontSettings(props) {
	const [fontList, setFontList] = useState([]);
	const [fontFamily, setFontFamily] = useState(() => {
		try {
			return JSON.parse(getSetting('font-family', '[]')) ?? [];
		} catch (e) {
			return [];
		}
	});
	const [inputValue, setInputValue] = useState('');
	const [open, setOpen] = useState(false);

	const rootRef = useRef(null);

	useEffect(() => {
		async function getFontList() {
			setFontList((await legacyNativeCmder.call("os.querySystemFonts"))[1] ?? []);
		};
		getFontList();
	}, []);

	useEffect(() => {
		let style = document.querySelector('#rnp-font-family-controller');
		if (!style) {
			style = document.createElement('style');
			style.id = 'rnp-font-family-controller';
			document.head.appendChild(style);
		}
		style.innerHTML = `
			body.rnp-custom-font .g-single-track .lyric *,
			body.rnp-custom-font .n-single .head *,
			body.rnp-custom-font .m-fm > *:not(.fmcmt) * {
				font-family: ${fontFamily.length ? fontFamily.map(font => `'${font}'`).join(', ') : 'inherit'} !important;
			}
		`;
		setSetting('font-family', JSON.stringify(fontFamily));
	}, [fontFamily]);

	// 点击组件外部时收起下拉
	useEffect(() => {
		if (!open) return;
		const onDocMouseDown = (e) => {
			if (rootRef.current && !rootRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', onDocMouseDown);
		return () => {
			document.removeEventListener('mousedown', onDocMouseDown);
		};
	}, [open]);

	const addFont = (font) => {
		const name = (font ?? '').trim();
		if (!name) return;
		setFontFamily((prev) => prev.includes(name) ? prev : [...prev, name]);
		setInputValue('');
	};
	const removeFont = (font) => {
		setFontFamily((prev) => prev.filter((x) => x !== font));
	};

	const filteredOptions = useMemo(() => {
		const query = inputValue.trim().toLowerCase();
		return fontList
			.filter((font) => !fontFamily.includes(font))
			.filter((font) => !query || font.toLowerCase().includes(query))
			.slice(0, 60);
	}, [fontList, fontFamily, inputValue]);

	return (
		<>
			<div className={`rnp-font-select ${open ? 'open' : ''}`} ref={rootRef}>
				<div className="rnp-font-select-control" onClick={() => rootRef.current?.querySelector('input')?.focus()}>
					{
						fontFamily.map((font) => (
							<span className="rnp-font-chip" key={font}>
								{font}
								<button
									className="rnp-font-chip-remove"
									title="移除"
									onClick={(e) => {
										e.stopPropagation();
										removeFont(font);
									}}
								>×</button>
							</span>
						))
					}
					<input
						className="rnp-font-input"
						value={inputValue}
						placeholder={fontFamily.length ? '' : '选择或输入字体'}
						onChange={(e) => {
							setInputValue(e.target.value);
							setOpen(true);
						}}
						onFocus={() => setOpen(true)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addFont(inputValue);
							} else if (e.key === 'Backspace' && !inputValue && fontFamily.length) {
								removeFont(fontFamily[fontFamily.length - 1]);
							}
						}}
					/>
				</div>
				{
					open && (
						<div className="rnp-font-dropdown">
							{
								filteredOptions.map((font) => (
									<div
										className="rnp-font-option"
										key={font}
										onMouseDown={(e) => {
											// 在 blur 之前完成选择
											e.preventDefault();
											addFont(font);
										}}
									>{font}</div>
								))
							}
							{
								filteredOptions.length === 0 && inputValue.trim() && (
									<div className="rnp-font-option rnp-font-option-add" onMouseDown={(e) => {
										e.preventDefault();
										addFont(inputValue);
									}}>添加 "{inputValue.trim()}"</div>
								)
							}
							{
								filteredOptions.length === 0 && !inputValue.trim() && (
									<div className="rnp-font-option rnp-font-option-empty">无匹配字体</div>
								)
							}
						</div>
					)
				}
			</div>
			<span className="rnp-checkbox-note">某些字体可能不在列表中，需要手动输入</span>
			<span className="rnp-checkbox-note">如果顺序在前的字体缺少某些字符，则会使用顺序在后的字体，依次顺延</span>
			<label className="rnp-checkbox-label">字体预设</label>
			<FontPreset fonts={['MiSans Medium', 'MiSans']} name="MISans" url="https://cdn.cnbj1.fds.api.mi-img.com/vipmlmodel/font/MiSans/MiSans.zip" setFontFamily={setFontFamily} fontList={fontList}/>
			<FontPreset fonts={['Source Han Sans SC VF', 'Source Han Sans CN', 'Noto Sans', '思源黑体', 'Source Han Sans VF', 'Source Han Sans']} name="思源黑体" url="https://github.com/adobe-fonts/source-han-sans/raw/release/Variable/OTF/SourceHanSansSC-VF.otf" setFontFamily={setFontFamily} fontList={fontList}/>
			<FontPreset fonts={['Source Han Serif SC VF', 'Source Han Serif CN', 'Noto Serif', '思源宋体', 'Source Han Serif VF', 'Source Han Serif']} name="思源宋体" url="https://github.com/adobe-fonts/source-han-serif/raw/release/Variable/OTF/SourceHanSerifSC-VF.otf" setFontFamily={setFontFamily} fontList={fontList}/>
			<FontPreset fonts={['PingFang SC', '苹方 常规'] } name="苹方" url="https://github.com/ShmilyHTT/PingFang/archive/refs/heads/master.zip" setFontFamily={setFontFamily} fontList={fontList}/>
			<FontPreset fonts={['Microsoft YaHei UI', 'Microsoft YaHei']} name="微软雅黑" url="" setFontFamily={setFontFamily} fontList={fontList}/>
			<FontPreset fonts={['Microsoft JhengHei UI', 'Microsoft JhengHei']} name="微软正黑" url="" setFontFamily={setFontFamily} fontList={fontList}/>
		</>
  );
}
function FontPreset(props) {
	const hasFont = props.fonts.some(font => props.fontList.includes(font));

	return (
		<div className="rnp-font-preset">
			<label className="rnp-font-preset-label">{props.name}</label>
			{
				hasFont && (
					<button className="rnp-font-preset-button" onClick={() => props.setFontFamily(props.fonts)}>应用</button>
				)
			}
			{
				!hasFont && (
					<button className="rnp-download-font-button" onClick={async() => {
						await betterncm.app.exec(props.url);
					}}>
						<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 96 960 960" width="20"><path d="M259.717 895q-40.442 0-69.08-28.787Q162 837.425 162 797v-74h98v74h440v-74h98v74q0 40.425-28.799 69.213Q740.401 895 699.96 895H259.717ZM481 727 249 495l70-68 113 113V203h98v337l113-113 70 68-232 232Z"/></svg>
					</button>
				)
			}
		</div>
	)
}
