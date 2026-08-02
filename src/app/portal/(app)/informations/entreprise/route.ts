import { NextResponse } from 'next/server';
import { getPortalSession, portalRedirectUrl } from '@/lib/portal/auth';
import { requestPortalClientLegalUpdate } from '@/lib/portal/data';

/** POST /informations/entreprise: the client submits its company info for review. */
export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
  }

  const formData = await request.formData();
  const result = await requestPortalClientLegalUpdate(session, {
    legalName: String(formData.get('legal_name') ?? ''),
    siren: String(formData.get('siren') ?? ''),
    siret: String(formData.get('siret') ?? ''),
    billingAddress: String(formData.get('billing_address') ?? ''),
    websiteUrl: String(formData.get('website_url') ?? ''),
  });

  const suffix = result.ok ? '?maj=1' : '?erreur=1';
  return NextResponse.redirect(portalRedirectUrl(request, `/informations${suffix}`), 303);
}
