import React from 'react';
import '../DailyLogs.css';

export default function DailyLogs({ logs }) {
  if (!logs || logs.length === 0) return null;


  const statusColors = {
    DRIVING: '#dc2626',      
    ON_DUTY: '#d97706',    
    OFF_DUTY: '#16a34a',    
    SLEEPER_BERTH: '#2563eb' 
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'DRIVING': return 'status-driving';
      case 'ON_DUTY': return 'status-onduty';
      case 'OFF_DUTY': return 'status-offduty';
      case 'SLEEPER_BERTH': return 'status-sleeper';
      default: return '';
    }
  };

  return (
    <div className="daily-logs-container">
      <h2 className="daily-logs-title">Electronic Logging Device (ELD) - Daily Sheets</h2>
      
      {logs.map((dayLog) => (
        <div key={dayLog.day} className="day-card">
          <h3>Day {dayLog.day}</h3>
          
    
          <div className="timeline-bar">
            {dayLog.events.map((event, idx) => {
              const widthPercentage = (event.duration / 24) * 100;
              return (
                <div 
                  key={idx}
                  className="timeline-segment"
                  style={{
                    width: `${widthPercentage}%`,
                    backgroundColor: statusColors[event.status] || '#94a3b8',
                  }}
                  title={`Status: ${event.status}\nDuration: ${event.duration}h\nReason: ${event.reason}`}
                />
              );
            })}
          </div>
    <div>
    <table className="table-wrapper">
    <thead>
      <tr>
        <th>Status</th>
        <th>Start Time</th>
        <th>End Time</th>
        <th>Duration (Hrs)</th>
        <th>Event / Reason</th>
      </tr>
    </thead>
          <tbody>
      {dayLog.events.map((event, idx) => (
        <tr key={idx}>
          <td className={getStatusClass(event.status)}>
            {event.status}
          </td>
          <td>{event.startTime.toFixed(2)}h</td>
          <td>{event.endTime.toFixed(2)}h</td>
          <td>{event.duration.toFixed(2)}h</td>
          <td>{event.reason}</td>
        </tr>
      ))}
         </tbody>
           </table>
      </div>
        </div>
      ))}
    </div>
  );
}