/**
 * Production Configuration Manager
 * Handles all production environment variables with validation and fallbacks
 */

interface BlockchainConfig {
  alchemyApiKey: string;
  infuraApiKey?: string;
  quicknodeApiKey?: string;
  walletConnectProjectId: string;
  missionRegistryAddress: string;
  spaceEquipmentNFTAddress: string;
  standardsComplianceAddress: string;
  networkName: string;
  chainId: number;
  blockExplorerUrl: string;
}

interface IPFSConfig {
  pinataApiKey: string;
  pinataApiSecret: string;
  pinataJWT: string;
  gatewayUrl: string;
}

interface DatabaseConfig {
  mongoUri: string;
  mongoDbName: string;
  mongoPoolSize: number;
  mongoConnectionTimeout: number;
  redisUrl?: string;
  redisPassword?: string;
  redisTLSEnabled: boolean;
  redisPoolSize: number;
  redisConnectionTimeout: number;
}

interface SecurityConfig {
  nextAuthUrl: string;
  nextAuthSecret: string;
  jwtSecret: string;
  jwtExpiry: string;
  apiRateLimitWindow: string;
  apiRateLimitMaxRequests: number;
  apiEncryptionKey: string;
  corsAllowedOrigins: string[];
  corsAllowedMethods: string[];
  corsAllowedHeaders: string[];
}

interface MonitoringConfig {
  sentryDSN?: string;
  sentryEnvironment: string;
  googleAnalyticsId?: string;
  mixpanelToken?: string;
  amplitudeApiKey?: string;
  newRelicLicenseKey?: string;
  datadogApiKey?: string;
}

interface ApplicationConfig {
  appUrl: string;
  apiUrl: string;
  cdnUrl?: string;
  maxSatelliteRenderCount: number;
  orbitCalculationCacheTTL: number;
  documentGenerationTimeout: number;
  apiTimeout: number;
  maxUploadSizeMB: number;
  featureFlags: {
    enableMainnetTransactions: boolean;
    enableIPFSStorage: boolean;
    enableEmailNotifications: boolean;
    enableAdvancedAnalytics: boolean;
    enableDebugMode: boolean;
  };
}

interface ComplianceConfig {
  gdprComplianceMode: boolean;
  dataRetentionDays: number;
  exportControlCheckEnabled: boolean;
  auditLogEnabled: boolean;
  auditLogRetentionDays: number;
}

export interface ProductionConfig {
  blockchain: BlockchainConfig;
  ipfs: IPFSConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
  application: ApplicationConfig;
  compliance: ComplianceConfig;
  isProduction: boolean;
}

