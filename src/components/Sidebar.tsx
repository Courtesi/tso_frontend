import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';

function Sidebar() {
	const location = useLocation();
	const { isCollapsed, expandSidebar, collapseSidebar } = useSidebar();
	const collapseTimeoutRef = useRef<number | null>(null);

	const handleMouseEnter = () => {
		// Cancel any pending collapse
		if (collapseTimeoutRef.current) {
			clearTimeout(collapseTimeoutRef.current);
			collapseTimeoutRef.current = null;
		}
		expandSidebar();
	};

	const handleMouseLeave = () => {
		// Delay collapse for a smoother experience
		collapseTimeoutRef.current = window.setTimeout(() => {
			collapseSidebar();
		}, 300);
	};

	const navItems = [
		{
			name: 'Arbitrage',
			path: '/dashboard',
			available: true,
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			)
		},
		{
			name: 'Odds Charts',
			path: '/charts',
			available: true,
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
				</svg>
			)
		},
		{
			name: '+EV Bets',
			path: '/ev-bets',
			available: true,
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
				</svg>
			)
		},
		{
			name: "Politics Arbitrage",
			path: "/politics-arbitrage",
			available: false,
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			)
		},
		{
			name: "Settings",
			path: "/settings",
			available: true,
			icon: (
				<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			)
		}
	];

	return (
		<div
			className={`hidden md:block border-r-1 border-gray-700 fixed left-0 top-17 h-[calc(100vh-4.25rem)] bg-gray-950 transition-all duration-700 ease-in-out ${
				isCollapsed ? 'w-16' : 'w-64'
			} overflow-hidden z-30`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<div className="p-2 w-64">
					<nav className="space-y-2">
						{navItems.map((item) => {
							const isActive = location.pathname === item.path;

							if (!item.available) {
								return (
									<div
										key={item.path}
										className="flex items-center gap-3 rounded-lg opacity-50 cursor-not-allowed h-11 px-3"
										title={item.name}
									>
										<span className="text-gray-500 flex-shrink-0 p-2">{item.icon}</span>
										<div className={`overflow-hidden whitespace-nowrap transition-opacity duration-700 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
											<div className="font-medium text-gray-500">{item.name}</div>
										</div>
									</div>
								);
							}
							return (
								<Link
									key={item.path}
									to={item.path}
									className={`flex items-center gap-3 rounded-lg transition-colors h-11 px-3 ${
										isCollapsed
											? 'text-gray-300'
											: isActive
												? 'bg-indigo-600 text-white'
												: 'text-gray-300 hover:bg-gray-800 hover:text-white'
									}`}
									title={item.name}
								>
									<span className={`flex-shrink-0 p-2 rounded-lg transition-all duration-700 ${
										isCollapsed
											? isActive
												? 'bg-indigo-600 text-white'
												: 'hover:bg-gray-800'
											: ''
									}`}>{item.icon}</span>
									<div className={`overflow-hidden whitespace-nowrap transition-opacity duration-700 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
										<div className="font-medium">{item.name}</div>
									</div>
								</Link>
							);
						})}
					</nav>
			</div>
		</div>
	);
}

export default Sidebar;