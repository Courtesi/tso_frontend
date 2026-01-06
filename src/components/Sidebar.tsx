import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
	isOpen?: boolean;
}

function Sidebar({ isOpen = true }: SidebarProps) {
	const location = useLocation();

	const navItems = [
		{
			name: 'Arbitrage',
			path: '/dashboard',
			description: 'Live betting opportunities'
		},
		{
			name: 'Terminal',
			path: '/terminal',
			description: 'Line movement tracker'
		},
		// {
		// 	name: 'Settings',
		// 	path: '/settings',
		// 	description: 'Account settings'
		// },
	];

	return (
		<div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
			isOpen ? 'w-64' : 'w-0'
		} overflow-hidden`}>
			<div className="p-4">
				<nav className="space-y-2">
					{navItems.map((item) => {
						const isActive = location.pathname === item.path;

						return (
							<Link
								key={item.path}
								to={item.path}
								className={`block px-4 py-3 rounded-lg transition-colors ${
									isActive
										? 'bg-indigo-600 text-white'
										: 'text-gray-300 hover:bg-gray-800 hover:text-white'
								}`}
							>
								<div className="font-medium">{item.name}</div>
								<div className="text-xs text-gray-400">{item.description}</div>
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}

export default Sidebar;