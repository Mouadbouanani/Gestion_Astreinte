// OCP Theme Configuration
export const ocpTheme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main OCP blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // OCP accent blue
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Success green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Warning yellow
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Error red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },
  
  shadows: {
    ocp: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'ocp-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'ocp-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    }
  },

  components: {
    button: {
      variants: {
        primary: {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#2563eb',
          },
          '&:focus': {
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
          }
        },
        secondary: {
          backgroundColor: '#f3f4f6',
          color: '#374151',
          '&:hover': {
            backgroundColor: '#e5e7eb',
          }
        },
        success: {
          backgroundColor: '#22c55e',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#16a34a',
          }
        },
        warning: {
          backgroundColor: '#f59e0b',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#d97706',
          }
        },
        error: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#dc2626',
          }
        }
      }
    },

    card: {
      base: {
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }
    },

    badge: {
      variants: {
        admin: {
          backgroundColor: '#fee2e2',
          color: '#991b1b',
        },
        chef_secteur: {
          backgroundColor: '#fef3c7',
          color: '#92400e',
        },
        chef_service: {
          backgroundColor: '#dbeafe',
          color: '#1e40af',
        },
        ingenieur: {
          backgroundColor: '#dcfce7',
          color: '#166534',
        },
        collaborateur: {
          backgroundColor: '#f3f4f6',
          color: '#374151',
        }
      }
    },

    planning: {
      calendar: {
        dayCell: {
          minHeight: '8rem',
          padding: '0.5rem',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#ffffff'
        },
        today: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6'
        },
        weekend: {
          backgroundColor: '#f9fafb',
          color: '#ea580c'
        },
        holiday: {
          backgroundColor: '#fef2f2',
          color: '#dc2626'
        },
        assignment: {
          ingenieur: {
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            border: '1px solid #bfdbfe'
          },
          collaborateur: {
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0'
          }
        }
      },
      
      contact: {
        compact: {
          ingenieur: {
            backgroundColor: '#eff6ff',
            borderColor: '#bfdbfe',
            color: '#1e3a8a'
          },
          collaborateur: {
            backgroundColor: '#f0fdf4',
            borderColor: '#bbf7d0',
            color: '#14532d'
          }
        }
      },

      panne: {
        indicator: {
          critique: {
            backgroundColor: '#fee2e2',
            color: '#991b1b'
          },
          haute: {
            backgroundColor: '#fed7aa',
            color: '#9a3412'
          },
          moyenne: {
            backgroundColor: '#fef3c7',
            color: '#92400e'
          },
          basse: {
            backgroundColor: '#dbeafe',
            color: '#1e40af'
          }
        },
        ring: {
          color: '#dc2626',
          width: '2px'
        }
      }
    }
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },

  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px'
  }
};

export default ocpTheme;