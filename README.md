# LBPA Traffic & Transit Management System - Frontend

A SOLID-compliant, accessible, and mobile-responsive frontend for the LBPA Traffic Management system.

## Features

### Core Functionality
- **Public View**: Traffic & Transit Updates with table/map visualization
- **Email Subscriptions**: Daily/weekly digest options
- **Admin Upload**: PDF upload with automatic parsing
- **Admin Incidents**: Full CRUD operations on incidents
- **Admin Logs**: System health monitoring and activity logs
- **Offline Detection**: Graceful degradation when backend is unavailable

### Technical Highlights
- **SOLID Principles**: Clean separation of concerns with modular architecture
- **Vanilla JavaScript**: No framework dependencies for fast loading
- **Mobile-First**: Fully responsive with touch-optimized interactions
- **WCAG 2.0 AA Compliant**: Proper ARIA labels, keyboard navigation, color contrast
- **Modern ES6 Modules**: Clean, maintainable code structure

## Architecture

```
frontend/
├── index.html              # Main HTML entry point
├── css/
│   └── styles.css          # Custom styles and utilities
├── js/
│   ├── app.js             # Application entry point
│   ├── core/              # Core infrastructure
│   │   ├── config.js      # Configuration management
│   │   ├── api.js         # API client (abstraction layer)
│   │   ├── router.js      # Client-side routing
│   │   ├── state.js       # State management
│   │   └── dom.js         # DOM utilities
│   ├── components/        # Reusable UI components
│   │   ├── Modal.js       # Modal dialog component
│   │   └── SubscribeForm.js # Email subscription form
│   └── views/             # Page views
│       ├── PublicView.js        # Public traffic updates
│       ├── AdminUploadView.js   # PDF upload interface
│       ├── AdminIncidentsView.js # Incident management
│       └── AdminLogsView.js     # System logs and health
```

## SOLID Principles Implementation

### Single Responsibility Principle
- Each module has one clear purpose
- `api.js` handles only HTTP communication
- `router.js` handles only navigation
- Each view handles only its specific page

### Open/Closed Principle
- Views can be extended without modifying core infrastructure
- API client can support new endpoints without changing existing code

### Liskov Substitution Principle
- All views implement `render()` and `destroy()` methods
- Views are interchangeable and can be swapped without breaking the router

### Interface Segregation Principle
- Components only depend on methods they use
- No forced dependencies on unused functionality

### Dependency Inversion Principle
- Views depend on API abstraction, not direct fetch calls
- High-level modules don't depend on low-level implementation details

## Accessibility Features (WCAG 2.0 AA)

- ✅ Proper semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ✅ ARIA labels for all interactive elements
- ✅ Keyboard navigation support (Tab, Enter, Escape)
- ✅ Focus states visible on all interactive elements
- ✅ Color contrast ratios meet AA standards (4.5:1 for text)
- ✅ Screen reader friendly
- ✅ Responsive text sizing
- ✅ Touch targets minimum 44x44px on mobile

## Mobile Responsiveness

- Fluid layouts with CSS Grid and Flexbox
- Touch-optimized tap targets
- Horizontal scrolling for large tables
- Collapsed navigation on small screens
- Responsive typography
- Works on screens from 320px to 4K

## API Integration

All API calls go through the centralized API client (`js/core/api.js`):

**Public Endpoints:**
- `GET /incidents` - List all published incidents
- `GET /incidents/{id}` - Get single incident

**Admin Endpoints:**
- `POST /admin/uploads` - Upload PDF file
- `PUT /admin/uploads/{id}/publish` - Publish incidents
- `DELETE /admin/incidents/{id}` - Delete incident
- `GET /admin/logs` - Get system logs
- `GET /admin/health` - Get system health

## Usage

### Development
Simply open `index.html` in a modern browser, or serve with any static file server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### Production
Deploy the `frontend/` directory to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server (Apache, Nginx, etc.)

Make sure to update the `API_BASE_URL` in `js/core/config.js` to point to your production backend.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

## Configuration

Edit `js/core/config.js` to configure:
- API base URL
- Color scheme
- Default settings

## Offline Support

The application gracefully handles offline states:
- Shows warning banner when backend is unreachable
- Displays user-friendly error messages
- Caches last known good state
- Auto-reconnects when service is restored

## Future Enhancements

- Progressive Web App (PWA) support
- Service Worker for offline caching
- Real-time updates via WebSockets
- Advanced map integration (Google Maps/Mapbox)
- CSV export functionality
- Advanced filtering and sorting

## License

Internal LBPA project - All rights reserved
