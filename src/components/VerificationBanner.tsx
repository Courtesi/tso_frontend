import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function VerificationBanner() {
	const { currentUser, resendVerificationEmail } = useAuth();
	const [dismissed, setDismissed] = useState(false);
	const [resending, setResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);
	const [resendError, setResendError] = useState<string | null>(null);
	const [isVisible, setIsVisible] = useState(false);

	// Check if popup was dismissed in this session
	useEffect(() => {
		const isDismissed = sessionStorage.getItem('verification-popup-dismissed') === 'true';
		setDismissed(isDismissed);

		// Show popup with a slight delay for animation
		if (!isDismissed) {
			setTimeout(() => setIsVisible(true), 500);
		}
	}, []);

	// Don't show popup if:
	// - No user is signed in
	// - Email is already verified
	// - User signed in with Google (Google emails are pre-verified)
	// - Popup was dismissed
	if (!currentUser || currentUser.emailVerified || dismissed) {
		return null;
	}

	// Check if user signed in with Google by checking provider data
	const isGoogleUser = currentUser.providerData.some(
		provider => provider.providerId === 'google.com'
	);

	if (isGoogleUser) {
		return null;
	}

	const handleDismiss = () => {
		setIsVisible(false);
		// Wait for animation to finish before removing from DOM
		setTimeout(() => {
			setDismissed(true);
			sessionStorage.setItem('verification-popup-dismissed', 'true');
		}, 300);
	};

	const handleResend = async () => {
		setResending(true);
		setResendError(null);
		setResendSuccess(false);

		try {
			await resendVerificationEmail();
			setResendSuccess(true);
			// Auto-hide success message after 3 seconds
			setTimeout(() => setResendSuccess(false), 3000);
		} catch (error) {
			setResendError(error instanceof Error ? error.message : 'Failed to resend verification email');
		} finally {
			setResending(false);
		}
	};

	return (
		<div className="fixed bottom-6 right-6 z-50">
			<div
				className={`bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-300 rounded-2xl shadow-2xl max-w-sm transition-all duration-300 ${
					isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
				}`}
			>
				<div className="p-5">
					{/* Close button */}
					<button
						onClick={handleDismiss}
						className="absolute top-3 right-3 text-yellow-600 hover:text-yellow-800 transition-colors cursor-pointer"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					{/* Icon and content */}
					<div className="flex items-start gap-3 pr-6">
						<div className="flex-shrink-0 p-2 rounded-lg bg-yellow-200">
							<svg className="h-6 w-6 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
							</svg>
						</div>
						<div className="flex-1 pt-1">
							<h3 className="text-sm font-semibold text-yellow-900 mb-1">
								Verify your email
							</h3>
							<p className="text-xs text-yellow-800 mb-3">
								Please check your inbox for a verification link to activate your account.
							</p>

							{/* Status messages */}
							{resendSuccess && (
								<div className="mb-2 p-2 bg-green-100 border border-green-300 rounded-lg">
									<p className="text-xs text-green-700 font-medium">
										Verification email sent!
									</p>
								</div>
							)}
							{resendError && (
								<div className="mb-2 p-2 bg-red-100 border border-red-300 rounded-lg">
									<p className="text-xs text-red-700">
										{resendError}
									</p>
								</div>
							)}

							{/* Action button */}
							<button
								onClick={handleResend}
								disabled={resending || resendSuccess}
								className="text-xs font-medium text-yellow-700 hover:text-yellow-900 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
							>
								{resending ? 'Sending...' : 'Resend verification email'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
