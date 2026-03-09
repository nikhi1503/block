"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { NETWORKS } from "@/app/config/networks";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useMetamask = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const switchNetwork = async (targetChainId: number): Promise<boolean> => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed");
      return false;
    }

    const hexChainId = `0x${targetChainId.toString(16)}`;
    const network = NETWORKS[targetChainId === 31337 ? "localhost" : targetChainId === 80002 ? "amoy" : "polygon"];

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
      toast.success(`Switched to ${network.name}`);
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network not added to MetaMask
        if (targetChainId === 31337) {
          // For localhost, just show info since it can't be added through MetaMask
          toast.info("Please add Hardhat localhost network manually to MetaMask");
          return false;
        }

        // Add network for Polygon
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: network.name,
                nativeCurrency: {
                  name: network.currency,
                  symbol: network.currency,
                  decimals: 18,
                },
                rpcUrls: [network.rpc],
                blockExplorerUrls: [network.explorer],
              },
            ],
          });
          toast.success(`Successfully added ${network.name}!`);
          return true;
        } catch (addError) {
          toast.error(`Failed to add ${network.name}`);
          return false;
        }
      } else {
        toast.error(`Failed to switch to ${network.name}`);
        return false;
      }
    }
  };

  const connectWallet = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    if (typeof window === "undefined" || !window.ethereum) {
      const msg = "MetaMask is not installed.";
      toast.info(msg);
      window.open("https://metamask.io/download.html", "_blank");
      setLoading(false);
      return null;
    }

    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum, "any");
      setProvider(ethProvider);

      // Request accounts with timeout
      const accounts: string[] = await Promise.race([
        ethProvider.send("eth_requestAccounts", []),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 30000)
        ),
      ]);

      if (accounts.length === 0) {
        const msg = "No accounts found in MetaMask.";
        setError(msg);
        toast.error(msg);
        return null;
      }

      const connectedAccount = ethers.getAddress(accounts[0]); // checksummed
      setAccount(connectedAccount);
      localStorage.setItem("connectedAccount", connectedAccount);

      try {
        const { chainId: networkChainId } = await ethProvider.getNetwork();
        setChainId(Number(networkChainId));
      } catch (networkErr) {
        console.warn("Could not fetch network immediately, will retry:", networkErr);
        // Set a default chainId and let it update when provider stabilizes
        setChainId(31337); // Default to localhost
      }

      if (!sessionStorage.getItem("walletConnectedOnce")) {
        sessionStorage.setItem("walletConnectedOnce", "true");
      }

      toast.success("Wallet connected successfully!");
      return connectedAccount;
    } catch (err: any) {
      let msg = "Failed to connect to MetaMask.";
      if (err.code === 4001) {
        msg = "Connection request rejected by user.";
      } else if (err.code === -32002) {
        msg = "Connection request already pending in MetaMask.";
      } else if (err.message?.includes("timeout")) {
        msg = "Connection timeout. Please try again.";
      } else if (err.message?.includes("RPC")) {
        msg = "Network error. Please check your internet connection.";
      }

      console.error("MetaMask connection error:", err);
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Monitor network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (newChainId: string) => {
      const chainIdNumber = parseInt(newChainId, 16);
      setChainId(chainIdNumber);
      const networkName = Object.values(NETWORKS).find(
        (n) => n.chainId === chainIdNumber
      )?.name || "Unknown Network";
      toast.info(`Network changed to ${networkName}`);
    };

    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // Auto-connect if previously connected
  useEffect(() => {
    const checkPreviousConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      try {
        const ethProvider = new ethers.BrowserProvider(window.ethereum, "any");
        const accounts = await ethProvider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          setProvider(ethProvider);
          
          // Try to get network with timeout and error handling
          try {
            const { chainId: networkChainId } = await Promise.race([
              ethProvider.getNetwork(),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Network timeout")), 5000)
              ),
            ]);
            setChainId(Number(networkChainId));
          } catch (networkErr) {
            console.warn("Could not fetch network on auto-connect:", networkErr);
            // Default to localhost if network fetch fails
            setChainId(31337);
          }
        }
      } catch (err) {
        console.log("Not previously connected or connection check failed");
      }
    };

    checkPreviousConnection();
  }, []);

  return {
    account,
    provider,
    chainId,
    error,
    loading,
    connectWallet,
    switchNetwork,
  };
};
