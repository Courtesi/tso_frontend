import { useState, useRef } from 'react';
import { api } from '../services/api';

interface BugReportModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const BUG_CATEGORIES = [
	'UI/Display Issue',
	'Functionality Not Working',
	'Data Incorrect/Missing',
	'Performance Issue',
	'Login/Account Issue',
	'Payment/Subscription Issue',
	'Other',
];

function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState('');
	const [screenshot, setScreenshot] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const modalContentRef = useRef<HTMLDivElement>(null);

	if (!isOpen) return null;

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				setError('Screenshot must be less than 5MB');
				return;
			}
			// Validate file type
			if (!file.type.startsWith('image/')) {
				setError('Please upload an image file');
				return;
			}
			setScreenshot(file);
			setError('');
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		// Validation
		if (!title.trim()) {
			setError('Title is required');
			setLoading(false);
			return;
		}

		if (!description.trim()) {
			setError('Description is required');
			setLoading(false);
			return;
		}

		if (!category) {
			setError('Please select a category');
			setLoading(false);
			return;
		}

		try {
			// Create FormData for file upload
			const formData = new FormData();
			formData.append('title', title);
			formData.append('description', description);
			formData.append('category', category);

			if (screenshot) {
				formData.append('screenshot', screenshot);
			}

			// Add browser/page context
			formData.append('url', window.location.href);
			formData.append('userAgent', navigator.userAgent);

			await api.createBugReport(formData);
			setSuccess(true);

			// Scroll to top of modal to show success message
			if (modalContentRef.current) {
				modalContentRef.current.scrollTop = 0;
			}

			// Reset form and close after 2 seconds
			setTimeout(() => {
				resetForm();
				onClose();
				setSuccess(false);
			}, 2000);
		} catch (err: unknown) {
			console.error('Bug report error:', err);
			setError(err instanceof Error ? err.message : 'Failed to submit bug report. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setTitle('');
		setDescription('');
		setCategory('');
		setScreenshot(null);
		setError('');
	};

	const handleClose = () => {
		if (!loading) {
			resetForm();
			onClose();
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
			<div ref={modalContentRef} className="relative bg-gradient-to-br from-indigo-900/80 to-indigo-950/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 p-8 max-h-[90vh] overflow-y-auto">
				{/* Close button */}
				<button
					onClick={handleClose}
					disabled={loading}
					className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer disabled:cursor-not-allowed"
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>

				{/* Header */}
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-white mb-2">Report a Bug</h2>
					<p className="text-gray-400 text-sm">
						Help us improve by reporting any issues you encounter
					</p>
				</div>

				{/* Error message */}
				{error && (
					<div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-200 text-sm">
						{error}
					</div>
				)}

				{/* Success message */}
				{success && (
					<div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-500 rounded text-green-200 text-sm">
						Bug report submitted successfully! Thank you for your feedback.
					</div>
				)}

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Category */}
					<div>
						<label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
							Category <span className="text-red-400">*</span>
						</label>
						<select
							id="category"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							required
							className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
						>
							<option value="" className="bg-indigo-950">Select a category</option>
							{BUG_CATEGORIES.map((cat) => (
								<option key={cat} value={cat} className="bg-indigo-950">
									{cat}
								</option>
							))}
						</select>
					</div>

					{/* Title */}
					<div>
						<label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
							Title <span className="text-red-400">*</span>
						</label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
							maxLength={100}
							placeholder="Brief description of the issue"
							className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
						/>
						<p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
					</div>

					{/* Description */}
					<div>
						<label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
							Description <span className="text-red-400">*</span>
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							required
							rows={5}
							maxLength={1000}
							placeholder="What happened? What were you trying to do? What did you expect to happen?"
							className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors resize-none"
						/>
						<p className="text-xs text-gray-500 mt-1">{description.length}/1000 characters</p>
					</div>

					{/* Screenshot Upload */}
					<div>
						<label htmlFor="screenshot" className="block text-sm font-medium text-gray-300 mb-2">
							Screenshot (optional)
						</label>
						<div className="relative">
							<input
								id="screenshot"
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
							/>
							<label
								htmlFor="screenshot"
								className="flex items-center justify-center w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-gray-400 hover:bg-white/10 hover:border-indigo-400 transition-colors cursor-pointer"
							>
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								{screenshot ? screenshot.name : 'Click to upload screenshot (max 5MB)'}
							</label>
						</div>
						{screenshot && (
							<button
								type="button"
								onClick={() => setScreenshot(null)}
								className="mt-2 text-sm text-red-400 hover:text-red-300 transition-colors"
							>
								Remove screenshot
							</button>
						)}
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
					>
						{loading ? 'Submitting...' : 'Submit Bug Report'}
					</button>
				</form>

				<p className="text-xs text-gray-500 mt-4 text-center">
					This report will include your current page URL and browser information to help us investigate.
				</p>
			</div>
		</div>
	);
}

export default BugReportModal;
