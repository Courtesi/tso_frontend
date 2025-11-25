import { useState, useEffect } from 'react';
import { useInView } from '../hooks/useInView';

function AnimatedSignupMockup() {
	const [step, setStep] = useState(0);
	const [showSuccess, setShowSuccess] = useState(false);
	const { ref, isInView } = useInView();

	useEffect(() => {
		if (!isInView) {
			// Reset animation when scrolled out of view
			setStep(0);
			setShowSuccess(false);
			return;
		}

		// Animation sequence timing
		const timers = [
			setTimeout(() => setStep(1), 500),   // Show full name field
			setTimeout(() => setStep(2), 1000),   // Show email field
			setTimeout(() => setStep(3), 1500),  // Show password field
			setTimeout(() => setStep(4), 2000),  // Show confirm password field
			setTimeout(() => setStep(5), 2600),  // Show button
			setTimeout(() => setStep(6), 3200),  // Button click animation
			setTimeout(() => {
				setShowSuccess(true);
				setStep(7);
			}, 3800), // Show success
			setTimeout(() =>setStep(0), 3900),
			setTimeout(() => setShowSuccess(false), 4400)
		];

		return () => timers.forEach(timer => clearTimeout(timer));
	}, [showSuccess, isInView]);

	const getCursorPosition = (text: string, isPassword: boolean = false) => {
		const paddingLeft = 12; // px-3 = 12px
		const charWidth = isPassword ? 9 : 7.2; // bullets are wider
		return `${paddingLeft + (text.length * charWidth)}px`;
	};

	return (
		<div ref={ref} className="relative bg-gradient-to-br from-rose-900/90 to-orange-600/90 w-full h-full flex items-center justify-center">
			{/* Mockup Modal Container */}
			<div className="relative bg-gradient-to-br from-indigo-900/90 to-indigo-950/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm p-6 scale-50 sm:scale-80 md:scale-50 lg:scale-75 xl:scale-90">

				{/* Header */}
				<div className="mb-6 text-center">
					<h3 className={`text-xl font-bold text-white mb-1 transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
						Create Account
					</h3>
					<p className={`text-gray-400 text-xs transition-all duration-500 delay-100 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
						Join TrueshotOdds today
					</p>
				</div>

				{/* Success Overlay */}
				{showSuccess && (
					<div className="absolute inset-0 bg-gradient-to-br from-green-900/95 to-emerald-950/95 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center z-10 animate-fade-in">
						<div className="animate-scale-in">
							<svg className="w-20 h-20 text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<p className="text-white font-semibold text-lg">Account Created!</p>
						<p className="text-green-300 text-sm mt-2">Check your email to verify</p>
					</div>
				)}

				{/* Form Fields */}
				<div className="space-y-4">
					{/* Full Name Field */}
					<div className={`transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
						<div className="relative">
							<input
								type="text"
								readOnly
								value={step >= 1 ? "John Smith" : ""}
								className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none pointer-events-none"
								placeholder="Full Name"
							/>
							{step === 1 && (
								<div className="absolute top-2.5 w-1 h-4 bg-white animate-blink"
								style={{ left: getCursorPosition("John Smith") }}></div>
							)}
						</div>
					</div>

					{/* Email Field */}
					<div className={`transition-all duration-500 ${step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
						<div className="relative">
							<input
								type="email"
								readOnly
								value={step >= 2 ? "john@example.com" : ""}
								className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none pointer-events-none"
								placeholder="Email Address"
							/>
							{step === 2 && (
								<div className="absolute top-2.5 w-1 h-4 bg-white animate-blink"
								style={{ left: getCursorPosition("john@example.com  ") }}></div>
							)}
						</div>
					</div>

					{/* Password Field */}
					<div className={`transition-all duration-500 ${step >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
						<div className="relative">
							<input
								type="password"
								readOnly
								value={step >= 3 ? "••••••••" : ""}
								className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none pointer-events-none"
								placeholder="Password"
							/>
							{step === 3 && (
								<div className="absolute top-2.5 w-1 h-4 bg-white animate-blink"
								style={{ left: getCursorPosition("••••••••  ") }}></div>
							)}
						</div>
					</div>

					{/* Confirm Password Field */}
					<div className={`transition-all duration-500 ${step >= 4 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
						<div className="relative">
							<input
								type="password"
								readOnly
								value={step >= 4 ? "••••••••" : ""}
								className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none pointer-events-none"
								placeholder="Confirm Password"
							/>
							{step === 4 && (
								<div className="absolute top-2.5 w-1 h-4 bg-white animate-blink"
								style={{ left: getCursorPosition("••••••••  ") }}></div>
							)}
						</div>
					</div>

					{/* Submit Button */}
					<div className={`transition-all duration-500 pt-2 ${step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
						<button
							className={`w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg pointer-events-none ${
								step === 6 ? 'scale-95 bg-white/30' : ''
							}`}
						>
							{step === 6 ? 'Creating...' : 'Create Account'}
						</button>
					</div>

					{/* OR Divider */}
					<div className={`relative transition-all duration-500 ${step >= 5 ? 'opacity-100' : 'opacity-0'}`}>
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-white/10"></div>
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="px-3 bg-gradient-to-br from-indigo-900/90 to-indigo-950/90 text-gray-400">OR</span>
						</div>
					</div>

					{/* Google Button */}
					<div className={`transition-all duration-500 ${step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
						<button className="w-full bg-white/90 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md text-sm pointer-events-none">
							<svg className="w-4 h-4" viewBox="0 0 24 24">
								<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
							Continue with Google
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default AnimatedSignupMockup;
