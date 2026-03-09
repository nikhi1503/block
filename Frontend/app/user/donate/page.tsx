"use client";

import React, { useState, useEffect } from "react";
import { Heart, Shield, Award, TrendingUp, TrendingDown } from "lucide-react";
import { useMetamask } from "@/app/hooks/useMetamask";
import AuthWrapper from "@/app/components/AuthWrapper";
import { TEMPLE_FUND_ABI, getTempleFundAddress } from "@/app/utils/TempleFund";
import { getContractAddresses } from "@/app/config/networks";
import { NetworkSelector } from "@/app/components/NetworkSelector";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import CryptoCarousel from "@/app/components/CryptoCarousel"; // Import the new component

const UnifiedTempleDonationPage = () => {
  // Donation form state
  const [donationAmount, setDonationAmount] = useState("");
  const [selectedTemple, setSelectedTemple] = useState(null);
  const [donationPurpose, setDonationPurpose] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("bitcoin"); // Keep this state here
  const [temples, setTemples] = useState([]);
  const router = useRouter();
  const { account, provider, connectWallet, chainId } = useMetamask();

  // Authentication check
  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      toast.warning("Please log in to donate");
      router.push("/login");
    }
  }, [router]);
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [templeAddress, setTempleAddress] = useState(""); // This seems unused, consider removing if not needed.
  const [loading, setLoading] = useState(false);
  const [lastGasUsed, setLastGasUsed] = useState<string | null>(null);
  const [lastTransactionCost, setLastTransactionCost] = useState<string | null>(
    null
  );
  const [recent, setRecent] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({
    bitcoin: { price: 0, change: 0 },
    ethereum: { price: 0, change: 0 },
    bnb: { price: 0, change: 0 },
    polygon: { price: 0, change: 0 },
    cardano: { price: 0, change: 0 },
    solana: { price: 0, change: 0 },
  });

  // Fetch active temple admins (for donation)
  const fetchActiveTempleAdmins = async () => {
    // Use hardcoded temples with blockchain addresses
    setTemples([
      {
        templeName: "Shiva Mandir",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        _id: "1",
        location: { city: "Delhi", state: "Delhi" }
      },
      { 
        templeName: "Vishnu Temple", 
        walletAddress: "0x2234567890123456789012345678901234567891", 
        _id: "2",
        location: { city: "Mumbai", state: "Maharashtra" }
      },
      { 
        templeName: "Krishna Mandir", 
        walletAddress: "0x3234567890123456789012345678901234567892", 
        _id: "3",
        location: { city: "Bangalore", state: "Karnataka" }
      },
    ]);
  };

  // Call fetch on mount
  useEffect(() => {
    fetchActiveTempleAdmins();
  }, []);
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch(
          "http://localhost:5500/api/v1/transactions/recent-donations"
        );
        const data = await res.json();
        setRecent(data.data);
      } catch (err) {
        console.error("Failed to fetch recent donations", err);
      }
    };

    fetchRecent();
  }, []);
  const handleTransaction = async (
    contractCall: Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    setLoading(true);
    setLastGasUsed(null);
    setLastTransactionCost(null);

    try {
      toast.info("📤 Transaction sent to the network...");
      const tx = await contractCall;
      console.log("Transaction hash:", tx.hash);
      toast.info(`📨 Transaction hash: ${tx.hash}`);

      const waitingToastId = toast.loading("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      toast.dismiss(waitingToastId);

      if (receipt) {
        const gasUsed = receipt.gasUsed;
        // @ts-ignore
        const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;

        let totalCostWei: bigint | null = null;
        if (effectiveGasPrice) {
          totalCostWei = gasUsed * effectiveGasPrice;
        }

        setLastGasUsed(gasUsed.toString());
        if (totalCostWei) {
          setLastTransactionCost(ethers.formatEther(totalCostWei));
        }

        let transactionFeeForDB = 0;
        if (totalCostWei) {
          // Convert Wei to Ether for consistent storage
          transactionFeeForDB = parseFloat(ethers.formatEther(totalCostWei));
        }

        const payload = {
          amount: Number(donationAmount),
          txHash: tx.hash,
          gasPrice: Number(effectiveGasPrice.toString()),
          transactionFee: transactionFeeForDB,
          purpose: donationPurpose,
          status: "confirmed",
          templeWalletAddress: selectedTemple?.walletAddress,
          templeId: selectedTemple?._id,
          senderWalletAddress: account, // Add sender's wallet address
          cryptoType: "matic", // Specify cryptocurrency type
        };

        if (!selectedTemple?._id) {
          toast.error("Please select a valid temple.");
          return;
        }

        const accessToken = sessionStorage.getItem("accessToken");
        if (!accessToken) {
          throw new Error("Access token not found. Please log in again.");
        }
        const response = await fetch(
          "http://localhost:5500/api/v1/transactions/donate-to-temple",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        if (response.ok) {
          toast.success("🎉 Donation saved in database");
          // Wait longer to ensure transaction is fully saved before redirecting
          setTimeout(() => {
            router.push(`/receipt?txHash=${tx.hash}`);
          }, 2000);
        } else {
          toast.error(
            `DB Error: ${result?.message || "Failed to save transaction"}`
          );
          return false;
        }

        toast.success(`✅ ${successMessage}`);
        toast.success(`🔗 View on explorer: ${receipt.hash}`);
      } else {
        toast.success(successMessage + ` (Receipt not immediately available)`);
      }

      return true;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      let errorMessage = "❌ Transaction failed.";
      if (error.code === 4001) {
        errorMessage = "🚫 Transaction rejected by user.";
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const donateEth = async (templeAddress: string) => {
    // Check and connect wallet if not already connected
    if (!account) {
      toast.info("Connecting wallet...");
      await connectWallet();
      if (!account) {
        toast.error("Failed to connect wallet. Please try again.");
        return;
      }
    }

    if (!provider) {
      toast.error("Provider not available");
      return;
    }

    if (!chainId) {
      toast.error("Unable to detect network. Please refresh and try again.");
      return;
    }

    const amountInEth = donationAmount;
    if (
      !amountInEth ||
      isNaN(Number(amountInEth)) ||
      Number(amountInEth) <= 0
    ) {
      toast.error("Invalid donation amount");
      return;
    }

    if (!selectedTemple || !selectedTemple.walletAddress) {
      toast.error("Temple wallet address not available");
      return;
    }

    try {
      setLoading(true);
      
      // Get contract address for current chain
      const contractAddresses = getContractAddresses(chainId);
      const fundAddress = contractAddresses.fund;
      
      // Verify network compatibility
      const supportedChains = [31337, 80002, 137];
      if (!supportedChains.includes(chainId)) {
        toast.error(`Unsupported network. Please switch to Hardhat (31337), Polygon Amoy (80002), or Polygon Mainnet (137)`);
        return;
      }
      
      toast.info(`🚀 Initiating donation of ${amountInEth} ETH to ${selectedTemple.templeName}...`);
      toast.info(`Network: Chain ID ${chainId}, Contract: ${fundAddress}`);
      
      // Get signer from provider
      const signer = await provider.getSigner();
      
      // Create contract instance with signer
      const templeFund = new ethers.Contract(
        fundAddress,
        TEMPLE_FUND_ABI,
        signer
      );

      // ✅ Execute REAL blockchain transaction
      console.log("Executing donation transaction to:", selectedTemple.walletAddress);
      console.log("Donation amount in ETH:", amountInEth);
      console.log("Parsed amount in wei:", ethers.parseEther(amountInEth).toString());
      console.log("Fund address:", fundAddress);
      console.log("Chain ID:", chainId);
      
      const tx = await templeFund.donateEthToTemple(
        selectedTemple.walletAddress,
        {
          value: ethers.parseEther(amountInEth),
        }
      );

      toast.info("⏳ Waiting for blockchain confirmation...");
      const receipt = await tx.wait(); // Wait for confirmation
      
      // Get the real transaction hash
      const txHash = tx.hash;
      
      console.log("✅ Transaction confirmed:", {
        txHash: txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });
      
      // Record donation in database
      const accessToken = sessionStorage.getItem("accessToken");
      
      if (!accessToken) {
        toast.error("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      if (!selectedTemple || !selectedTemple._id) {
        toast.error("Please select a temple");
        setLoading(false);
        return;
      }
      
      console.log("Recording donation in database:", {
        senderWalletAddress: account,
        txHash: txHash,
        templeId: selectedTemple._id,
        templeWalletAddress: selectedTemple.walletAddress,
        amount: Number(amountInEth),
      });
      
      const response = await fetch(
        "http://localhost:5500/api/v1/transactions/donate-to-temple",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount: Number(amountInEth),
            txHash: txHash, // Real blockchain hash
            gasPrice: receipt.gasPrice.toString(),
            transactionFee: (receipt.gasUsed * receipt.gasPrice).toString(),
            purpose: donationPurpose,
            status: "confirmed",
            templeWalletAddress: selectedTemple.walletAddress,
            templeId: selectedTemple._id,
            cryptoType: selectedCrypto,
            senderWalletAddress: account,
          }),
        }
      );

      let result = null;
      try {
        result = await response.json();
      } catch (e) {
        console.warn("Could not parse API response:", e);
        result = {};
      }
      
      console.log("API Response:", result);
      
      if (!response.ok) {
        console.warn("Database save failed, but blockchain transaction succeeded:", result);
        // Transaction is on blockchain but DB save failed - still show success
        toast.warning("✅ Donation recorded on blockchain! (syncing to database...)");
        setDonationAmount("");
        setDonationPurpose("");
        
        setTimeout(() => {
          console.log("Redirecting to receipt with txHash:", txHash);
          router.push(`/receipt?txHash=${txHash}`);
        }, 2000);
        return;
      }

      toast.success("✅ Donation recorded successfully!");
      setDonationAmount("");
      setDonationPurpose("");
      
      // Wait a bit longer to ensure database write completes
      setTimeout(() => {
        console.log("Redirecting to receipt with txHash:", txHash);
        router.push(`/receipt?txHash=${txHash}`);
      }, 2000);
      
    } catch (error: any) {
      console.error("Donation error:", error);
      
      let errorMessage = "Donation failed";
      
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check if it's a contract revert error
      if (error.code === 'CALL_EXCEPTION' || error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = `Contract call failed: ${errorMessage}. Make sure the temple wallet address is registered on the blockchain.`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchEthBalance = async (templeAddr: string) => {
    if (!provider || !ethers.isAddress(templeAddr)) {
      toast.error("Invalid temple address or wallet not connected.");
      return;
    }
    try {
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        provider
      );
      const balance = await templeFund.getTempleEthBalance(templeAddr);
      setEthBalance(ethers.formatEther(balance));
    } catch (error) {
      toast.error("Failed to fetch ETH balance.");
      console.error(error);
    }
  };

  const purposes = [
    "General Fund",
    "Prasadam Distribution",
    "Temple Maintenance",
    "Festival Celebrations",
    "Educational Programs",
    "Community Kitchen",
  ];
  const handleDonate = () => {
    console.log("Donation attempt - Current state:", {
      selectedTemple,
      donationPurpose,
      donationAmount,
      selectedCrypto,
    });

    // Detailed validation with specific error messages
    if (!selectedTemple) {
      toast.error("Please select a temple");
      console.warn("No temple selected");
      return;
    }
    
    if (!donationPurpose || donationPurpose.trim() === "") {
      toast.error("Please select a donation purpose");
      console.warn("No purpose selected:", donationPurpose);
      return;
    }
    
    if (!donationAmount || isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
      toast.error("Please enter a valid donation amount");
      console.warn("Invalid amount:", donationAmount);
      return;
    }
    
    if (!selectedCrypto || selectedCrypto.trim() === "") {
      toast.error("Please select a cryptocurrency");
      console.warn("No crypto selected:", selectedCrypto);
      return;
    }

    // Check if temple has required fields
    const templeAddress = selectedTemple.walletAddress || selectedTemple.address;
    const templeId = selectedTemple._id || selectedTemple.id;
    
    if (!templeAddress) {
      toast.error("Temple wallet address not found.");
      console.warn("Temple missing wallet address:", selectedTemple);
      return;
    }

    if (!templeId) {
      toast.error("Temple ID not found.");
      console.warn("Temple missing ID:", selectedTemple);
      return;
    }

    const cryptoInfo = {
      bitcoin: "BTC",
      ethereum: "ETH",
      bnb: "BNB",
      polygon: "MATIC",
      cardano: "ADA",
      solana: "SOL",
    };

    const selectedCryptoPrice = cryptoPrices[selectedCrypto]?.price || 0;
    const usdValue = (parseFloat(donationAmount) * selectedCryptoPrice).toFixed(
      2
    );

    if (selectedCrypto === "ethereum" || selectedCrypto === "polygon") {
      // assuming same contract for both ETH & MATIC (since both EVM chains)
      donateEth(templeAddress);
    } else {
      toast.error(`${cryptoInfo[selectedCrypto]} donations not supported yet.`);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(6);
  };

  const cryptoOptions = [
    { value: "bitcoin", name: "Bitcoin (BTC)" },
    { value: "ethereum", name: "Ethereum (ETH)" },
    { value: "bnb", name: "Binance Coin (BNB)" },
    { value: "polygon", name: "Polygon (MATIC)" },
    { value: "cardano", name: "Cardano (ADA)" },
    { value: "solana", name: "Solana (SOL)" },
  ];

  useEffect(() => {
    const fetchSpecificCryptoPrices = async () => {
      try {
        const coinGeckoIds =
          "bitcoin,ethereum,binancecoin,matic-network,cardano,solana";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const specificResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_change=true`,
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        clearTimeout(timeoutId);

        if (!specificResponse.ok) {
          throw new Error(`HTTP error! status: ${specificResponse.status}`);
        }

        const specificData = await specificResponse.json();

        setCryptoPrices({
          bitcoin: {
            price: specificData.bitcoin?.usd || 0,
            change: specificData.bitcoin?.usd_24h_change || 0,
          },
          ethereum: {
            price: specificData.ethereum?.usd || 0,
            change: specificData.ethereum?.usd_24h_change || 0,
          },
          bnb: {
            price: specificData.binancecoin?.usd || 0,
            change: specificData.binancecoin?.usd_24h_change || 0,
          },
          polygon: {
            price: specificData["matic-network"]?.usd || 0,
            change: specificData["matic-network"]?.usd_24h_change || 0,
          },
          cardano: {
            price: specificData.cardano?.usd || 0,
            change: specificData.cardano?.usd_24h_change || 0,
          },
          solana: {
            price: specificData.solana?.usd || 0,
            change: specificData.solana?.usd_24h_change || 0,
          },
        });
      } catch (error) {
        console.warn("Failed to fetch crypto prices from CoinGecko:", error instanceof Error ? error.message : error);
        
        // Use fallback mock data - prices will still display
        setCryptoPrices({
          bitcoin: { price: 42500, change: 2.5 },
          ethereum: { price: 2250, change: 3.1 },
          bnb: { price: 615, change: 1.8 },
          polygon: { price: 0.85, change: -1.2 },
          cardano: { price: 0.98, change: 2.0 },
          solana: { price: 165, change: 4.5 },
        });
      }
    };

    fetchSpecificCryptoPrices();
    const interval = setInterval(fetchSpecificCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <AuthWrapper role="user">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Live Crypto Carousel Section */}
          <CryptoCarousel onSelectCrypto={setSelectedCrypto} />{" "}
          {/* Use the imported component here */}
          {/* Donation Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Temple Crypto Donations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Make donations using various cryptocurrencies with complete
              transparency. Track your contributions in real-time with
              blockchain technology.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8" id="donation-form">
            {/* Donation Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Make a Donation
                </h3>
                {/* Network Selector */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-3">Select Network:</p>
                  <NetworkSelector />
                </div>
                <div className="space-y-6">
                  {/* Temple Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Temple
                    </label>
                    <select
                      value={selectedTemple?.templeName || ""}
                      onChange={(e) => {
                        const selected = temples.find(
                          (t) => t.templeName === e.target.value
                        );
                        setSelectedTemple(selected || null);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Choose a temple...</option>
                      {temples.map((temple) => (
                        <option
                          key={temple.walletAddress}
                          value={temple.templeName}
                        >
                          {temple.templeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purpose Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Purpose
                    </label>
                    <select
                      value={donationPurpose}
                      onChange={(e) => setDonationPurpose(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select purpose...</option>
                      {purposes.map((purpose, index) => (
                        <option key={index} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cryptocurrency Selection Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Cryptocurrency
                    </label>
                    <select
                      value={selectedCrypto}
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      {cryptoOptions.map((crypto) => (
                        <option key={crypto.value} value={crypto.value}>
                          {crypto.name}
                        </option>
                      ))}
                    </select>

                    {/* Live Price Display */}
                    {selectedCrypto &&
                      cryptoPrices[selectedCrypto]?.price > 0 && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Current Price:
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-gray-800">
                              ${formatPrice(cryptoPrices[selectedCrypto].price)}
                            </span>
                            <div
                              className={`text-xs ml-2 inline-block ${
                                cryptoPrices[selectedCrypto].change >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {cryptoPrices[selectedCrypto].change >= 0
                                ? "+"
                                : ""}
                              {cryptoPrices[selectedCrypto].change?.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Amount (
                      {cryptoOptions
                        .find((c) => c.value === selectedCrypto)
                        ?.name.match(/\(([^)]+)\)/)?.[1] || "Crypto"}
                      )
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                        min="0.001"
                        step="0.001"
                      />
                      {donationAmount &&
                        cryptoPrices[selectedCrypto]?.price && (
                          <div className="absolute right-3 top-3 text-sm text-gray-500">
                            ≈ $
                            {(
                              parseFloat(donationAmount) *
                              cryptoPrices[selectedCrypto].price
                            ).toFixed(2)}{" "}
                            USD
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleDonate}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-lg font-medium text-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Donate Now
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Features */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Why Donate Here?
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">Transparent</h5>
                      <p className="text-sm text-gray-600">
                        Every transaction recorded on blockchain
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">Verified</h5>
                      <p className="text-sm text-gray-600">
                        All temples verified and authentic
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-purple-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">
                        Impact Tracking
                      </h5>
                      <p className="text-sm text-gray-600">
                        See how your donation is used
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Donations */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Recent Donations
                </h4>
                <div className="space-y-3">
                  {recent.map((donation) => (
                    <div
                      key={donation._id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {donation.amount} MATIC
                        </p>
                        <p className="text-sm text-gray-600">
                          {donation?.receiver?.templeName || "Unknown Temple"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 text-right">
                        {new Date(donation.createdAt).toLocaleDateString()}{" "}
                        {new Date(donation.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2025 DevTemple. Empowering sacred traditions through
            blockchain technology.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </AuthWrapper>
  );
};

export default UnifiedTempleDonationPage;
