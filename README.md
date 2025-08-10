
# Crypto Advisor

Crypto Advisor is a fullstack web application that provides users with cryptocurrency analysis, trading suggestions, alerts, and portfolio management tools. Built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features
- **Dashboard**: Overview of market trends and your portfolio
- **Crypto Analysis**: Detailed analysis of selected cryptocurrencies
- **Trading Suggestions**: AI-powered trading recommendations
- **Alerts**: Customizable price and market alerts
- **Watchlist**: Track your favorite coins
- **Portfolio**: Manage and analyze your crypto holdings

## Tech Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: (Configured via Prisma)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
1. Clone the repository:
	```powershell
	git clone https://github.com/yourusername/crypto-advisor.git
	cd crypto-advisor
	```
2. Install dependencies:
	```powershell
	npm install
	```
3. Set up your database:
	- Configure your database connection in `prisma/schema.prisma`.
	- Run migrations:
	  ```powershell
	  npx prisma migrate dev --name init
	  ```
4. Start the development server:
	```powershell
	npm run dev
	```

## Project Structure
```
app/            # Main application pages and API routes
components/     # Reusable React components
lib/            # Utility libraries (e.g., Prisma client)
prisma/         # Prisma schema and migrations
public/         # Static assets
styles/         # Global and animation styles
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.
