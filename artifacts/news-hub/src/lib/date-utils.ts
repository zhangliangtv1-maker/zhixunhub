import { formatDistanceToNow } from 'date-fns';

export function timeAgo(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (e) {
    return 'sometime ago';
  }
}
