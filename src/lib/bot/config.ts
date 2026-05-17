/**
 * Lucid-Lab chat bot configuration.
 * Reads from process.env at module load time. Throws if required vars missing.
 *
 * During the Next.js static-generation build phase (NEXT_PHASE=phase-production-build),
 * runtime secrets (SUPABASE_*, SMTP_*, …) are not injected by Vercel.
 * We return an empty string for missing required vars during the build phase only;
 * the actual runtime checks in each integration will catch truly missing values.
 */

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    // Don't throw during the Next.js build phase — secrets are runtime-only on Vercel.
    if (process.env['NEXT_PHASE'] === 'phase-production-build') return '';
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : defaultValue;
}

export const config = {
  // Runtime
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  // Supabase
  supabaseUrl: requiredEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // AI provider
  aiProvider: optionalEnv('AI_PROVIDER', 'anthropic') as
    | 'anthropic'
    | 'openai'
    | 'gemini'
    | 'mistral',
  aiModel: optionalEnv('AI_MODEL', 'claude-sonnet-4-5-20260115'),
  anthropicApiKey: process.env['ANTHROPIC_API_KEY'] ?? '',
  openaiApiKey: process.env['OPENAI_API_KEY'] ?? '',
  googleAiApiKey: process.env['GOOGLE_AI_API_KEY'] ?? '',
  mistralApiKey: process.env['MISTRAL_API_KEY'] ?? '',

  // Apollo.io (lead data enrichment)
  apolloApiKey: process.env['APOLLO_API_KEY'] ?? '',

  // TidyCal
  tidycalApiKey: process.env['TIDYCAL_API_KEY'] ?? '',
  tidycalBookingTypeId: process.env['TIDYCAL_BOOKING_TYPE_ID'] ?? '',
  /** Public TidyCal booking URL — used as fallback when the API key isn't available. */
  tidycalPublicUrl: optionalEnv('TIDYCAL_PUBLIC_URL', 'https://tidycal.com/lucid-lab/audit-flash-30-minutes'),

  // Email (SMTP)
  smtpHost: process.env['SMTP_HOST'] ?? '',
  smtpPort: parseInt(optionalEnv('SMTP_PORT', '465'), 10),
  /** true for 465 (SSL), false for 587/25 (STARTTLS). */
  smtpSecure: optionalEnv('SMTP_SECURE', 'true').toLowerCase() !== 'false',
  smtpUser: process.env['SMTP_USER'] ?? '',
  smtpPass: process.env['SMTP_PASS'] ?? '',
  emailFrom: optionalEnv('EMAIL_FROM', 'info@lucid-lab.fr'),
  teamNotificationEmail: optionalEnv('TEAM_NOTIFICATION_EMAIL', 'info@lucid-lab.fr'),

  // Widget / origin
  chatAllowedOrigin: optionalEnv('CHAT_ALLOWED_ORIGIN', 'https://lucid-lab.fr'),

  // Turnstile
  turnstileSecret: process.env['TURNSTILE_SECRET'] ?? '',

  // Admin + cron
  adminApiKey: process.env['ADMIN_API_KEY'] ?? '',
  cronSecret: process.env['CRON_SECRET'] ?? '',

  // DocuSeal document automation
  docusealApiBaseUrl: process.env['DOCUSEAL_API_BASE_URL'] ?? '',
  docusealApiKey: process.env['DOCUSEAL_API_KEY'] ?? '',
  docusealWebhookSecret: process.env['DOCUSEAL_WEBHOOK_SECRET'] ?? '',
  docusealBonDeCommandeTemplateId: process.env['DOCUSEAL_BON_DE_COMMANDE_TEMPLATE_ID'] ?? '',
  docusealCompletedRedirectUrl: process.env['DOCUSEAL_COMPLETED_REDIRECT_URL'] ?? '',

  // Google Drive document archive — service account (legacy)
  googleDriveClientEmail: process.env['GOOGLE_DRIVE_CLIENT_EMAIL'] ?? process.env['GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL'] ?? '',
  googleDrivePrivateKey: process.env['GOOGLE_DRIVE_PRIVATE_KEY'] ?? process.env['GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY'] ?? '',
  googleDriveImpersonatedUser: process.env['GOOGLE_DRIVE_IMPERSONATED_USER'] ?? '',
  googleDriveRootFolderId: process.env['GOOGLE_DRIVE_ROOT_FOLDER_ID'] ?? '',
  // Google Drive document archive — OAuth2 (preferred)
  googleDriveClientId: process.env['GOOGLE_DRIVE_CLIENT_ID'] ?? '',
  googleDriveClientSecret: process.env['GOOGLE_DRIVE_CLIENT_SECRET'] ?? '',
  googleDriveRefreshToken: process.env['GOOGLE_DRIVE_REFRESH_TOKEN'] ?? '',

  // Billing defaults
  billingDefaultVatRate: parseFloat(optionalEnv('BILLING_DEFAULT_VAT_RATE', '20')),

  // Budget + rate limit
  dailyAiBudgetEur: parseFloat(optionalEnv('DAILY_AI_BUDGET_EUR', '5')),
  rateLimitMax: parseInt(optionalEnv('RATE_LIMIT_MAX', '60'), 10),
  rateLimitWindowSec: parseInt(optionalEnv('RATE_LIMIT_WINDOW_SEC', '600'), 10),

  // Retention
  retentionMessagesDays: parseInt(optionalEnv('RETENTION_MESSAGES_DAYS', '365'), 10),
  retentionLeadsLostDays: parseInt(optionalEnv('RETENTION_LEADS_LOST_DAYS', '365'), 10),
  retentionAuditLogDays: parseInt(optionalEnv('RETENTION_AUDIT_LOG_DAYS', '730'), 10),

  // IP hashing salt — rotate periodically in production
  ipHashSalt: optionalEnv('IP_HASH_SALT', 'lucid-lab-default-salt-change-me'),
} as const;

export type Config = typeof config;

/**
 * Runtime validation — call from API routes to fail fast on misconfiguration.
 */
export function assertProviderKey(): void {
  switch (config.aiProvider) {
    case 'anthropic':
      if (!config.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY required');
      break;
    case 'openai':
      if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY required');
      break;
    case 'gemini':
      if (!config.googleAiApiKey) throw new Error('GOOGLE_AI_API_KEY required');
      break;
    case 'mistral':
      if (!config.mistralApiKey) throw new Error('MISTRAL_API_KEY required');
      break;
    default:
      throw new Error(`Unknown AI_PROVIDER: ${config.aiProvider}`);
  }
}

export function getAllowedOrigins(): string[] {
  return config.chatAllowedOrigin
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
