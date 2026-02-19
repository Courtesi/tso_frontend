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
		<div className="space-y-6 text-table">
			<div className="shadow-xl rounded-lg overflow-hidden">
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
/*  ChartsSkeleton – mirrors Charts grid (chart + sidebar)            */
/* ------------------------------------------------------------------ */
export function ChartsSkeleton() {
	return (
		<div className="grid grid-cols-12 gap-4 lg:gap-6">
			{/* Chart Area – col-span-9 */}
			<div className="col-span-12 lg:col-span-9 order-2 lg:order-1">
				{/* Chart placeholder */}
				<div className="bg-gray-800/50 rounded-lg p-4">
					<Bar className="h-[400px] w-full rounded-lg" />
				</div>

				{/* OddsScreen table placeholder */}
				<div className="mt-4 overflow-x-auto">
					<table className="w-full table-fixed min-w-[600px]">
						<thead className="border-b border-gray-400/50">
							<tr>
								{['Sportsbook', 'Spread', 'Total', 'Moneyline'].map(h => (
									<th key={h} className="px-2 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">{h}</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-700">
							{Array.from({ length: 3 }).map((_, i) => (
								<tr key={i} className="h-10">
									{Array.from({ length: 4 }).map((_, j) => (
										<td key={j} className="px-2 py-2">
											<Bar className="h-4 w-3/4" />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Sidebar – col-span-3 */}
			<div className="col-span-12 lg:col-span-3 order-1 lg:order-2">
				{/* Search input placeholder */}
				<Bar className="h-9 w-full rounded-lg mb-4" />

				{/* Game list item skeletons */}
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="bg-gray-800/50 rounded-lg p-3 mb-2">
						<Bar className="h-4 w-4/5 mb-2" />
						<Bar className="h-3 w-1/2" />
					</div>
				))}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  EVTableSkeleton – mirrors EV Bets table                           */
/* ------------------------------------------------------------------ */
export function EVTableSkeleton() {
	return (
		<div className="space-y-6 text-table">
			<div className="shadow-xl rounded-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full table-fixed min-w-[900px]">
						<thead className="border-b border-gray-400/50">
							<tr>
								<th className="w-[45px] min-w-[45px] max-w-[45px] px-1 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-0 z-20 bg-black"></th>
								<th className="w-[72px] min-w-[72px] max-w-[72px] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[45px] z-20 bg-black">EV%</th>
								<th className="w-[24%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-[117px] z-20 bg-black">Bet</th>
								<th className="w-[10%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Sportsbook</th>
								<th className="w-[12%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">True Odds</th>
								<th className="w-[12%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Confidence</th>
								<th className="w-[10%] px-2 py-4 text-center text-xs font-semibold text-gray-200 uppercase tracking-wider">Bet Size</th>
								<th className="w-[24%] px-2 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Game</th>
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
									<td className="px-2 py-2 border-r-2 border-gray-300/50 sticky left-[117px] z-10 bg-black">
										<Bar className="h-4 w-3/4 mb-1" />
										<Bar className="h-3 w-1/2" />
									</td>
									<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
										<Bar className="w-6 h-6 mx-auto rounded-lg" />
									</td>
									<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
										<Bar className="h-4 w-14 mx-auto mb-1" />
										<Bar className="h-3 w-10 mx-auto" />
									</td>
									<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
										<Bar className="h-5 w-16 mx-auto rounded" />
									</td>
									<td className="px-2 py-2 text-center border-r-2 border-gray-300/50">
										<Bar className="h-4 w-14 mx-auto mb-1" />
										<Bar className="h-3 w-10 mx-auto" />
									</td>
									<td className="px-2 py-2">
										<Bar className="h-4 w-4/5 mb-1" />
										<Bar className="h-3 w-3/5" />
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
