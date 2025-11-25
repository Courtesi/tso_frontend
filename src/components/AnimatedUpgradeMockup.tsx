import { useState, useEffect } from 'react';
import { useInView } from '../hooks/useInView';

function AnimatedUpgradeMockup() {
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

		let timeouts: number[] = [];

		const runAnimation = () => {
			// Clear any existing timeouts from previous cycle
			timeouts.forEach(timeout => clearTimeout(timeout));
			timeouts = [];

			// Schedule animation steps
			timeouts.push(setTimeout(() => setStep(1), 500));    // Step 1: Show cards
			timeouts.push(setTimeout(() => setStep(2), 900));   // Step 2: Select premium
			timeouts.push(setTimeout(() => setStep(3), 1200));   // Step 3: Show processing
			timeouts.push(setTimeout(() => {
				setShowSuccess(true);
				setStep(4);
			}, 2800));   // Step 4: Show success popup (extended from 3000ms to 3500ms)
			timeouts.push(setTimeout(() => {
				setStep(0);
				setShowSuccess(false);
				runAnimation();  // Loop: restart animation
			}, 5900));   // Reset and loop (adjusted from 5600ms to 6100ms)
		};

		runAnimation();  // Start first cycle

		// Cleanup function
		return () => {
			timeouts.forEach(timeout => clearTimeout(timeout));
		};
	}, [isInView]);

	return (
		<div ref={ref} className="relative w-full h-full bg-gradient-to-bl from-teal-950 from-10% to-teal-500/80 to-90% flex items-center justify-center p-4 overflow-hidden rounded-xl">

			{/* Success Popup Notification */}
			<div className={`absolute top-3 md:top-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ${
				showSuccess ? 'translate-y-0 opacity-100' : 'opacity-0'
			}`}>
				<div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl px-2 lg:px-6 py-1 lg:py-3 shadow-2xl flex items-center gap-3">
					{/* Premium star icon */}
					<svg className="w-6 h-6 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
					</svg>
					{/* Success message */}
					<div>
						<p className="text-yellow-900 font-bold text-xs lg:text-sm px-1">Upgrade Complete!</p>
						<p className="hidden xl:block text-yellow-900/80 text-xs">You now have Premium access</p>
					</div>
				</div>
			</div>

			{/* Pricing Cards Container */}
			<div className="grid grid-cols-2 gap-3 w-full max-w-2xl max-h-full scale-90 sm:scale-90 lg:scale-100">

				{/* Free Card */}
				<div className={`bg-slate-900 backdrop-blur-md border border-gray-500/20 shadow-xl rounded-xl p-4 lg:p-8 transition-all duration-700 ${
					step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
				} ${step >= 2 ? 'opacity-40 scale-85' : ''}`}>
					<div className="text-left mb-8">
						<h3 className="capitalize text-lg md:text-3xl font-bold text-white mb-2">Free</h3>
						<p className="text-gray-200 text-sm">Use Trueshot's basic features</p>
						<div className="text-4xl font-bold text-gray-100 mt-4">
							$0
						</div>
					</div>

					<ul className="hidden sm:block md:hidden lg:block space-y-3 text-sm lg:text-xs xl:text-sm">
						<li className="text-gray-200">
							Live odds charts
						</li>
						<li className="text-gray-200">
							5 arbitrage bets at a time
						</li>
						<li className="text-gray-200">
							Finds bets every 60 seconds
						</li>
					</ul>
				</div>

				{/* Premium Card */}
				<div className={`relative bg-gradient-to-b from-fuchsia-700/50 to-violet-900/50 backdrop-blur-md border border-indigo-500 shadow-xl rounded-xl p-4 lg:p-8 transition-all duration-700 ${
					step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
				} ${
					step === 2 ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 scale-105' : ''
				} ${
					step >= 2 ? 'border-yellow-400 shadow-xl shadow-yellow-400/60' : ''
				}`}>

					{/* Selected checkmark */}
					{step >= 2 && (
						<div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-lg animate-scale-in z-10">
							<svg className="w-4 h-4 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
							</svg>
						</div>
					)}

					<div className="text-left mb-8 relative">
						<h3 className="capitalize text-lg lg:text-3xl font-bold text-white mb-2">Premium</h3>
						<p className="text-gray-100 text-xs lg:text-sm">Access to all premium features</p>
						<div className="text-4xl font-bold text-white mt-4">
							$10
							<span className="text-lg text-gray-200">/month</span>
						</div>
					</div>

					<ul className="hidden sm:block md:hidden lg:block space-y-3 text-sm lg:text-xs xl:text-sm">
						<li className="hidden xl:block text-white font-medium">
							Everything in Free, and:
						</li>
						<li className="text-white font-medium">
							Unlimited arbitrage bets
						</li>
						<li className="text-white font-medium">
							Real time updates on bets
						</li>
					</ul>

					{/* Processing indicator */}
					{step === 3 && (
						<div className="absolute inset-0 bg-indigo-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
							<div className="flex items-center gap-2 text-white">
								<svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span className="text-xs font-medium">Processing...</span>
							</div>
						</div>
					)}
				</div>

			</div>
		</div>
	);
}

export default AnimatedUpgradeMockup;
