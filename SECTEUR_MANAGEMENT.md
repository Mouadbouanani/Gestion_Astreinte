# Secteur Management System - OCP Astreinte

## Overview

The Secteur Management System provides comprehensive functionality for managing organizational sectors within OCP sites. This system follows the same patterns and best practices as the existing Sites management, ensuring consistency and maintainability.

## Architecture

### Frontend Components

#### 1. SecteurPage (`frontend/src/pages/Sites/SecteurPage.tsx`)
- **Purpose**: Main page for managing secteurs within a site
- **Features**:
  - List all secteurs for a specific site
  - Create new secteurs
  - Edit existing secteurs
  - Delete secteurs (soft delete)
  - Real-time statistics display
  - Permission-based access control

#### 2. ServicePage (`frontend/src/pages/Sites/ServicePage.tsx`)
- **Purpose**: Manage services within a secteur
- **Features**:
  - List all services for a specific secteur
  - Create new services
  - Edit existing services
  - Delete services (soft delete)
  - Service statistics and user counts
  - Hierarchical organization display

#### 3. MonSecteur (`frontend/src/pages/MonSecteur/MonSecteur.tsx`)
- **Purpose**: Sector manager's view of their assigned secteur
- **Features**:
  - Overview of secteur statistics
  - Service management within the secteur
  - User role distribution
  - Quick actions for sector management
  - Real-time data updates

#### 4. SecteurDashboard (`frontend/src/pages/Sites/SecteurDashboard.tsx`)
- **Purpose**: Comprehensive dashboard for secteur overview
- **Features**:
  - Site-wide secteur statistics
  - User role distribution charts
  - Sector status monitoring
  - Quick action buttons
  - Performance metrics

### Backend API Endpoints

#### Secteur Management
```javascript
// Get secteurs by site
GET /api/org/sites/:siteId/secteurs

// Get single secteur with details
GET /api/org/secteurs/:id

// Create new secteur
POST /api/org/sites/:siteId/secteurs

// Update secteur
PUT /api/org/secteurs/:id

// Delete secteur (soft delete)
DELETE /api/org/sites/:siteId/secteurs/:id
```

#### Service Management
```javascript
// Get services by secteur
GET /api/org/secteurs/:secteurId/services

// Get single service with details
GET /api/org/services/:id

// Create new service
POST /api/org/secteurs/:secteurId/services

// Update service
PUT /api/org/services/:id

// Delete service (soft delete)
DELETE /api/org/services/:id
```

## Data Models

### Secteur Model
```typescript
interface Secteur {
  _id: string;
  name: string;
  code: string;
  description?: string;
  site: string | Site;
  isActive: boolean;
  chefSecteur?: string | User;
  createdAt: string;
  updatedAt: string;
}
```

### Service Model
```typescript
interface Service {
  _id: string;
  name: string;
  code: string;
  description?: string;
  secteur: string | Secteur;
  isActive: boolean;
  chefService?: string | User;
  minPersonnel: number;
  createdAt: string;
  updatedAt: string;
}
```

## Best Practices

### 1. Error Handling
- **Consistent Error Messages**: All error messages are in French and follow a consistent format
- **Error Codes**: Specific error codes for different types of failures
- **User-Friendly Messages**: Clear, actionable error messages for users
- **Development Debugging**: Enhanced error details in development mode

```typescript
// Example error handling pattern
try {
  await apiService.deleteSecteur(secteurId);
} catch (err: any) {
  const errorData = err.response?.data;
  let errorMessage = 'Erreur lors de la suppression du secteur';
  
  if (errorData?.code === 'INVALID_TOKEN') {
    errorMessage = 'Session expirée. Veuillez vous reconnecter.';
  } else if (errorData?.code === 'DEPENDENCIES_EXIST') {
    errorMessage = errorData.message;
  }
  
  alert(`Erreur: ${errorMessage}`);
}
```

### 2. Permission Management
- **Role-Based Access**: Different permissions for different user roles
- **Hierarchical Access**: Users can only access their assigned scope
- **Automatic Authorization**: JWT middleware handles authorization automatically

```typescript
// Permission check example
if (!user || (user.role !== 'admin' && user.role !== 'chef_secteur')) {
  return (
    <div className="text-center">
      <h2>Accès non autorisé</h2>
      <p>Cette page est réservée aux administrateurs et chefs de secteur.</p>
    </div>
  );
}
```

### 3. Data Validation
- **Frontend Validation**: Form validation with required fields
- **Backend Validation**: Server-side validation for all inputs
- **Predefined Lists**: Valid secteur and service names from OCP standards

```typescript
// Backend validation example
const validSecteurs = [
  'Traitement', 'Extraction', 'Maintenance', 'Logistique', 'Qualité'
];

if (!validSecteurs.includes(name.trim())) {
  return res.status(400).json({
    success: false,
    message: 'Nom de secteur invalide',
    validSecteurs
  });
}
```

### 4. State Management
- **Local State**: Use React useState for component-specific state
- **API Integration**: Direct API calls with proper error handling
- **Loading States**: Consistent loading indicators across all components
- **Optimistic Updates**: Immediate UI updates with fallback on errors