class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: ProductionConfig | null = null;
  private validationErrors: string[] = [];

  private constructor() {}

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load and validate production configuration
   */
  loadConfig(): ProductionConfig {
    if (this.config) {
      return this.config;
    }

    this.validationErrors = [];
    const isProduction = process.env.NODE_ENV === 'production';

    this.config = {
      blockchain: this.loadBlockchainConfig(),
      ipfs: this.loadIPFSConfig(),
      database: this.loadDatabaseConfig(),
      security: this.loadSecurityConfig(),
      monitoring: this.loadMonitoringConfig(),
      application: this.loadApplicationConfig(),
      compliance: this.loadComplianceConfig(),
      isProduction,
    };

    if (isProduction && this.validationErrors.length > 0) {
      throw new Error(
        `Production configuration validation failed:\n${this.validationErrors.join('\n')}`
      );
    }

    return this.config;
  }

  private loadBlockchainConfig(): BlockchainConfig {
    return {
      alchemyApiKey: this.getRequiredEnv('NEXT_PUBLIC_ALCHEMY_API_KEY'),
      infuraApiKey: this.getOptionalEnv('NEXT_PUBLIC_INFURA_API_KEY'),
      quicknodeApiKey: this.getOptionalEnv('NEXT_PUBLIC_QUICKNODE_API_KEY'),
      walletConnectProjectId: this.getRequiredEnv('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID'),
      missionRegistryAddress: this.getRequiredEnv('NEXT_PUBLIC_MISSION_REGISTRY_ADDRESS'),
      spaceEquipmentNFTAddress: this.getRequiredEnv('NEXT_PUBLIC_SPACE_EQUIPMENT_NFT_ADDRESS'),
      standardsComplianceAddress: this.getRequiredEnv('NEXT_PUBLIC_STANDARDS_COMPLIANCE_ADDRESS'),
      networkName: this.getEnv('NEXT_PUBLIC_NETWORK_NAME', 'mainnet'),
      chainId: parseInt(this.getEnv('NEXT_PUBLIC_CHAIN_ID', '1')),
      blockExplorerUrl: this.getEnv('NEXT_PUBLIC_BLOCK_EXPLORER_URL', 'https://etherscan.io'),
    };
  }

  private loadIPFSConfig(): IPFSConfig {
    return {
      pinataApiKey: this.getRequiredEnv('PINATA_API_KEY'),
      pinataApiSecret: this.getRequiredEnv('PINATA_API_SECRET'),
      pinataJWT: this.getRequiredEnv('PINATA_JWT'),
      gatewayUrl: this.getEnv('NEXT_PUBLIC_PINATA_GATEWAY_URL', 'https://gateway.pinata.cloud'),
    };
  }

  private loadDatabaseConfig(): DatabaseConfig {
    return {
      mongoUri: this.getRequiredEnv('MONGODB_URI'),
      mongoDbName: this.getEnv('MONGODB_DB_NAME', 'lunar_mission_planning'),
      mongoPoolSize: parseInt(this.getEnv('MONGODB_POOL_SIZE', '10')),
      mongoConnectionTimeout: parseInt(this.getEnv('MONGODB_CONNECTION_TIMEOUT', '30000')),
      redisUrl: this.getOptionalEnv('REDIS_URL'),
      redisPassword: this.getOptionalEnv('REDIS_PASSWORD'),
      redisTLSEnabled: this.getEnv('REDIS_TLS_ENABLED', 'true') === 'true',
      redisPoolSize: parseInt(this.getEnv('REDIS_POOL_SIZE', '20')),
      redisConnectionTimeout: parseInt(this.getEnv('REDIS_CONNECTION_TIMEOUT', '5000')),
    };
  }

  private loadSecurityConfig(): SecurityConfig {
    const corsOrigins = this.getEnv('CORS_ALLOWED_ORIGINS', '').split(',').filter(Boolean);
    const corsMethods = this.getEnv('CORS_ALLOWED_METHODS', 'GET,POST,PUT,DELETE,OPTIONS').split(',');
    const corsHeaders = this.getEnv('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization,X-API-Key').split(',');

    return {
      nextAuthUrl: this.getRequiredEnv('NEXTAUTH_URL'),
      nextAuthSecret: this.getRequiredEnv('NEXTAUTH_SECRET'),
      jwtSecret: this.getRequiredEnv('JWT_SECRET'),
      jwtExpiry: this.getEnv('JWT_EXPIRY', '7d'),
      apiRateLimitWindow: this.getEnv('API_RATE_LIMIT_WINDOW', '15m'),
      apiRateLimitMaxRequests: parseInt(this.getEnv('API_RATE_LIMIT_MAX_REQUESTS', '100')),
      apiEncryptionKey: this.getRequiredEnv('API_ENCRYPTION_KEY'),
      corsAllowedOrigins: corsOrigins,
      corsAllowedMethods: corsMethods,
      corsAllowedHeaders: corsHeaders,
    };
  }

  private loadMonitoringConfig(): MonitoringConfig {
    return {
      sentryDSN: this.getOptionalEnv('SENTRY_DSN'),
      sentryEnvironment: this.getEnv('SENTRY_ENVIRONMENT', 'production'),
      googleAnalyticsId: this.getOptionalEnv('GOOGLE_ANALYTICS_ID'),
      mixpanelToken: this.getOptionalEnv('MIXPANEL_TOKEN'),
      amplitudeApiKey: this.getOptionalEnv('AMPLITUDE_API_KEY'),
      newRelicLicenseKey: this.getOptionalEnv('NEW_RELIC_LICENSE_KEY'),
      datadogApiKey: this.getOptionalEnv('DATADOG_API_KEY'),
    };
  }

  private loadApplicationConfig(): ApplicationConfig {
    return {
      appUrl: this.getRequiredEnv('NEXT_PUBLIC_APP_URL'),
      apiUrl: this.getRequiredEnv('NEXT_PUBLIC_API_URL'),
      cdnUrl: this.getOptionalEnv('NEXT_PUBLIC_CDN_URL'),
      maxSatelliteRenderCount: parseInt(this.getEnv('MAX_SATELLITE_RENDER_COUNT', '200')),
      orbitCalculationCacheTTL: parseInt(this.getEnv('ORBIT_CALCULATION_CACHE_TTL', '3600')),
      documentGenerationTimeout: parseInt(this.getEnv('DOCUMENT_GENERATION_TIMEOUT', '60000')),
      apiTimeout: parseInt(this.getEnv('API_TIMEOUT', '30000')),
      maxUploadSizeMB: parseInt(this.getEnv('MAX_UPLOAD_SIZE_MB', '50')),
      featureFlags: {
        enableMainnetTransactions: this.getEnv('ENABLE_MAINNET_TRANSACTIONS', 'false') === 'true',
        enableIPFSStorage: this.getEnv('ENABLE_IPFS_STORAGE', 'true') === 'true',
        enableEmailNotifications: this.getEnv('ENABLE_EMAIL_NOTIFICATIONS', 'false') === 'true',
        enableAdvancedAnalytics: this.getEnv('ENABLE_ADVANCED_ANALYTICS', 'false') === 'true',
        enableDebugMode: this.getEnv('ENABLE_DEBUG_MODE', 'false') === 'true',
      },
    };
  }

  private loadComplianceConfig(): ComplianceConfig {
    return {
      gdprComplianceMode: this.getEnv('GDPR_COMPLIANCE_MODE', 'true') === 'true',
      dataRetentionDays: parseInt(this.getEnv('DATA_RETENTION_DAYS', '365')),
      exportControlCheckEnabled: this.getEnv('EXPORT_CONTROL_CHECK_ENABLED', 'true') === 'true',
      auditLogEnabled: this.getEnv('AUDIT_LOG_ENABLED', 'true') === 'true',
      auditLogRetentionDays: parseInt(this.getEnv('AUDIT_LOG_RETENTION_DAYS', '730')),
    };
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value && process.env.NODE_ENV === 'production') {
      this.validationErrors.push(`Missing required environment variable: ${key}`);
      return '';
    }
    return value || '';
  }

  private getOptionalEnv(key: string): string | undefined {
    return process.env[key];
  }

  private getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  /**
   * Validate configuration completeness
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.loadConfig();

    // Validate blockchain config
    if (!config.blockchain.alchemyApiKey && !config.blockchain.infuraApiKey) {
      errors.push('At least one blockchain RPC provider API key is required');
    }

    // Validate contract addresses
    if (!config.blockchain.missionRegistryAddress?.startsWith('0x')) {
      errors.push('Invalid Mission Registry contract address');
    }

    // Validate database config
    if (!config.database.mongoUri) {
      errors.push('MongoDB connection URI is required');
    }

    // Validate security config
    if (config.security.jwtSecret && config.security.jwtSecret.length < 32) {
      errors.push('JWT secret must be at least 32 characters');
    }

    // Validate CORS origins in production
    if (config.isProduction && config.security.corsAllowedOrigins.length === 0) {
      errors.push('CORS allowed origins must be configured for production');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get configuration with defaults for development
   */
  getConfig(): ProductionConfig {
    return this.loadConfig();
  }

  /**
   * Check if running in production mode
   */
  isProductionMode(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Get feature flag status
   */
  isFeatureEnabled(feature: keyof ProductionConfig['application']['featureFlags']): boolean {
    const config = this.loadConfig();
    return config.application.featureFlags[feature];
  }
}

// Export singleton instance
export const configManager = ConfigurationManager.getInstance();

// Helper function for easy access
export function getProductionConfig(): ProductionConfig {
  return configManager.getConfig();
}

// Environment validation on module load
if (process.env.NODE_ENV === 'production') {
  const validation = configManager.validateConfig();
  if (!validation.isValid) {
    console.error('⚠️  Production configuration validation failed:');
    validation.errors.forEach(error => console.error(`   - ${error}`));
  }
}