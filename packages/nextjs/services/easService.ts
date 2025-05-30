import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { getWalletClient } from "@wagmi/core";
import { BrowserProvider, type Signer as EthersSigner, JsonRpcSigner } from "ethers";
import { ClientError, gql, request } from "graphql-request";
import { Hex } from "viem";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { notification } from "~~/utils/scaffold-eth";

type InferredWalletClient = Awaited<ReturnType<typeof getWalletClient>>;

// EAS Contract Address for Base Mainnet & Sepolia (use the same for now, can be chain-dependent)
export const EAS_CONTRACT_ADDRESS = "0x4200000000000000000000000000000000000021"; // Base & Base Sepolia
export const EAS_GRAPHQL_ENDPOINT_BASE = "https://base.easscan.org/graphql";

// Schema UIDs (replace with your actual registered schema UIDs after deployment)
// For now, these are conceptual placeholders. In a real scenario, you'd register these schemas.
export const ACTIVITY_LOGGED_SCHEMA_UID = "0xYourActivityLoggedSchemaUID"; // Replace after registration
export const COMPLIANCE_DOC_ADDED_SCHEMA_UID = "0xYourComplianceDocAddedSchemaUID"; // Replace after registration
export const COMPLIANCE_DOC_STATUS_UPDATED_SCHEMA_UID = "0xYourComplianceDocStatusUpdatedSchemaUID"; // Replace after registration

// Schema String Definitions (for clarity and potential registration)
export const ACTIVITY_LOGGED_SCHEMA_STRING =
  "bytes32 activityId, string activityName, uint8 activityType, address owner, uint256 loggedAtTimestamp";
export const COMPLIANCE_DOC_ADDED_SCHEMA_STRING =
  "bytes32 activityId, bytes32 documentId, string documentName, string documentType, string documentHashOrLink, uint256 addedAtTimestamp";
export const COMPLIANCE_DOC_STATUS_UPDATED_SCHEMA_STRING =
  "bytes32 activityId, bytes32 documentId, uint8 newStatus, uint256 updatedAtTimestamp";

let eas: EAS;
let globalEthersSigner: JsonRpcSigner | null = null;

async function getEthersSignerFromWalletClient(
  chainId: number,
  client?: InferredWalletClient,
): Promise<JsonRpcSigner | null> {
  let currentClient = client;
  if (!currentClient) {
    try {
      currentClient = await getWalletClient(wagmiConfig, { chainId });
    } catch (error) {
      console.error("Error getting wallet client:", error);
      notification.error("Wallet client not available for creating signer.");
      return null;
    }
  }
  if (!currentClient) {
    notification.error("Wallet client not found. Cannot create attestation signer.");
    return null;
  }
  const { account, chain, transport } = currentClient;
  if (!account || !chain || !transport) {
    notification.error("Wallet client is missing required properties (account, chain, or transport).");
    return null;
  }
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  return new JsonRpcSigner(provider, account.address);
}

// Type guard to check if the object is an Ethers Signer
function isEthersSigner(
  signerOrWalletClient: EthersSigner | InferredWalletClient,
): signerOrWalletClient is EthersSigner {
  return !!(signerOrWalletClient as EthersSigner).provider;
}

export const initializeEAS = async (signerOrWalletClient: EthersSigner | InferredWalletClient, chainId: number) => {
  if (isEthersSigner(signerOrWalletClient)) {
    if (signerOrWalletClient instanceof JsonRpcSigner) {
      globalEthersSigner = signerOrWalletClient;
    } else {
      // If it's an EthersSigner but not a JsonRpcSigner, this is an unexpected state if initialized from wagmi.
      // We expect a WalletClient or a direct JsonRpcSigner for predictable behavior.
      notification.error(
        "Provided Ethers Signer is not a JsonRpcSigner. Please initialize with a WalletClient from Wagmi.",
      );
      return;
    }
  } else {
    globalEthersSigner = await getEthersSignerFromWalletClient(chainId, signerOrWalletClient);
  }

  if (!globalEthersSigner) {
    notification.error("Failed to initialize ethers signer for EAS.");
    return;
  }

  eas = new EAS(EAS_CONTRACT_ADDRESS);
  try {
    await eas.connect(globalEthersSigner);
  } catch (error) {
    console.error("Failed to connect EAS to signer:", error);
    notification.error("Failed to initialize EAS. Attestations may not work.");
    globalEthersSigner = null;
    eas = undefined as any;
  }
};

interface AttestationData {
  schemaUID: string;
  schemaString: string;
  values: any[]; // Array of values corresponding to schemaString types
  recipient?: Hex; // Optional: if attesting about someone else; defaults to address(0)
}

