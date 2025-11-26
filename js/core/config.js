/**
 * Configuration Management
 * Single Responsibility: Manages application configuration
 */

export const CONFIG = {
  // Automatically switch between Local and Production based on Vite environment
  API_BASE_URL: import.meta.env.DEV
    ? 'http://localhost:8000'
    : 'https://hotpink-dugong-322722.hostingersite.com/tmf-api',

  ADMIN_AUTH_TOKEN: '649dcf4cbc9bd36ad7a5b3f2f7182af6f406812191ee659aee00107defe05f0e',

  COLORS: {
    grayText: 'rgb(89,89,89)',
    grayBg: 'rgb(228,227,227)',
    blue: 'rgb(80,136,174)',
    green: 'rgb(83,153,73)',
    red: 'rgb(220,38,38)',
    yellow: 'rgb(234,179,8)',
    // LBPA Brand Colors
    black: '#000000',
    lbpaGreen: 'rgb(72,130,95)', // Darker green accent color from LBPA site
  },

  ROUTES: {
    PUBLIC: '/',
    ADMIN: '/admin/',
    ADMIN_UPLOAD: '/admin/upload',
    ADMIN_INCIDENTS: '/admin/incidents',
    ADMIN_LOGS: '/admin/logs',
  },

  API_ENDPOINTS: {
    // Public
    INCIDENTS: '/incidents',
    INCIDENT_BY_ID: (id) => `/incidents/${id}`,
    REGIONS: '/regions',
    SUBSCRIBE: '/subscribe',
    VERIFY_SUBSCRIPTION: (token) => `/subscribe/verify/${token}`,
    UNSUBSCRIBE: (token) => `/unsubscribe/${token}`,

    // Admin
    ADMIN_UPLOADS: '/admin/uploads',
    ADMIN_UPLOAD_PUBLISH: (id) => `/admin/uploads/${id}/publish`,
    ADMIN_UPLOAD_DELETE: (id) => `/admin/uploads/${id}`,
    ADMIN_INCIDENT_UPDATE: (id) => `/admin/incidents/${id}`,
    ADMIN_INCIDENT_DELETE: (id) => `/admin/incidents/${id}`,
    ADMIN_INCIDENTS_BULK: '/admin/incidents/bulk',
    ADMIN_LOGS: '/admin/logs',
    ADMIN_HEALTH: '/admin/health',
    ADMIN_FETCH_TRIGGER: '/admin/fetch/trigger',
    ADMIN_SETTINGS: '/admin/settings',
  },

  INCIDENT_TYPES: [
    { value: 'road_closure', label: 'Road Closure' },
    { value: 'construction', label: 'Construction' },
    { value: 'accident', label: 'Accident' },
    { value: 'transit_delay', label: 'Transit Delay' },
    { value: 'special_event', label: 'Special Event' },
    { value: 'weather', label: 'Weather' },
    { value: 'other', label: 'Other' },
  ],

  SOURCE_TYPES: [
    { value: 'city', label: 'City of Toronto' },
    { value: '511', label: 'Ontario 511' },
    { value: 'ttc', label: 'TTC' },
    { value: 'metrolinx', label: 'Metrolinx' },
  ],
};

export default CONFIG;
