interface PinButtonProps {
	arbId: string;
	isPinned: boolean;
	isStale?: boolean;
	onToggle: () => void;
}

function PinButton({ isPinned, isStale, onToggle }: PinButtonProps) {
	// Determine visual state
	const getButtonStyle = () => {
		if (isPinned && isStale) {
			return 'text-rose-600 hover:text-red-800';
		}
		if (isPinned) {
			return 'text-indigo-400 shadow-lg hover:text-indigo-400';
		}
		return 'text-gray-400 opacity-40 hover:opacity-100 hover:text-gray-300';
	};

	const getAriaLabel = () => {
		if (isPinned && isStale) {
			return 'Unpin stale arbitrage opportunity';
		}
		if (isPinned) {
			return 'Unpin arbitrage opportunity';
		}
		return 'Pin arbitrage opportunity';
	};

	// Pushpin icon SVG - filled when pinned, outline when unpinned
	const PinIcon = isPinned ? (
		// Filled pushpin icon
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className="w-5 h-5"
		>
			<path d="M16 4V2H8v2H2v2h2l1.5 8H7v2h4v6l1 1 1-1v-6h4v-2h1.5L20 6h2V4h-6zM9 12l-1-6h8l-1 6H9z" />
		</svg>
	) : (
		// Outline pushpin icon
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			className="w-5 h-5"
		>
			<path d="M12 17v5M9 11l-1.5-6h9L15 11M7 11h10M9 11v3h6v-3M8 5V3h8v2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			onToggle();
		}
	};

	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				onToggle();
			}}
			onKeyDown={handleKeyDown}
			className={`cursor-pointer transition-all duration-200 ${getButtonStyle()}`}
			aria-label={getAriaLabel()}
			title={isStale ? 'This arb may no longer be available. Click to unpin.' : isPinned ? 'Click to unpin' : 'Click to pin'}
		>
			{PinIcon}
		</button>
	);
}

export default PinButton;
