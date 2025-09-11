# Space Engineer Dashboard

A comprehensive mission control dashboard component for space engineers and mission operators.

## Features

### 1. Mission Status Overview

- Active missions with real-time countdown timers
- Mission health indicators (green/yellow/red status)
- Progress tracking with visual progress bars
- Next critical milestones display
- Quick actions for mission management

### 2. Real-time Satellite Tracking

- Active satellites count with operational status
- Next ground station passes (AOS/LOS times)
- Link budget status monitoring
- Signal strength visualization with 24-hour charts

### 3. Daily Tasks & Reminders

- Today's scheduled activities
- Upcoming compliance deadlines
- Test procedures due
- Document reviews pending
- Priority-based task organization

### 4. System Health Monitor

- Ground station connectivity status
- API usage and credits remaining
- Data storage usage tracking
- System alerts and notifications
- Real-time resource usage charts

### 5. Interactive Charts

- Signal strength over time (Area Chart)
- Orbital parameters tracking (Line Chart)
- System resource usage (Pie Chart + Progress Bars)
- Real-time data visualization with Recharts

### 6. Quick Launch Panels

- Launch new mission planning
- Run orbit propagation
- Schedule ground pass
- Generate compliance report

### 7. Activity Feed

- Latest mission updates
- Team collaboration events
- System notifications
- Integration alerts

## Technologies Used

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization
- **Next.js** for SSR/SSG
- **Date-fns** for date formatting

## Component Structure

```
SpaceEngineerDashboard/
├── Types and Interfaces
├── Mock Data Generator
├── Utility Functions
├── Main Component
│   ├── Header Section
│   ├── Mission Status Grid
│   ├── System Health Monitor
│   ├── Satellite Tracking Panel
│   ├── Daily Tasks Section
│   ├── Interactive Charts
│   ├── Resource Usage Monitor
│   ├── Quick Actions Panel
│   └── Activity Feed
```

## Usage

```tsx
import SpaceEngineerDashboard from "~/components/dashboard/SpaceEngineerDashboard";

function App() {
  return <SpaceEngineerDashboard />;
}
```

## Data Integration

The component currently uses mock data but is designed to easily integrate with real APIs:

1. Replace `generateMockData()` with actual API calls
2. Use React Query or SWR for data fetching
3. Implement real-time WebSocket connections for live updates
4. Connect to mission control systems (STK, GMAT, etc.)

## Styling

The component uses a professional aerospace industry aesthetic with:

- Dark theme optimized for mission control environments
- Color-coded status indicators
- Responsive grid layouts
- Professional typography
- Subtle animations and transitions

## Real-time Features

- Countdown timers update every second
- Data refreshes every 30 seconds
- Loading states with aerospace-themed messaging
- Responsive to screen size changes

## Future Enhancements

- Integration with satellite tracking APIs
- Real-time telemetry data streams
- Advanced orbital mechanics calculations
- Multi-mission dashboard views
- Export capabilities for reports
- User customization options
- Voice alerts and notifications
