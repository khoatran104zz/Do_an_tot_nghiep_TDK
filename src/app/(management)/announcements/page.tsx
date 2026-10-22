import { redirect } from 'next/navigation';

/**
 * FE-001: Merged into /notifications
 * Redirects management announcements to canonical notifications page
 */
export default function ManagementAnnouncementsPage() {
  redirect('/notifications');
}
