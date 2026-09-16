import { notFound } from 'next/navigation';
import ContextStudio from '@/components/context-studio/ContextStudio';
import { isContextStudioEnabled } from '@/lib/server/context-studio-feature-flag';
import { requireAuthenticatedPageUser } from '@/lib/supabase/page-auth';

export default async function ContextStudioPage() {
  if (!isContextStudioEnabled()) notFound();
  await requireAuthenticatedPageUser();
  return <ContextStudio />;
}
