import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
	const [isSignUp, setIsSignUp] = useState(false);
	const [isForgotPassword, setIsForgotPassword] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [fullName, setFullName] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [signUpSuccess, setSignUpSuccess] = useState(false);
	const [resetEmailSent, setResetEmailSent] = useState(false);

	const { signIn, signUp, signInWithGoogle, currentUser, resetPassword } = useAuth();
	const navigate = useNavigate();

	if (!isOpen) return null;

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await signIn(email, password);
			// Close modal on success
			onClose();
			resetForm();
			navigate('/dashboard');
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to sign in');
		} finally {
			setLoading(false);
		}
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		// Validation
		if (!fullName.trim()) {
			setError('Full name is required');
			return;
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		if (password.length < 8 || password.length > 50) {
			setError('Password must be at least 6 characters');
			return;
		}

		// If password does not have an uppercase letter
		if (!/[A-Z]/.test(password)) {
			setError('Password must contain at least one uppercase letter');
			return;
		}

		// If password does not have a number
		if (!/[0-9]/.test(password)) {
			setError('Password must contain at least one number');
			return;
		}

		// If password does not have a lowercase letter
		if (!/[a-z]/.test(password)) {
			setError('Password must contain at least one lowercase letter');
			return;
		}

		setLoading(true);

		try {
			await signUp(email, password, fullName);
			// Show success message
			setSignUpSuccess(true);
			// Close modal after 2 seconds to let user see the message
			setTimeout(() => {
				onClose();
				resetForm();
				setSignUpSuccess(false);
				navigate("/dashboard");
			}, 2000);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to sign up');
		} finally {
			setLoading(false);
		}
	};

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await resetPassword(email);
			setResetEmailSent(true);
			// Auto switch back to sign-in after 3 seconds
			setTimeout(() => {
				setIsForgotPassword(false);
				setResetEmailSent(false);
			}, 3000);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to send reset email');
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setFullName('');
		setError('');
		setIsSignUp(false);
		setIsForgotPassword(false);
		setResetEmailSent(false);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleGoogleSignIn = async () => {
		setError('');
		setLoading(true);

		try {
			await signInWithGoogle();
			// Close modal on success
			onClose();
			resetForm();
			navigate('/dashboard');
		} catch (err: unknown) {
			console.error('Google sign-in error:', err);
			const code = err instanceof Error && 'code' in err ? (err as Error & { code: string }).code : null;
			if (code === 'auth/popup-closed-by-user') {
				setError('Sign-in popup was closed');
			} else if (code === 'auth/popup-blocked') {
				setError('Pop-up was blocked by your browser. Please enable pop-ups and try again.');
			} else {
				setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-md"
				onClick={handleClose}
			/>

			{/* Modal */}
			<div className="relative bg-gradient-to-br from-indigo-900/80 to-indigo-950/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8">
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
					<h2 className="text-2xl font-bold text-white mb-2">
						{isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
					</h2>
					<p className="text-gray-400 text-sm">
						{isForgotPassword ? (
							<>
								Remember your password?{' '}
								<button
									type="button"
									onClick={() => {
										setIsForgotPassword(false);
										setError('');
										setResetEmailSent(false);
									}}
									className="font-medium text-indigo-300 hover:text-white transition-colors cursor-pointer"
								>
									Sign In
								</button>
							</>
						) : isSignUp ? (
							<>
								Already have an account?{' '}
								<button
									type="button"
									onClick={() => {
										setIsSignUp(false);
										setError('');
									}}
									className="font-medium text-indigo-300 hover:text-white transition-colors cursor-pointer"
								>
									Sign In
								</button>
							</>
						) : (
							<>
								Don't have an account?{' '}
								<button
									type="button"
									onClick={() => {
										setIsSignUp(true);
										setError('');
									}}
									className="font-medium text-indigo-300 hover:text-white transition-colors cursor-pointer"
								>
									Sign Up
								</button>
							</>
						)}
					</p>
				</div>

				{/* Error message */}
				{error && (
					<div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-200 text-sm">
						{error}
					</div>
				)}

				{/* Success message */}
				{signUpSuccess && (
					<div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-500 rounded text-green-200 text-sm">
						Account created successfully! Please check your email to verify your account.
					</div>
				)}

				{/* Password reset email sent message */}
				{resetEmailSent && (
					<div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-500 rounded text-green-200 text-sm">
						Password reset email sent! Please check your inbox for instructions.
					</div>
				)}

				{/* Verification reminder for unverified users on sign-in */}
				{!isSignUp && !isForgotPassword && currentUser && !currentUser.emailVerified && !currentUser.providerData.some(p => p.providerId === 'google.com') && (
					<div className="mb-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded text-yellow-200 text-sm">
						Your email is not verified. Please check your inbox for a verification link.
					</div>
				)}

				{/* Forgot Password Form */}
				{isForgotPassword && (
					<form onSubmit={handleForgotPassword} className="space-y-6">
						<p className="text-gray-300 text-sm mb-4">
							Enter your email address and we'll send you a link to reset your password.
						</p>
						<div>
							<input
								id="reset-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
								placeholder="Email Address"
							/>
						</div>

						<button
							type="submit"
							disabled={loading || resetEmailSent}
							className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
						>
							{loading ? 'Sending...' : resetEmailSent ? 'Email Sent!' : 'Send Reset Link'}
						</button>
					</form>
				)}

				{/* Sign In Form */}
				{!isSignUp && !isForgotPassword && (
					<form onSubmit={handleSignIn} className="space-y-8">
						<div>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
								placeholder="Email Address"
							/>
						</div>

						<div>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
								placeholder="Password"
							/>
							{/* Forgot Password Link */}
							<div className="text-right mt-2">
								<button
									type="button"
									onClick={() => {
										setIsForgotPassword(true);
										setError('');
									}}
									className="text-xs text-indigo-300 hover:text-white transition-colors cursor-pointer"
								>
									Forgot Password?
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg"
						>
							{loading ? 'Signing in...' : 'Sign In'}
						</button>

						{/* Divider */}
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-white/10"></div>
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-4 bg-gradient-to-br from-indigo-900/80 to-indigo-950/80 text-gray-400">OR</span>
							</div>
						</div>

						{/* Google Sign-In Button */}
						<button
							type="button"
							onClick={handleGoogleSignIn}
							disabled={loading}
							className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24">
								<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
							{loading ? 'Signing in...' : 'Continue with Google'}
						</button>
					</form>
				)}

				{/* Sign Up Form */}
				{isSignUp && (
					<form onSubmit={handleSignUp} className="space-y-6">
						<div>
							<input
								id="fullName"
								type="text"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								required
								className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
								placeholder="Full Name"
							/>
						</div>

						<div>
							<input
								id="signup-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
								placeholder="Email Address"
							/>
						</div>

						<div>
							<input
								id="signup-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
								placeholder="Password"
							/>
							{/* <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p> */}
						</div>

						<div>
							<input
								id="confirm-password"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
								placeholder="Confirm Password"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg"
						>
							{loading ? 'Creating account...' : 'Create Account'}
						</button>

						{/* Divider */}
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-white/10"></div>
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-4 bg-gradient-to-br from-indigo-900/80 to-indigo-950/80 text-gray-400">OR</span>
							</div>
						</div>

						{/* Google Sign-Up Button */}
						<button
							type="button"
							onClick={handleGoogleSignIn}
							disabled={loading}
							className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24">
								<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
							{loading ? 'Creating account...' : 'Continue with Google'}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}

export default AuthModal;
