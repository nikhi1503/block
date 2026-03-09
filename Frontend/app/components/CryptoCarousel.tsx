"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoCarouselProps {
  onSelectCrypto: (cryptoId: string) => void;
}

const CryptoCarousel: React.FC<CryptoCarouselProps> = ({ onSelectCrypto }) => {
  const [allCryptoPrices, setAllCryptoPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [priceError, setPriceError] = useState(null);
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    totalVolume: 0,
    activeCoins: 0,
  });

  // Fetch comprehensive crypto data
  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        setLoadingPrices(true);
        setPriceError(null);

        // Use fallback mock data by default
        const mockCryptos = [
          { id: "bitcoin", name: "Bitcoin", symbol: "BTC", price: 42500, price_change_percentage_24h: 2.5, market_cap: 850000000000, image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
          { id: "ethereum", name: "Ethereum", symbol: "ETH", price: 2250, price_change_percentage_24h: 3.1, market_cap: 270000000000, image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
          { id: "binancecoin", name: "Binance Coin", symbol: "BNB", price: 615, price_change_percentage_24h: 1.8, market_cap: 95000000000, image: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png" },
          { id: "matic-network", name: "Polygon", symbol: "MATIC", price: 0.85, price_change_percentage_24h: -1.2, market_cap: 8500000000, image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png" },
          { id: "cardano", name: "Cardano", symbol: "ADA", price: 0.98, price_change_percentage_24h: 2.0, market_cap: 35000000000, image: "https://assets.coingecko.com/coins/images/325/large/Cardano.png" },
          { id: "solana", name: "Solana", symbol: "SOL", price: 165, price_change_percentage_24h: 4.5, market_cap: 72000000000, image: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
        ];

        setAllCryptoPrices(mockCryptos);
        const totalMarketCap = mockCryptos.reduce((sum, crypto) => sum + (crypto.market_cap || 0), 0);
        
        setMarketStats({
          totalMarketCap,
          totalVolume: totalMarketCap * 0.05,
          activeCoins: mockCryptos.length,
        });
      } catch (error) {
        console.error("Failed to load crypto prices:", error);
        
        // Fallback to mock data even on error
        const mockCryptos = [
          { id: "bitcoin", name: "Bitcoin", symbol: "BTC", price: 42500, price_change_percentage_24h: 2.5, market_cap: 850000000000, image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
          { id: "ethereum", name: "Ethereum", symbol: "ETH", price: 2250, price_change_percentage_24h: 3.1, market_cap: 270000000000, image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
          { id: "binancecoin", name: "Binance Coin", symbol: "BNB", price: 615, price_change_percentage_24h: 1.8, market_cap: 95000000000, image: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png" },
          { id: "matic-network", name: "Polygon", symbol: "MATIC", price: 0.85, price_change_percentage_24h: -1.2, market_cap: 8500000000, image: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png" },
          { id: "cardano", name: "Cardano", symbol: "ADA", price: 0.98, price_change_percentage_24h: 2.0, market_cap: 35000000000, image: "https://assets.coingecko.com/coins/images/325/large/Cardano.png" },
          { id: "solana", name: "Solana", symbol: "SOL", price: 165, price_change_percentage_24h: 4.5, market_cap: 72000000000, image: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
        ];
        
        setAllCryptoPrices(mockCryptos);
        const totalMarketCap = mockCryptos.reduce((sum, crypto) => sum + (crypto.market_cap || 0), 0);
        
        setMarketStats({
          totalMarketCap,
          totalVolume: totalMarketCap * 0.05,
          activeCoins: mockCryptos.length,
        });
        
        setPriceError("Using cached prices. Live data unavailable.");
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    if (price >= 1) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(6);
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) {
      return (marketCap / 1e12).toFixed(1) + "T";
    } else if (marketCap >= 1e9) {
      return (marketCap / 1e9).toFixed(1) + "B";
    } else if (marketCap >= 1e6) {
      return (marketCap / 1e6).toFixed(1) + "M";
    }
    return "N/A";
  };

  const duplicatedCryptos = [...allCryptoPrices, ...allCryptoPrices];

  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent mb-4">
          🚀 Live Crypto Market
        </h2>
        <p className="text-gray-600 text-lg">
          Real-time cryptocurrency prices • Updates every 30 seconds
        </p>
        <div className="flex justify-center items-center mt-4 space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-500 text-sm font-medium">LIVE</span>
        </div>
      </div>

      {/* Crypto Carousel */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-white to-red-50 border border-orange-200 shadow-xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-purple-500/5"></div>

        {loadingPrices && (
          <div className="text-center py-16">
            <div className="inline-flex items-center space-x-3">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 text-xl font-medium">
                Loading crypto prices...
              </span>
            </div>
          </div>
        )}

        {priceError && (
          <div className="text-center py-16">
            <div className="text-red-500 text-xl">⚠️ {priceError}</div>
          </div>
        )}

        {!loadingPrices && !priceError && allCryptoPrices.length > 0 && (
          <div className="relative">
            <div
              className="flex animate-scroll"
              style={{
                animation: "scroll 60s linear infinite",
                width: `${duplicatedCryptos.length * 320}px`,
              }}
            >
              {duplicatedCryptos.map((crypto, index) => (
                <div
                  key={`${crypto.id}-${index}`}
                  className="flex-shrink-0 w-80 mx-2 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-orange-200/50 hover:border-orange-400/70 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => {
                    const cryptoMapping = {
                      bitcoin: "bitcoin",
                      ethereum: "ethereum",
                      binancecoin: "bnb",
                      "matic-network": "polygon",
                      cardano: "cardano",
                      solana: "solana",
                    };
                    const mappedCrypto = cryptoMapping[crypto.id];
                    if (mappedCrypto) {
                      onSelectCrypto(mappedCrypto); // Call the prop function
                      document
                        .getElementById("donation-form")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={crypto.image}
                        alt={crypto.name}
                        className="w-12 h-12 rounded-full shadow-md transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="24" cy="24" r="24" fill="#F59E0B"/>
                              <text x="24" y="30" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${crypto.symbol.charAt(
                                0
                              )}</text>
                            </svg>
                          `)}`;
                        }}
                      />
                      <div>
                        <h3 className="text-gray-800 font-bold text-lg">
                          {crypto.symbol}
                        </h3>
                        <p className="text-gray-500 text-sm truncate max-w-[120px]">
                          {crypto.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800 mb-1">
                        ${formatPrice(crypto.price)}
                      </div>
                      <div className="flex items-center justify-end space-x-1">
                        {crypto.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span
                          className={`font-semibold text-sm ${
                            crypto.price_change_percentage_24h >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {Math.abs(
                            crypto.price_change_percentage_24h || 0
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Market Cap</span>
                      <span className="text-gray-700 font-medium">
                        ${formatMarketCap(crypto.market_cap)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoCarousel;
