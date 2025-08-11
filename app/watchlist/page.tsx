import React from "react";

const watchlist = [
	{ name: "Bitcoin", symbol: "BTC" },
	{ name: "Ethereum", symbol: "ETH" },
	{ name: "Solana", symbol: "SOL" },
	{ name: "Cardano", symbol: "ADA" },
];

export default function WatchlistPage() {
	return (
		<main className="p-8 bg-white text-primary-dark dark:bg-primary-dark dark:text-white">
			<h1 className="text-2xl font-bold mb-4 text-primary-dark dark:text-accent-cyan">My Crypto Watchlist</h1>
			<ul className="space-y-2">
				{watchlist.map((coin) => (
					<li key={coin.symbol} className="border rounded p-4 shadow-sm bg-gray-50 dark:bg-[#23263a]">
						<span className="font-semibold text-primary-dark dark:text-white">{coin.name}</span> <span className="text-gray-700 dark:text-gray-200">({coin.symbol})</span>
					</li>
				))}
			</ul>
		</main>
	);
}
