import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { ReportReason, ReportTargetType } from '../../types';

export async function submitReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  description?: string,
): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    reporterId,
    targetType,
    targetId,
    reason,
    description: description ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
}