### 5. UI/UX Patterns
- **Consistent Design**: All components follow the same design patterns
- **Responsive Layout**: Mobile-first responsive design
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Loading States**: Clear loading indicators and disabled states

```typescript
// Loading state example
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocp-primary"></div>
    </div>
  );
}
```

### 6. API Service Pattern
- **Centralized API**: All API calls go through the apiService
- **Token Management**: Automatic token refresh and management
- **Error Interceptors**: Global error handling for API responses
- **Type Safety**: Full TypeScript support for API responses

```typescript
// API service usage example
const loadSecteurs = async () => {
  try {
    setIsLoading(true);
    const response = await apiService.getSecteurs(siteId);
    setSecteurs(response.data || []);
  } catch (error) {
    console.error('Error loading secteurs:', error);
    setSecteurs([]);
  } finally {
    setIsLoading(false);
  }
};
```

## Security Considerations

### 1. Authentication
- **JWT Tokens**: Secure token-based authentication
- **Token Refresh**: Automatic token refresh before expiration
- **Session Management**: Proper session handling and cleanup

### 2. Authorization
- **Role-Based Access**: Different permissions for different roles
- **Scope-Based Access**: Users can only access their assigned scope
- **Resource Ownership**: Users can only modify resources they own

### 3. Data Protection
- **Input Sanitization**: All inputs are sanitized and validated
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Prevention**: Proper output encoding and CSP headers

## Performance Optimization

### 1. Data Loading
- **Lazy Loading**: Load data only when needed
- **Pagination**: Implement pagination for large datasets
- **Caching**: Cache frequently accessed data

### 2. UI Performance
- **Virtual Scrolling**: For large lists
- **Debounced Search**: Prevent excessive API calls
- **Optimistic Updates**: Immediate UI feedback

### 3. API Optimization
- **Batch Operations**: Group related API calls
- **Selective Loading**: Load only required fields
- **Connection Pooling**: Efficient database connections

## Testing Strategy

### 1. Unit Tests
- **Component Testing**: Test individual components
- **Service Testing**: Test API service functions
- **Utility Testing**: Test helper functions

### 2. Integration Tests
- **API Testing**: Test API endpoints
- **Database Testing**: Test database operations
- **Authentication Testing**: Test auth flows

### 3. E2E Tests
- **User Flows**: Test complete user journeys
- **Cross-Browser Testing**: Test in different browsers
- **Mobile Testing**: Test responsive design

## Deployment Considerations

### 1. Environment Configuration
- **Environment Variables**: Use environment variables for configuration
- **Feature Flags**: Implement feature flags for gradual rollouts
- **Configuration Management**: Centralized configuration management

### 2. Monitoring
- **Error Tracking**: Implement error tracking and alerting
- **Performance Monitoring**: Monitor API response times
- **User Analytics**: Track user behavior and usage patterns

### 3. Backup and Recovery
- **Database Backups**: Regular database backups
- **Disaster Recovery**: Plan for data recovery
- **Rollback Strategy**: Ability to rollback deployments

## Usage Examples

### Creating a New Secteur
```typescript
const handleCreateSecteur = async (formData: CreateSecteurForm) => {
  try {
    await apiService.createSecteur({
      name: formData.name,
      code: formData.code,
      description: formData.description,
      site: siteId
    });
    loadSecteurs(); // Refresh the list
  } catch (error) {
    handleError(error);
  }
};
```

### Managing Services in a Secteur
```typescript
const handleCreateService = async (formData: CreateServiceForm) => {
  try {
    await apiService.createService({
      name: formData.name,
      code: formData.code,
      description: formData.description,
      secteur: secteurId,
      minPersonnel: formData.minPersonnel
    });
    loadServices(); // Refresh the list
  } catch (error) {
    handleError(error);
  }
};
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user role and permissions
   - Verify JWT token is valid
   - Ensure user has access to the requested resource

2. **Data Not Loading**
   - Check API endpoint availability
   - Verify network connectivity
   - Check browser console for errors

3. **Form Validation Errors**
   - Ensure all required fields are filled
   - Check field format requirements
   - Verify data types match expected format

### Debug Information
- Debug information is displayed in development mode
- Check browser console for detailed error logs
- Use network tab to inspect API requests/responses

## Future Enhancements

1. **Advanced Analytics**: More detailed reporting and analytics
2. **Bulk Operations**: Support for bulk create/update/delete operations
3. **Audit Trail**: Track all changes with user and timestamp
4. **Advanced Search**: Full-text search and filtering capabilities
5. **Export Functionality**: Export data to various formats
6. **Real-time Updates**: WebSocket integration for real-time updates

## Contributing

When contributing to the secteur management system:

1. Follow the existing code patterns and conventions
2. Add proper TypeScript types for all new features
3. Include error handling for all new functionality
4. Add appropriate tests for new features
5. Update documentation for any changes
6. Follow the established security practices

## Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Contact the development team
- Check the project issue tracker 