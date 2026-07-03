import 'server-only';

import { config } from '@/lib/bot/config';

/**
 * Thin client for LinkedIn member posting.
 *
 * Auth model: "Share on LinkedIn" (scope `w_member_social`) to publish on
 * behalf of the authenticated member, plus "Sign In with LinkedIn using OpenID
 * Connect" (`openid profile email`) to resolve the member URN.
 *
 * Posting uses the `/v2/ugcPosts` endpoint with a plain-text `shareCommentary`.
 * We deliberately avoid the newer `/rest/posts` `commentary` field because it
 * requires backslash-escaping reserved characters `( ) [ ] { } < > # * _ ~ | @`,
 * which our French copy is full of. ugcPosts takes raw UTF-8 text.
 */

const OAUTH_BASE = 'https://www.linkedin.com/oauth/v2';
const API_BASE = 'https://api.linkedin.com';
const RESTLI_HEADER = { 'X-Restli-Protocol-Version': '2.0.0' } as const;

/** State cookie used to protect the OAuth round-trip against CSRF. */
export const LINKEDIN_OAUTH_STATE_COOKIE = 'll_linkedin_oauth_state';

/** Scopes requested at authorize time. */
export const LINKEDIN_SCOPES = ['openid', 'profile', 'email', 'w_member_social'] as const;

export type LinkedInToken = {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string | null;
  refreshTokenExpiresInSeconds: number | null;
  scope: string | null;
};

export type LinkedInMember = {
  sub: string;
  name: string | null;
  email: string | null;
};

export type LinkedInEngagement = {
  reactions: number | null;
  comments: number | null;
};

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.linkedinClientId,
    redirect_uri: config.linkedinRedirectUri,
    state,
    scope: LINKEDIN_SCOPES.join(' '),
  });
  return `${OAUTH_BASE}/authorization?${params.toString()}`;
}

async function requestToken(body: URLSearchParams): Promise<LinkedInToken> {
  const res = await fetch(`${OAUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof json.access_token !== 'string') {
    throw new Error(`LinkedIn token error ${res.status}: ${JSON.stringify(json)}`);
  }
  return {
    accessToken: json.access_token,
    expiresInSeconds: typeof json.expires_in === 'number' ? json.expires_in : 0,
    refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : null,
    refreshTokenExpiresInSeconds:
      typeof json.refresh_token_expires_in === 'number' ? json.refresh_token_expires_in : null,
    scope: typeof json.scope === 'string' ? json.scope : null,
  };
}

export function exchangeCodeForToken(code: string): Promise<LinkedInToken> {
  return requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.linkedinRedirectUri,
      client_id: config.linkedinClientId,
      client_secret: config.linkedinClientSecret,
    }),
  );
}

export function refreshAccessToken(refreshToken: string): Promise<LinkedInToken> {
  return requestToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.linkedinClientId,
      client_secret: config.linkedinClientSecret,
    }),
  );
}

export async function fetchMemberInfo(accessToken: string): Promise<LinkedInMember> {
  const res = await fetch(`${API_BASE}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof json.sub !== 'string') {
    throw new Error(`LinkedIn userinfo error ${res.status}: ${JSON.stringify(json)}`);
  }
  return {
    sub: json.sub,
    name: typeof json.name === 'string' ? json.name : null,
    email: typeof json.email === 'string' ? json.email : null,
  };
}

/** Publish a text-only post on the member's feed. Returns the created post URN. */
export async function createMemberPost(input: {
  accessToken: string;
  authorSub: string;
  text: string;
  /** Optional ugcPosts commentary annotations (e.g. an organization mention). */
  commentaryAttributes?: unknown[];
}): Promise<{ postUrn: string }> {
  const shareCommentary =
    input.commentaryAttributes && input.commentaryAttributes.length > 0
      ? { text: input.text, attributes: input.commentaryAttributes }
      : { text: input.text };

  const res = await fetch(`${API_BASE}/v2/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
      ...RESTLI_HEADER,
    },
    cache: 'no-store',
    body: JSON.stringify({
      author: `urn:li:person:${input.authorSub}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary,
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });

  const postUrn = res.headers.get('x-restli-id') || res.headers.get('x-linkedin-id');
  if (!res.ok || !postUrn) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LinkedIn ugcPosts error ${res.status}: ${detail || 'missing post URN header'}`);
  }
  return { postUrn };
}

/**
 * Append a clickable mention of a LinkedIn organization to a post's text and
 * build the matching ugcPosts commentary annotation.
 *
 * Offsets follow JS UTF-16 code-unit counting (`string.length`), which matches
 * LinkedIn's annotation offsets for ugcPosts. The mention renders as a
 * clickable bold link to the company page.
 */
export function appendOrganizationMention(
  text: string,
  input: { organizationId: string; label?: string },
): { text: string; attributes: unknown[] } {
  const label = input.label ?? 'Lucid-Lab';
  const finalText = `${text}\n\n${label}`;
  const start = finalText.length - label.length;
  return {
    text: finalText,
    attributes: [
      {
        start,
        length: label.length,
        value: {
          'com.linkedin.common.CompanyAttributedEntity': {
            company: `urn:li:organization:${input.organizationId}`,
          },
        },
      },
    ],
  };
}

/** Add the first comment (used to carry the link out of the post body). */
export async function addComment(input: {
  accessToken: string;
  authorSub: string;
  postUrn: string;
  text: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/v2/socialActions/${encodeURIComponent(input.postUrn)}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
      ...RESTLI_HEADER,
    },
    cache: 'no-store',
    body: JSON.stringify({
      actor: `urn:li:person:${input.authorSub}`,
      message: { text: input.text },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LinkedIn comment error ${res.status}: ${detail}`);
  }
}

/**
 * Engagement counts for a member's own post. LinkedIn reliably exposes
 * reactions and comments here; impression counts for personal posts are not
 * available via the API, so those stay null.
 */
export async function fetchEngagement(input: {
  accessToken: string;
  postUrn: string;
}): Promise<LinkedInEngagement> {
  const res = await fetch(`${API_BASE}/v2/socialActions/${encodeURIComponent(input.postUrn)}`, {
    headers: { Authorization: `Bearer ${input.accessToken}`, ...RESTLI_HEADER },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`LinkedIn engagement error ${res.status}: ${JSON.stringify(json)}`);
  }
  const likes = (json.likesSummary ?? {}) as Record<string, unknown>;
  const comments = (json.commentsSummary ?? {}) as Record<string, unknown>;
  const reactions = likes.totalLikes ?? likes.aggregatedTotalLikes;
  const commentCount = comments.aggregatedTotalComments ?? comments.count;
  return {
    reactions: typeof reactions === 'number' ? reactions : null,
    comments: typeof commentCount === 'number' ? commentCount : null,
  };
}

/** Public feed URL for a created post URN. */
export function postUrlFromUrn(postUrn: string): string {
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}/`;
}
