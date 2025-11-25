import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStripe } from '../contexts/StripeContext';

interface DeleteAccountModalProps {
	isOpen: boolean;
	onClose: () => void;
}

function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
	const { currentUser, deleteAccount } = useAuth();
	const { subscription, subscriptionLoading } = useStripe();
	const [confirmText, setConfirmText] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	if (!isOpen) return null;

	// Check if user is using email/password authentication
	const isEmailPasswordUser = currentUser?.providerData.some(
		provider => provider.providerId === 'password'
	);

	const handleDelete = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		// Validate confirmation text
		if (confirmText !== 'DELETE') {
			setError('Please type DELETE to confirm');
			return;
		}

		// Validate password for email/password users
		if (isEmailPasswordUser && !password) {
			setError('Please enter your password to confirm');
			return;
		}

		setLoading(true);

		try {
			await deleteAccount(isEmailPasswordUser ? password : undefined);
			// Account deleted successfully - user will be automatically signed out
			// No need to close modal as user will be redirected
		} catch (err: any) {
			setError(err.message || 'Failed to delete account');
			setLoading(false);
		}
	};

	const handleClose = () => {
		setConfirmText('');
		setPassword('');
		setError('');
		setLoading(false);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-md"
				onClick={handleClose}
			/>

			{/* Modal */}
			<div className="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8">
				{/* Close button */}
				<button
					onClick={handleClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>

				{/* Header */}
				<div className="mb-6 text-center">
					<div className="mx-auto mb-2 gap-2 flex items-center justify-center">
						<h2 className="text-2xl font-bold text-white">
							Delete Account
						</h2>
						<svg className="w-8 h-8 text-gray-300 bg-gray-700 rounded-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					
					<p className="text-gray-400 text-sm">
						This action cannot be undone. Your account will be permanently deleted.
					</p>
				</div>

				{/* Error message */}
				{error && (
					<div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded text-red-200 text-sm">
						{error}
					</div>
				)}

				<form onSubmit={handleDelete} className="space-y-4">
					{/* Warning List */}
					<div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 mb-4">
						<p className="text-sm text-gray-200 font-semibold mb-2">This will:</p>
						<ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
							<li>Delete your account's data and credentials</li>
							<li>Cancel any active subscriptions</li>
							<li>Sign you out immediately</li>
						</ul>
					</div>

					{/* Active Subscription Warning */}
					{subscription && !subscriptionLoading && (
						<div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
							<p className="text-sm text-red-300 font-semibold mb-2">
								Active Subscription Will Be Deleted
							</p>
							<p className="text-sm text-gray-300">
								Your <span className="font-semibold text-white">{subscription.product?.name || 'Premium'}</span> subscription will be immediately deleted.
							</p>
							{subscription.current_period_end && (
								<p className="text-xs text-gray-400 mt-1">
									{subscription.cancel_at_period_end
										? `Access was scheduled until ${new Date(subscription.current_period_end.seconds * 1000).toLocaleDateString()}`
										: `Next billing date: ${new Date(subscription.current_period_end.seconds * 1000).toLocaleDateString()}`
									}
								</p>
							)}
						</div>
					)}

					{/* Password field for email/password users */}
					{isEmailPasswordUser && (
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Enter your password to confirm
							</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
								placeholder="Your password"
							/>
						</div>
					)}

					{/* Confirmation text */}
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Type <span className="font-bold text-white">DELETE</span> to confirm
						</label>
						<input
							type="text"
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							required
							className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
							placeholder="Type DELETE"
						/>
					</div>

					{/* Buttons */}
					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || confirmText !== 'DELETE'}
							className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
						>
							{loading ? 'Deleting...' : 'Delete Account'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default DeleteAccountModal;
