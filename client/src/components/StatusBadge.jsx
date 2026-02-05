import React from 'react';

const StatusBadge = ({ status }) => {
    let className = 'badge ';
    switch (status) {
        case 'Received': className += 'badge-received'; break;
        case 'In Design': className += 'badge-design'; break;
        case 'In Production': className += 'badge-production'; break;
        case 'Quality Check': className += 'badge-quality'; break;
        case 'Dispatched': className += 'badge-dispatched'; break;
        case 'Completed': className += 'badge-completed'; break;
        default: className += 'badge-received';
    }

    return (
        <span className={className}>
            {status}
        </span>
    );
};

export default StatusBadge;