export const createAttestation = async (data: AttestationData): Promise<string | null> => {
  if (!eas || !globalEthersSigner) {
    notification.error("EAS not initialized. Trying to re-initialize...");
    const currentChainId = wagmiConfig.chains[0]?.id;
    if (!currentChainId) {
      notification.error("Current chain ID not found for EAS re-initialization.");
      return null;
    }
    // Re-fetch wallet client for re-initialization
    let clientToReinit: InferredWalletClient | null = null;
    try {
      clientToReinit = await getWalletClient(wagmiConfig, { chainId: currentChainId });
    } catch (error) {
      console.error("Error getting wallet client for re-init:", error);
    }

    if (clientToReinit) {
      await initializeEAS(clientToReinit, currentChainId);
      if (!eas || !globalEthersSigner) {
        notification.error("Re-initialization of EAS failed decisively.");
        return null;
      }
      notification.info("EAS re-initialized successfully.");
    } else {
      notification.error("Wallet client not available for EAS re-initialization.");
      return null;
    }
  }

  const schemaEncoder = new SchemaEncoder(data.schemaString);
  const encodedData = schemaEncoder.encodeData(
    data.values.map(val => {
      // Handle BigInt to string conversion for encoding if necessary
      if (typeof val === "bigint") return val.toString();
      return val;
    }),
  );

  try {
    const tx = await eas.attest({
      schema: data.schemaUID,
      data: {
        recipient: data.recipient || "0x0000000000000000000000000000000000000000",
        expirationTime: 0n, // No expiration
        revocable: true,
        data: encodedData,
      },
    });

    notification.info("Attestation transaction submitted...");
    const newAttestationUID = await tx.wait();
    notification.success(`Attestation created! UID: ${newAttestationUID.substring(0, 10)}...`);
    return newAttestationUID;
  } catch (error: any) {
    console.error("Failed to create attestation:", error);
    notification.error(
      `Attestation failed: ${error.message?.includes("user rejected action") ? "User rejected transaction" : error.message || "Unknown error"}`,
    );
    return null;
  }
};

// --- GraphQL Functions for Reading Attestations ---

export interface AttestationResult {
  id: Hex; // Attestation UID
  attester: Hex;
  recipient: Hex;
  refUID: Hex;
  time: number; // Timestamp as number
  expirationTime: number;
  revocationTime: number;
  decodedDataJson: string; // JSON string of decoded data
  data: Hex; // Raw encoded data
  schemaId: Hex;
  schemaName?: string; // Optional: if schema details are fetched
}

/**
 * Fetches attestations based on schema UID and attester.
 */
export const fetchAttestationsBySchemaAndAttester = async (
  schemaUID: Hex,
  attesterAddress: Hex,
  chainId: number = wagmiConfig.chains[0].id, // Default to the first configured chain (Base)
): Promise<AttestationResult[]> => {
  const endpoint = chainId === 8453 ? EAS_GRAPHQL_ENDPOINT_BASE : EAS_GRAPHQL_ENDPOINT_BASE; // Assuming Base Sepolia would also use a similar endpoint or a testnet specific one.
  // TODO: Add specific endpoint for Base Sepolia if different and if testnet support is needed.

  const query = gql`
    query GetAttestations($schemaId: String!, $attester: String!) {
      attestations(
        where: { schemaId: { equals: $schemaId }, attester: { equals: $attester }, revoked: { equals: false } }
        orderBy: { time: desc }
      ) {
        id
        attester
        recipient
        refUID
        time
        expirationTime
        revocationTime
        decodedDataJson
        data
        schemaId
      }
    }
  `;

  try {
    const response = await request<{ attestations: AttestationResult[] }>(endpoint, query, {
      schemaId: schemaUID,
      attester: attesterAddress,
    });
    return response.attestations;
  } catch (error) {
    console.error("GraphQL Error fetching attestations by schema and attester:", error);
    if (error instanceof ClientError) {
      notification.error(`GraphQL Client Error: ${error.message.split(":\n")[0]}`);
    } else {
      notification.error("Failed to fetch attestations.");
    }
    return [];
  }
};

/**
 * Fetches a single attestation by its UID.
 */
export const fetchAttestationByUID = async (
  attestationUID: Hex,
  chainId: number = wagmiConfig.chains[0].id,
): Promise<AttestationResult | null> => {
  const endpoint = chainId === 8453 ? EAS_GRAPHQL_ENDPOINT_BASE : EAS_GRAPHQL_ENDPOINT_BASE;
  const query = gql`
    query GetAttestation($id: String!) {
      attestation(where: { id: $id }) {
        id
        attester
        recipient
        refUID
        time
        expirationTime
        revocationTime
        decodedDataJson
        data
        schemaId
      }
    }
  `;
  try {
    const response = await request<{ attestation: AttestationResult | null }>(endpoint, query, { id: attestationUID });
    return response.attestation;
  } catch (error) {
    console.error("GraphQL Error fetching attestation by UID:", error);
    if (error instanceof ClientError) {
      notification.error(`GraphQL Client Error: ${error.message.split(":\n")[0]}`);
    } else {
      notification.error("Failed to fetch attestation.");
    }
    return null;
  }
};

// Example usage (conceptual - to be called from UserActivityContext)
/*
export const attestActivityLogged = async (activityId: Hex, activityName: string, activityType: number, owner: Hex) => {
  return createAttestation({
    schemaUID: ACTIVITY_LOGGED_SCHEMA_UID,
    schemaString: ACTIVITY_LOGGED_SCHEMA_STRING,
    values: [activityId, activityName, activityType, owner, Math.floor(Date.now() / 1000)],
  });
};

export const attestComplianceDocAdded = async (activityId: Hex, documentId: Hex, documentName: string, documentType: string, documentHashOrLink: string) => {
  return createAttestation({
    schemaUID: COMPLIANCE_DOC_ADDED_SCHEMA_UID,
    schemaString: COMPLIANCE_DOC_ADDED_SCHEMA_STRING,
    values: [activityId, documentId, documentName, documentType, documentHashOrLink, Math.floor(Date.now() / 1000)],
  });
};

export const attestComplianceDocStatusUpdated = async (activityId: Hex, documentId: Hex, newStatus: number) => {
  return createAttestation({
    schemaUID: COMPLIANCE_DOC_STATUS_UPDATED_SCHEMA_UID,
    schemaString: COMPLIANCE_DOC_STATUS_UPDATED_SCHEMA_STRING,
    values: [activityId, documentId, newStatus, Math.floor(Date.now() / 1000)],
  });
};
*/
