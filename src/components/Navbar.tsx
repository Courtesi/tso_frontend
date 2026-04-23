import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MobileMenu from './MobileMenu';
import DashboardMobileMenu from './DashboardMobileMenu';
import UserMenu from './UserMenu';
import BugReportModal from './BugReportModal';

interface NavbarProps {
	onAuthModalOpen?: () => void;
}

function Navbar({ onAuthModalOpen }: NavbarProps) {
	const { currentUser, userTier } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [isBugReportOpen, setIsBugReportOpen] = useState(false);

	// Check which page we're on
	const isDashboard = location.pathname === '/dashboard';
	const isTerminal = location.pathname === '/charts';
	const isPricing = location.pathname === '/pricing';
	const isSettings = location.pathname === '/settings';
	const isEvBets = location.pathname === '/ev-bets';
	const isHome = location.pathname === '/';
	const isUserPage = isDashboard || isTerminal || isSettings || isEvBets;

	return (
		<div className={`bg-indigo-900 ${isUserPage ? 'bg-slate-900 md:bg-gray-950 border-b-1 border-gray-700' : 'md:bg-transparent'} justify-center fixed top-0 left-0 right-0 z-30 h-17`}>
			{/* Floating Logo - stays fixed on screen */}
			<div className="fixed top-5 md:top-4 left-6 z-40">
				<button
					onClick={() => navigate('/')}
					className="md:mt-1 flex gap-2 cursor-pointer"
				>
					<img src="/logo.png" alt="TrueShotOdds Logo" className="w-8" />
					<span className="font-extrabold text-2xl text-gray-50">TrueShotOdds</span>
				</button>
			</div>

			{/* Mobile Menu - Top Right (Mobile Only) */}
			<div className="fixed right-6 top-3 z-40 md:hidden">
				{isUserPage ? <DashboardMobileMenu /> : <MobileMenu />}
			</div>

			{/* Desktop Nav - Top Right (Desktop Only) */}
			<div className="hidden md:flex fixed top-4 right-6 z-40 items-center gap-3">
				{/* Bug Report Button - Always visible */}
				{!isHome && (
					<button
						onClick={() => setIsBugReportOpen(true)}
						className="bg-gray-800/80 hover:bg-gray-700 p-2 rounded-full transition-colors shadow-lg cursor-pointer group"
						aria-label="Report a bug"
						title="Report a bug"
					>
						<svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</button>
				)}

				{currentUser && userTier === 'free' && !isPricing && (
					<button
						onClick={() => navigate('/pricing')}
						className="bg-gray-100 hover:bg-gray-300 text-black text-lg font-semibold px-3 py-1 rounded-xl transition-colors shadow-lg cursor-pointer"
					>
						Upgrade
					</button>
				)}
				{isUserPage ? (
				<UserMenu />
			) : currentUser ? (
					<button
						onClick={() => navigate('/dashboard')}
						className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-2xl transition-colors shadow-lg cursor-pointer"
						aria-label="Open Dashboard"
					>
						<div className="font-bold text-lg text-gray-50">
							Open Dashboard
						</div>
					</button>
				) : (
					<button
						onClick={onAuthModalOpen}
						className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-2xl transition-colors shadow-lg cursor-pointer"
						aria-label="Sign in"
					>
						<div className="font-bold text-lg">
							Log In
						</div>
					</button>
				)}
			</div>

			{/* Bug Report Modal */}
			<BugReportModal
				isOpen={isBugReportOpen}
				onClose={() => setIsBugReportOpen(false)}
			/>
		</div>
	);
}

export default Navbar;
