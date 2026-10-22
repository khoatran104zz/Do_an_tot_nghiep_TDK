import { redirect } from 'next/navigation';

/**
 * FE-003: Canonical route standardized to plural /maintenance-schedules
 * Redirects singular /maintenance-schedule to /maintenance-schedules
 */
export default function MaintenanceScheduleRedirect() {
  redirect('/maintenance-schedules');
}
