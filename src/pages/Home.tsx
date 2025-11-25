import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useParticles } from '../contexts/ParticlesContext';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedSignupMockup from '../components/AnimatedSignupMockup';
import AnimatedUpgradeMockup from '../components/AnimatedUpgradeMockup';
import AnimatedDashboardMockup from '../components/AnimatedDashboardMockup';

import Particles from "@tsparticles/react";
import BugReportModal from '../components/BugReportModal';
// import type { Container } from "@tsparticles/engine";

function Home() {
	const { currentUser, userTier } = useAuth();
	const { init } = useParticles();
	const navigate = useNavigate();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isBugReportOpen, setIsBugReportOpen] = useState(false);

	// const particlesLoaded = useCallback(async (container?: Container) => {
    //     console.log('🌟 Particles loaded/reloaded at:', new Date().toISOString(), container);
    // }, []);

	const particlesOptions = useMemo(() => ({
		background: {
			color: {
				value: "transparent",
			},
		},
		fpsLimit: 60,
		fullScreen: {
			enable: false,
		},
		responsive: [],
		particles: {
			number: {
				value: 150,
				density: {
					enable: false
				}
			},
			color: {
				value: "#ffffff",
			},
			shape: {
				type: "circle",
			},
			opacity: {
				value: { min: 0.1, max: 0.8 },
				animation: {
					enable: true,
					speed: 0.5,
					sync: false,
				},
			},
			size: {
				value: { min: 0.5, max: 2.5 },
			},
			move: {
				enable: true,
				speed: 0.1,
				direction: "none" as const,
				random: false,
				straight: false,
				outModes: {
					default: "bounce" as const,
				},
			},
		},
		detectRetina: true,
	}), []);

	useEffect(() => {
		console.log('✅ Home component rendered, init:', init);
	}, [init]);

	return (
		<div className="min-h-screen text-white relative bg-gradient-to-br from-gray-900 via-indigo-900 to-indigo-950">


			{/* Starry Background - Full Page */}
			{init && (
				<Particles
					key="stable-particles"
					id="page-particles"
					className="fixed inset-0 z-0 pointer-events-none"
					options={particlesOptions}
				/>
			)}

			{/* Nav Links - scrolls with page */}
			<nav className="hidden md:flex absolute top-7 left-60 z-40 items-center gap-6">
				<button
					onClick={() => navigate('/pricing')}
					className="text-md font-bold text-gray-100 hover:text-white transition-colors cursor-pointer"
				>
					Pricing
				</button>
				<button
					onClick={() => setIsBugReportOpen(true)}
					className="text-md font-bold text-gray-100 hover:text-white transition-colors cursor-pointer"
				>
					Report a Bug
				</button>
			</nav>

			{/* Navigation Bar */}
			<Navbar onAuthModalOpen={() => setIsAuthModalOpen(true)} />

			{/* Main Content */}
			<div className="container mx-auto px-4 py-20">

				{/* Hero Banner */}
				<div className="max-w-6xl mx-auto lg:mb-16 mt-20">
					<div className="rounded-2xl">
						<div className="grid grid-cols-1 lg:flex gap-2">
							{/* Left Side - Text Content */}
							<div className="order-second lg:order-first p-12 flex flex-col justify-center">
								<h2 className="heading-hero uppercase text-center lg:text-left text-3xl lg:text-6xl text-gray-100 mb-4">
									Live Odds Straight To Your Feed
								</h2>
								<p className="text-xl text-gray-100 text-center lg:text-left mb-6">
									Trueshot focuses on getting real-time arbitrage bets delivered directly to your dashboard. Don't miss out as we expand our reach on sportsbooks.
								</p>
							</div>

							{/* Right Side - Image Placeholder */}
							<div className="order-first ml-12 lg:ml-0 lg:order-second flex items-center justify-center">
								<div className="text-center">
									<img
										src="/hero_banner.png"
										className="w-full scale-125 mx-auto text-white"
										alt="Hero Banner"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Buttons */}
				<div className="grid grid-cols-1 md:flex gap-4 justify-center mb-28">
					{currentUser && userTier === 'premium' ? (
						<button
							onClick={() => navigate('/dashboard')}
							className="backdrop-blur-lg bg-gray-100 hover:bg-gray-300 text-black text-xl font-semibold py-3 px-12 rounded-lg transition-colors cursor-pointer"
						>
							Go to Dashboard
						</button>
					) : currentUser && userTier === 'free' ? (
						<button
							onClick={() => navigate('/pricing')}
							className="backdrop-blur-lg bg-gray-100 hover:bg-gray-300 text-black text-xl font-semibold py-3 px-12 rounded-lg transition-colors cursor-pointer"
						>
							Upgrade Now
						</button>
					) : (
						<button
							onClick={() => setIsAuthModalOpen(true)}
							className="backdrop-blur-lg bg-gray-100 hover:bg-gray-300 text-black text-xl font-semibold py-3 px-14 rounded-lg transition-colors cursor-pointer"
						>
							Get Started
						</button>
					)}
					<button
						onClick={() => navigate('/pricing')}
						className="backdrop-blur-lg bg-gray-700 hover:bg-gray-600/100 text-white text-xl font-semibold py-3 px-14 rounded-lg transition-colors cursor-pointer"
					>
						View Plans
					</button>
				</div>

				{/* Onboarding Tutorial Section */}
				<div className="max-w-6xl mx-auto mb-28">

					{/* Step 1: Sign Up - Text on Left, Image on Right */}
					<div className="grid grid-cols-1 md:grid-cols-[40%_60%] px-4 md:px-20 py-6 md:py-10 gap-8 items-center mb-20 rounded-3xl md:rounded-[100px] bg-gradient-to-tr from-indigo-400/60 via-indigo-500/50 to-indigo-400/50 backdrop-blur-md border
  border-indigo-500/10 shadow-xl">
						<div className="order-2 md:order-1">
							<div className="flex items-center gap-3 mb-4">
								<h3 className="heading-hero uppercase text-2xl md:text-3xl text-gray-100">
									Make an Account
								</h3>
							</div>
							<p className="text-lg text-gray-200 leading-relaxed">
								Sign up in seconds. Verify your account. Get instant access to our platform right away.
							</p>
						</div>
						<div className="order-1 md:order-2">
							<div className="bg-gray-700/30 rounded-[40px] md:rounded-[90px] overflow-hidden aspect-[16/12] flex items-center justify-center">
								<AnimatedSignupMockup />
							</div>
						</div>
					</div>

					{/* Step 2: View Dashboard - Image on Left, Text on Right */}
					<div className="grid grid-cols-1 md:grid-cols-[60%_40%] px-4 md:px-14 py-6 md:py-10 gap-8 items-center mb-20 rounded-3xl md:rounded-[100px] bg-gradient-to-br from-indigo-400/60 via-indigo-500/30 to-indigo-400/30 backdrop-blur-md border
  border-indigo-500/10 shadow-xl">
						<div className="order-1">
							<div className="bg-gray-700 rounded-[40px] md:rounded-[90px] overflow-hidden aspect-[16/12] flex items-center justify-center">
								<AnimatedDashboardMockup />
							</div>
						</div>
						<div className="order-2">
							<div className="flex items-center gap-3 mb-4">
								<h3 className="heading-hero uppercase text-2xl md:text-3xl text-gray-100">
									Start Betting
								</h3>
							</div>
							<p className="text-lg text-gray-200 leading-relaxed">
								Access your dashboard and start exploring betting opportunities by taking advantage of the latest mispriced bets from our supported sportsbooks.
							</p>
						</div>
					</div>

					{/* Step 3: Subscribe - Text on Left, Image on Right */}
					<div className="grid grid-cols-1 md:grid-cols-[40%_60%] px-4 md:px-20 py-6 md:py-10 gap-8 items-center mb-20 rounded-3xl md:rounded-[100px] bg-gradient-to-tl from-indigo-300/50 via-indigo-400/50 to-indigo-300/20 backdrop-blur-md border
  border-indigo-500/10 shadow-xl">
						<div className="order-2 md:order-1">
							<div className="flex items-center gap-3 mb-4">
								<h3 className="heading-hero uppercase text-2xl md:text-3xl text-gray-100">
									Upgrade for Live Odds
								</h3>
							</div>
							<p className="text-lg text-gray-200 leading-relaxed">
								Subscribe to our premium plan to get real time odds delivered straight to your feed.
							</p>
						</div>
						<div className="order-1 md:order-2">
							<div className="bg-gray-700/30 rounded-[40px] md:rounded-[90px] overflow-hidden aspect-[16/12] flex items-center justify-center">
								<AnimatedUpgradeMockup />
							</div>
						</div>
					</div>
				</div>

				{/* Final CTA Section */}
				<div className="max-w-4xl mx-auto text-center">
					<div className="p-12 md:p-16">
						<h2 className="heading-hero uppercase text-4xl md:text-5xl text-gray-100 mb-12">
							Find your True Shot today and get started
						</h2>

						{currentUser ? (
							<button
								onClick={() => navigate('/dashboard')}
								className="backdrop-blur-lg bg-gray-100 hover:bg-gray-300 text-black text-xl font-semibold py-3 px-12 rounded-lg transition-colors cursor-pointer"
							>
								Go to Dashboard
							</button>
						) : (
							<button
								onClick={() => setIsAuthModalOpen(true)}
								className="backdrop-blur-lg bg-gray-100 hover:bg-gray-300 text-black text-xl font-semibold py-3 px-12 rounded-lg transition-colors cursor-pointer"
							>
								Get Started for Free
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Auth Modal */}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
			/>
			<BugReportModal
				isOpen={isBugReportOpen}
				onClose={() => setIsBugReportOpen(false)}
			/>

			{/* Footer */}
			<Footer />
		</div>
	);
}

export default Home;
