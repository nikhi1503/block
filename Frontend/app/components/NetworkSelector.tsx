"use client";

import React from "react";
import { NETWORKS } from "@/app/config/networks";
import { useMetamask } from "@/app/hooks/useMetamask";
import { toast } from "react-toastify";

interface NetworkSelectorProps {
  onNetworkChange?: (chainId: number) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  onNetworkChange,
}) => {
  const { chainId, switchNetwork } = useMetamask();

  const handleNetworkSwitch = async (targetChainId: number) => {
    const success = await switchNetwork(targetChainId);
    if (success && onNetworkChange) {
      onNetworkChange(targetChainId);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {Object.entries(NETWORKS).map(([key, network]) => (
        <button
          key={key}
          onClick={() => handleNetworkSwitch(network.chainId)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
            chainId === network.chainId
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          title={`Chain ID: ${network.chainId}`}
        >
          {network.isLocal ? "🔧" : "🌐"} {network.name}
        </button>
      ))}
    </div>
  );
};
