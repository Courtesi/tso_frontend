import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DeleteAccountModal from './DeleteAccountModal';
import BugReportModal from './BugReportModal';
import { getUserAvatarColor } from '../utils/avatarUtils';

function UserMenu() {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isBugReportOpen, setIsBugReportOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const { currentUser, signOut, userTier } = useAuth();

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const handleSignOut = async () => {
		try {
			await signOut();
			setIsOpen(false);
		} catch (error) {
			console.error('Error signing out:', error);
		}
	};

	if (!currentUser) return null;

	// Get user initials for avatar
	const getInitials = () => {
		if (currentUser.displayName) {
			return currentUser.displayName
				.split(' ')
				.map(n => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		return currentUser.email?.[0]?.toUpperCase() || 'U';
	};

	// Get consistent color for this user
	const avatarColor = getUserAvatarColor(currentUser.uid);

	return (
		<div className="relative" ref={menuRef}>
			{/* User Avatar Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center transition-colors cursor-pointer"
			>
				<div
					className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-md transition-opacity hover:opacity-80"
					style={{
						backgroundColor: avatarColor.bg,
						color: avatarColor.text
					}}
				>
					{getInitials()}
				</div>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
					{/* User Info Section */}
					<div className="px-4 py-3 border-b border-gray-700">
						<p className="text-sm font-medium text-white">
							{currentUser.displayName || 'User'}
						</p>
						<p className="text-xs text-gray-400 truncate">
							{currentUser.email}
						</p>
						{/* Tier Badge */}
						<div className="mt-2">
							<span className={`inline-block px-2 py-1 text-xs rounded ${
								userTier === 'premium'
									? 'bg-green-600 text-white'
									: 'bg-gray-700 text-gray-300'
							}`}>
								{userTier === 'premium' ? 'Premium' : 'Free Tier'}
							</span>
						</div>
					</div>

					{/* Menu Items */}
					<div className="py-1">
						{/* Only show upgrade button for free tier users */}
						{userTier !== 'premium' && (
							<button
								onClick={() => {
									setIsOpen(false);
									navigate('/pricing');
								}}
								className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors cursor-pointer"
							>
								Upgrade to Premium
							</button>
						)}
						{/* Show manage subscription for premium users */}
						{userTier === 'premium' && (
							<button
								onClick={() => {
									setIsOpen(false);
									navigate('/pricing');
								}}
								className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors cursor-pointer"
							>
								Manage Subscription
							</button>
						)}
						{/* Settings */}
						<button
							onClick={() => {
								setIsOpen(false);
								navigate('/settings');
							}}
							className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-2"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Settings
						</button>
					</div>

					{/* Help & Support */}
					<div className="border-t border-gray-700 pt-1">
						<button
							onClick={() => {
								setIsOpen(false);
								setIsBugReportOpen(true);
							}}
							className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-2"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Report a Bug
						</button>
					</div>

					{/* Danger Zone */}
					<div className="border-t border-gray-700 pt-1">
						<button
							onClick={() => {
								setIsOpen(false);
								setIsDeleteModalOpen(true);
							}}
							className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 transition-colors cursor-pointer"
						>
							Delete Account
						</button>
						<button
							onClick={handleSignOut}
							className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors cursor-pointer"
						>
							Sign Out
						</button>
					</div>
				</div>
			)}

			{/* Delete Account Modal */}
			<DeleteAccountModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
			/>

			{/* Bug Report Modal */}
			<BugReportModal
				isOpen={isBugReportOpen}
				onClose={() => setIsBugReportOpen(false)}
			/>
		</div>
	);
}

export default UserMenu;
