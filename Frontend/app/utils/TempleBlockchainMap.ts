/**
 * Mapping of temple names to their blockchain wallet addresses
 * This is used to identify which blockchain address a temple admin should use
 * for querying and receiving donations
 */

export const TEMPLE_BLOCKCHAIN_ADDRESSES: Record<string, string> = {
  "Shiva Mandir": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "Vishnu Temple": "0x2234567890123456789012345678901234567891",
  "Krishna Mandir": "0x3234567890123456789012345678901234567892",
  // Add more temple mappings here as needed
};

/**
 * Get the blockchain address for a temple based on its name
 * @param templeName - The name of the temple
 * @returns The blockchain wallet address for the temple, or null if not found
 */
export const getTempleBlockchainAddress = (
  templeName: string | null | undefined
): string | null => {
  if (!templeName) return null;
  
  // Try exact match first
  if (TEMPLE_BLOCKCHAIN_ADDRESSES[templeName]) {
    return TEMPLE_BLOCKCHAIN_ADDRESSES[templeName];
  }
  
  // Try case-insensitive match
  const lowerName = templeName.toLowerCase();
  for (const [name, address] of Object.entries(TEMPLE_BLOCKCHAIN_ADDRESSES)) {
    if (name.toLowerCase() === lowerName) {
      return address;
    }
  }
  
  return null;
};
