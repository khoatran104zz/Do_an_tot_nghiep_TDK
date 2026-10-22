import { redirect } from 'next/navigation';

/**
 * FE-001: Merged into /resident/notifications
 * Redirects resident announcements to canonical notifications page
 */
export default function ResidentAnnouncementsPage() {
  redirect('/resident/notifications');
}
