import React from "react";

const watchlist = [
	{ name: "Bitcoin", symbol: "BTC" },
	{ name: "Ethereum", symbol: "ETH" },
	{ name: "Solana", symbol: "SOL" },
	{ name: "Cardano", symbol: "ADA" },
];

export default function WatchlistPage() {
	return (
		<main className="p-8">
			<h1 className="text-2xl font-bold mb-4">My Crypto Watchlist</h1>
			<ul className="space-y-2">
				{watchlist.map((coin) => (
					<li key={coin.symbol} className="border rounded p-4 shadow-sm">
						<span className="font-semibold">{coin.name}</span> <span className="text-gray-500">({coin.symbol})</span>
					</li>
				))}
			</ul>
		</main>
	);
}
