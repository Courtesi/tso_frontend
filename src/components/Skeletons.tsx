import { Fragment } from 'react';

/** Pulsing gray bar used inside skeleton cells */
function Bar({ className = '' }: { className?: string }) {
	return <div className={`rounded bg-gray-700 animate-pulse ${className}`} />;
}

/* ------------------------------------------------------------------ */
/*  ArbTableSkeleton – mirrors Dashboard table                        */
/* ------------------------------------------------------------------ */
export function ArbTableSkeleton() {
	return (
		<div className="space-y-3 text-table">

			{/* Mobile Card Skeleton */}
			<div className="md:hidden space-y-3">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="bg-gray-800/10 border border-gray-700 rounded-lg overflow-hidden">
						<div className="flex items-start gap-2 px-3 pt-3 pb-2">
							<Bar className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								<Bar className="h-4 w-3/4 mb-1.5" />
								<Bar className="h-3 w-1/2" />
							</div>
							<Bar className="h-5 w-14 flex-shrink-0" />
						</div>
						<div className="border-t border-gray-700" />
						<div className="flex items-center gap-3 py-2.5 px-3">
							<Bar className="w-7 h-7 rounded-lg flex-shrink-0" />
							<Bar className="h-4 flex-1" />
							<Bar className="h-4 w-16 flex-shrink-0" />
						</div>
						<div className="border-t border-gray-700/60" />
						<div className="flex items-center gap-3 py-2.5 px-3">
							<Bar className="w-7 h-7 rounded-lg flex-shrink-0" />
							<Bar className="h-4 flex-1" />
							<Bar className="h-4 w-16 flex-shrink-0" />
						</div>
					</div>
				))}
			</div>

			{/* Desktop Table Skeleton */}
			<div className="hidden md:block shadow-xl rounded-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full table-fixed min-w-[900px]">
						<thead className="border-b border-gray-400/50">
							<tr>
								<th className="w-[45px] min-w-[45px] max-w-[45px] px-1 py-4 sticky left-0 z-20 bg-black"></th>
								<th className="w-[72px] min-w-[72px] max-w-[72px] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[45px] z-20 bg-black">Value</th>
								<th className="w-[26%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[117px] z-20 bg-black">Game</th>
								<th className="w-[12%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Market</th>
								<th className="w-[27%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet</th>
								<th className="w-[12%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet Size</th>
								<th className="w-[10%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Link</th>
							</tr>
						</thead>

						<tbody className="divide-y-2 divide-gray-400/50">
							{Array.from({ length: 5 }).map((_, i) => (
								<Fragment key={i}>
									{/* Row 1 of pair */}
									<tr className="bg-gray-800/10 h-8 border-b-0">
										<td rowSpan={2} className="px-1 py-1 text-center align-middle sticky left-0 z-10 bg-black">
											<Bar className="w-5 h-5 mx-auto rounded-full" />
										</td>
										<td rowSpan={2} className="px-2 py-1 text-center border-r-2 border-gray-300/50 align-middle sticky left-[45px] z-10 bg-black">
											<Bar className="h-4 w-12 mx-auto" />
										</td>
										<td rowSpan={2} className="px-2 py-1 border-r-2 border-gray-300/50 align-middle sticky left-[117px] z-10 bg-black">
											<Bar className="h-4 w-3/4 mb-1.5" />
											<Bar className="h-3 w-1/2" />
										</td>
										<td rowSpan={2} className="px-2 py-2 border-r-2 border-gray-300/50 align-middle">
											<Bar className="h-4 w-4/5" />
										</td>
										<td className="px-2 py-1 align-middle">
											<Bar className="h-4 w-3/4" />
										</td>
										<td className="px-2 py-1 text-center align-middle">
											<Bar className="h-4 w-14 mx-auto" />
										</td>
										<td className="px-2 py-1 text-center align-middle">
											<Bar className="w-6 h-6 mx-auto rounded-lg" />
										</td>
									</tr>
									{/* Row 2 of pair */}
									<tr className="bg-gray-800/10 h-8 border-t-0">
										<td className="px-2 py-1 align-middle">
											<Bar className="h-4 w-2/3" />
										</td>
										<td className="px-2 py-1 text-center align-middle">
											<Bar className="h-4 w-14 mx-auto" />
										</td>
										<td className="px-2 py-1 text-center align-middle">
											<Bar className="w-6 h-6 mx-auto rounded-lg" />
										</td>
									</tr>
								</Fragment>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  ChartsSkeleton – mirrors ExpandableOddsScreen card list           */
/* ------------------------------------------------------------------ */
export function ChartsSkeleton() {
	const SB_COLS = 6;
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="bg-zinc-950 border border-gray-600 rounded-lg overflow-hidden">
					{/* Game header */}
					<div className="flex items-center justify-between px-4 py-3">
						<div className="flex items-center gap-3 min-w-0">
							<Bar className="h-4 w-52 rounded" />
							<Bar className="h-3 w-10 rounded shrink-0" />
						</div>
						<Bar className="h-4 w-4 rounded shrink-0 ml-2" />
					</div>

					{/* Odds table */}
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
								<tr className="border-b border-gray-600">
									{/* Team col header — blank */}
									<th className="px-2 py-2 min-w-[100px]" />
									{/* Date col */}
									<th className="px-2 py-2 min-w-[70px] border-l border-gray-600/50 text-center">
										<Bar className="h-3 w-8 rounded mx-auto" />
									</th>
									{/* Avg col */}
									<th className="px-2 py-2 min-w-[60px] border-l border-gray-600/50 text-center">
										<Bar className="h-3 w-6 rounded mx-auto" />
									</th>
									{/* Sportsbook icon cols */}
									{Array.from({ length: SB_COLS }).map((_, j) => (
										<th key={j} className="px-1 py-2 min-w-[50px] text-center">
											<Bar className="h-5 w-5 rounded mx-auto" />
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: 2 }).map((_, r) => (
									<tr key={r} className="border-b border-gray-600/50 last:border-b-0">
										{/* Team name */}
										<td className="px-2 py-2 min-w-[100px]">
											<Bar className="h-3 w-20 rounded" />
										</td>
										{/* Date — rowSpan=2, only on first row */}
										{r === 0 && (
											<td className="px-2 py-2 min-w-[70px] border-l border-gray-600/50 text-center" rowSpan={2}>
												<div className="flex flex-col items-center gap-1">
													<Bar className="h-3 w-12 rounded" />
													<Bar className="h-2.5 w-10 rounded" />
												</div>
											</td>
										)}
										{/* Avg */}
										<td className="px-2 py-2 min-w-[60px] border-l border-gray-600/50 text-center">
											<Bar className="h-4 w-8 rounded mx-auto" />
										</td>
										{/* Sportsbook odds */}
										{Array.from({ length: SB_COLS }).map((_, j) => (
											<td key={j} className="px-1 py-2 min-w-[50px] text-center">
												<Bar className="h-4 w-8 rounded mx-auto" />
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			))}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  EVTableSkeleton – mirrors EV Bets table                           */
/* ------------------------------------------------------------------ */
export function EVTableSkeleton() {
	return (
		<div className="space-y-3 text-table">

			{/* Mobile Card Skeleton */}
			<div className="md:hidden space-y-3">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="bg-gray-800/10 border border-gray-700 rounded-lg overflow-hidden">
						{/* Header: pin | game info | EV% */}
						<div className="flex items-start gap-2 px-3 pt-3 pb-2">
							<Bar className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								<Bar className="h-4 w-3/4 mb-1.5" />
								<Bar className="h-3 w-1/2 mb-1" />
								<Bar className="h-3 w-2/5" />
							</div>
							<div className="text-right flex-shrink-0">
								<Bar className="h-5 w-14 mb-1" />
								<Bar className="h-3 w-10" />
							</div>
						</div>
						<div className="border-t border-gray-700" />
						{/* Bet row: icon | team+market | bet size | confidence */}
						<div className="flex items-center gap-2 py-2.5 px-3">
							<Bar className="w-7 h-7 rounded-lg flex-shrink-0" />
							<div className="flex-1 min-w-0">
								<Bar className="h-4 w-3/4 mb-1" />
								<Bar className="h-3 w-1/3" />
							</div>
							<div className="text-right flex-shrink-0 mr-1">
								<Bar className="h-4 w-14 mb-1" />
								<Bar className="h-3 w-10" />
							</div>
							<Bar className="h-6 w-14 rounded flex-shrink-0" />
						</div>
					</div>
				))}
			</div>

			{/* Desktop Table Skeleton */}
			<div className="hidden md:block shadow-xl rounded-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full table-fixed min-w-[900px]">
						<thead className="border-b border-gray-400/50">
							<tr>
								<th className="w-[45px] min-w-[45px] max-w-[45px] px-1 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-0 z-20 bg-black"></th>
								<th className="w-[72px] min-w-[72px] max-w-[72px] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[45px] z-20 bg-black">EV%</th>
								<th className="w-[24%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Game</th>
								<th className="w-[12%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">True Odds</th>
								<th className="w-[24%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[117px] z-20 bg-black">Bet</th>
								<th className="w-[10%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet Size</th>
								<th className="w-[12%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Confidence</th>
								<th className="w-[10%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Sportsbook</th>
							</tr>
						</thead>

						<tbody className="divide-y-2 divide-gray-400/50">
							{Array.from({ length: 5 }).map((_, i) => (
								<tr key={i} className="bg-gray-800/10 h-12">
									<td className="px-1 py-1 text-center align-middle sticky left-0 z-10 bg-black">
										<Bar className="w-5 h-5 mx-auto rounded-full" />
									</td>
									<td className="px-2 py-2 text-center border-r-2 border-gray-300/50 sticky left-[45px] z-10 bg-black">
										<Bar className="h-4 w-12 mx-auto mb-1" />
										<Bar className="h-3 w-10 mx-auto" />
									</td>
									<td className="px-2 py-2 border-r-2 border-gray-300/50">
										<Bar className="h-4 w-4/5 mb-1" />
										<Bar className="h-3 w-3/5" />
									</td>
									<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
										<Bar className="h-4 w-14 mx-auto mb-1" />
										<Bar className="h-3 w-10 mx-auto" />
									</td>
									<td className="px-2 py-2 border-r-2 border-gray-300/50 sticky left-[117px] z-10 bg-black">
										<Bar className="h-4 w-3/4 mb-1" />
										<Bar className="h-3 w-1/2" />
									</td>
									<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
										<Bar className="h-4 w-14 mx-auto mb-1" />
										<Bar className="h-3 w-10 mx-auto" />
									</td>
									<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
										<Bar className="h-5 w-16 mx-auto rounded" />
									</td>
									<td className="px-2 py-2 text-center">
										<Bar className="w-6 h-6 mx-auto rounded-lg" />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
