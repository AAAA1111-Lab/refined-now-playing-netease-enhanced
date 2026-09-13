import './context-menu.scss';
import { renderRoot, unmountRoot } from './utils.js';

const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect;
const useCallback = React.useCallback;
const useState = React.useState;
const useRef = React.useRef;

function ContextMenu(props) {
	// props:
	// items: [{html: '', label: '', callback: () => {}}, ...] // label or html is required, if both are provided, html will be used
	// x: number
	// y: number
	const menuRef = useRef(null);
	const [position, setPosition] = useState({x: props.x ?? 0, y: props.y ?? 0});

	useLayoutEffect(() => {
		const menu = menuRef.current;
		const {x, y} = position;
		const {width, height} = menu.getBoundingClientRect();
		const {innerWidth, innerHeight} = window;
		
		menu.style.left = '';
		menu.style.right = '';
		menu.style.top = '';
		menu.style.bottom = '';

		let anchor = '';

		if (x + width > innerWidth) {
			menu.style.right = `${innerWidth - x}px`;
			anchor += 'right';
		} else {
			menu.style.left = `${x}px`;
			anchor += 'left';
		}
		anchor += ' ';
		if (y + height > innerHeight) {
			menu.style.bottom = `${innerHeight - y}px`;
			anchor += 'bottom';
		} else {
			menu.style.top = `${y}px`;
			anchor += 'top';
		}
		menu.style.transformOrigin = anchor;
		menu.animate([
			{width: '0px', height: '0px', opacity: 0.3},
			{width: `${width}px`, height: `${height}px`, opacity: 1}
		], {
			duration: 150,
			easing: 'cubic-bezier(0.4, 0, 0, 1)',
			fill: 'forwards'
		});
	}, [position]);

	const closeMenu = useCallback(() => {
		menuRef.current.animate([
			{opacity: 1},
			{opacity: 0}
		], {
			duration: 150,
			easing: 'ease-out',
			fill: 'forwards'
		}).onfinish = () => {
			unmountRoot(props.parent);
			props.parent.remove();
		}
	}, []);

	useEffect(() => {
		// 捕获元素引用：卸载时 React 已把 ref 置空，清理函数不能再用 menuRef.current
		const menuEl = menuRef.current;
		menuEl.focus();
		menuEl.addEventListener('blur', closeMenu);
		return () => {
			menuEl.removeEventListener('blur', closeMenu);
		}
	}, []);


	return ( 
		<div className="rnp-context-menu" tabIndex={0} ref={menuRef}>
			{props.items.map((item, index) => (
				item.divider ?
				<div className="rnp-context-menu-devider" key={index} />
				:
				<div 
					key={index}
					className="rnp-context-menu-item"
					onClick={
						() => {
							if (item.callback) {
								item.callback();
							}
							closeMenu();
						}
					}
				>
					{item.html ? <div dangerouslySetInnerHTML={{__html: item.html}} /> : item.label}
				</div>
			))}
		</div>
	)
}

export function showContextMenu(x, y, items) {
	const div = document.createElement('div');
	document.body.appendChild(div);
	renderRoot(div, <ContextMenu items={items} x={x} y={y} parent={div} />);
}