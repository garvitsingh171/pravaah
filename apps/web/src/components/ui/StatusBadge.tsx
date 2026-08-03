import type { AppointmentStatus, QueueStatus } from '../../types';
import Badge from './Badge';
import {
    activeStatusPresentation,
    appointmentStatusPresentation,
    queueStatusPresentation,
} from './statusPresentation';

type StatusBadgeProps =
    | {
          kind: 'appointment';
          status: AppointmentStatus;
      }
    | {
          kind: 'queue';
          status: QueueStatus;
      }
    | {
          kind: 'active';
          status: boolean;
      };

function StatusBadge(props: StatusBadgeProps) {
    const presentation =
        props.kind === 'appointment'
            ? appointmentStatusPresentation[props.status]
            : props.kind === 'queue'
              ? queueStatusPresentation[props.status]
              : activeStatusPresentation[props.status ? 'active' : 'inactive'];

    return <Badge tone={presentation.tone}>{presentation.label}</Badge>;
}

export default StatusBadge;
