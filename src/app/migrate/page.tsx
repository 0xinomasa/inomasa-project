import { redirect } from 'next/navigation';

/** Preserve existing links while adopting the owner's CONNECT product wording. */
export default function MigratePage() {
  redirect('/connect');
}
