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

    const accessiblePrefix =
        props.kind === 'appointment'
            ? 'Appointment status'
            : props.kind === 'queue'
              ? 'Queue status'
              : 'Record status';

    return (
        <Badge tone={presentation.tone} aria-label={`${accessiblePrefix}: ${presentation.label}`}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {presentation.label}
        </Badge>
    );
}

export default StatusBadge;
