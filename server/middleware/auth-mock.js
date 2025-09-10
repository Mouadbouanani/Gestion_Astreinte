import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken } from '../config/auth.js';
import { verifyToken as verifyTokenJwtAuth } from '../middleware/jwt-auth.js';

/**
 * Unified authentication middleware that supports both JWT and testing headers
 */
export const flexibleAuth = async (req, res, next) => {
  console.log('🔍 =================================');
  console.log('🔍 FLEXIBLE AUTH MIDDLEWARE START');
  console.log('🔍 =================================');
  
  // --- START MOCK AUTHENTICATION ---
  console.log('⚠️ MOCK AUTH: Bypassing all authentication checks.');
  // Set a dummy user for testing purposes
  req.user = {
    id: '652e93d8a7c7c3b2f8e1b0b0', // Example ID
    email: 'mockuser@example.com',
    role: 'admin', // Assign a role that has broad access
    site: { _id: '652e93d8a7c7c3b2f8e1b0b1', name: 'Mock Site', code: 'MS' },
    secteur: { _id: '652e93d8a7c7c3b2f8e1b0b2', name: 'Mock Secteur', code: 'MSEC' },
    service: { _id: '652e93d8a7c7c3b2f8e1b0b3', name: 'Mock Service', code: 'MSER' },
    fullUser: {
      _id: '652e93d8a7c7c3b2f8e1b0b0',
      firstName: 'Mock',
      lastName: 'User',
      email: 'mockuser@example.com',
      role: 'admin',
      isActive: true,
      isLocked: false,
      // ... other user properties as needed
    }
  };

  req.userInfo = {
    id: req.user.id,
    name: `${req.user.fullUser.firstName} ${req.user.fullUser.lastName}`,
    email: req.user.email,
    role: req.user.role,
    site: req.user.site.name,
    secteur: req.user.secteur.name,
    service: req.user.service.name
  };

  console.log('✅ MOCK AUTH successful - User set to:', req.userInfo);
  console.log('🔍 =================================');
  console.log('🔍 FLEXIBLE AUTH SUCCESS (MOCK)');
  console.log('🔍 =================================');
  return next();
  // --- END MOCK AUTHENTICATION ---

  try {
    // Log the incoming request details
    console.log('📋 Request Details:', {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // Log ALL headers for debugging
    console.log('📋 All Request Headers:', JSON.stringify(req.headers, null, 2));

    let user = null;

    // ========================================
    // STEP 1: Try JWT Authentication
    // ========================================
    console.log('🔐 STEP 1: Attempting JWT Authentication...');
    
    const authHeader = req.headers['authorization'];
    console.log('🔐 Authorization Header:', authHeader ? `"${authHeader}"` : 'NOT FOUND');
    
    if (authHeader) {
      console.log('🔐 Authorization Header Details:', {
        raw: authHeader,
        type: typeof authHeader,
        length: authHeader.length,
        startsWith: authHeader.substring(0, 10),
        includes_bearer: authHeader.toLowerCase().includes('bearer'),
        split_result: authHeader.split(' ')
      });
    }

    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔐 Extracted Token:', token ? {
      exists: true,
      length: token.length,
      starts_with: token.substring(0, 20) + '...',
      is_string: typeof token === 'string'
    } : 'NO TOKEN EXTRACTED');

    if (token) {
      console.log('🔐 Attempting JWT verification...');
      try {
        let decoded;
        try {
          // First try with the config/auth.js verifyToken (with issuer/audience)
          decoded = verifyToken(token);
          console.log('✅ JWT decoded successfully with config/auth verifyToken');
        } catch (configError) {
          console.log('⚠️ Config/auth verifyToken failed, trying jwt-auth verifyToken...');
          // If that fails, try with jwt-auth.js verifyToken
          decoded = verifyTokenJwtAuth(token);
          console.log('✅ JWT decoded successfully with jwt-auth verifyToken');
        }

        console.log('✅ JWT decoded successfully:', {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          exp: decoded.exp,
          iat: decoded.iat
        });

        console.log('🔍 Searching for user in database...');
        user = await User.findById(decoded.id)
          .populate('site', 'name code')
          .populate('secteur', 'name code')
          .populate('service', 'name code')
          .select('-password');

        console.log('🔍 User search result:', user ? {
          found: true,
          id: user._id,
          email: user.email,
          isActive: user.isActive,
          isLocked: user.isLocked
        } : 'USER NOT FOUND');

        if (user && user.isActive && !user.isLocked) {
          console.log('✅ JWT Authentication successful - setting user data');
          
          req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            site: user.site,
            secteur: user.secteur,
            service: user.service,
            fullUser: user
          };

          req.userInfo = {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            site: user.site?.name,
            secteur: user.secteur?.name,
            service: user.service?.name
          };

          console.log('✅ JWT Authentication completed successfully:', req.userInfo);
          console.log('🔍 =================================');
          console.log('🔍 FLEXIBLE AUTH SUCCESS (JWT)');
          console.log('🔍 =================================');
          return next();
        } else {
          console.log('❌ JWT: User validation failed:', {
            userExists: !!user,
            isActive: user?.isActive,
            isLocked: user?.isLocked
          });
        }
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', {
          name: jwtError.name,
          message: jwtError.message,
          tokenLength: token?.length,
          tokenStart: token?.substring(0, 20)
        });
      }
    } else {
      console.log('⚠️ No token found in Authorization header');
    }

    // ========================================
    // STEP 2: Try Custom Headers Authentication
    // ========================================
    console.log('🔐 STEP 2: Attempting Custom Headers Authentication...');
    
    const userEmail = req.headers['x-user-email'];
    const userRole = req.headers['x-user-role'];

    console.log('🔐 Custom Headers:', {
      'x-user-email': userEmail || 'NOT FOUND',
      'x-user-role': userRole || 'NOT FOUND'
    });

    if (userEmail || userRole) {
      console.log('🔍 Custom headers found, searching for user...');
      
      if (userEmail) {
        console.log('🔍 Searching by email:', userEmail);
        user = await User.findOne({ email: userEmail, isActive: true })
          .populate('site', 'name code')
          .populate('secteur', 'name code')
          .populate('service', 'name code');
      } else {
        console.log('🔍 Searching by role:', userRole);
        user = await User.findOne({ role: userRole, isActive: true })
          .populate('site', 'name code')
          .populate('secteur', 'name code')
          .populate('service', 'name code');
      }

      console.log('🔍 Custom header user search result:', user ? {
        found: true,
        id: user._id,
        email: user.email,
        role: user.role
      } : 'USER NOT FOUND');

      if (user) {
        console.log('✅ Custom Headers Authentication successful - setting user data');
        
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role,
          site: user.site,
          secteur: user.secteur,
          service: user.service,
          fullUser: user
        };

        req.userInfo = {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          site: user.site?.name,
          secteur: user.secteur?.name,
          service: user.service?.name
        };

        console.log('✅ Custom Headers Authentication completed successfully:', req.userInfo);
        console.log('🔍 =================================');
        console.log('🔍 FLEXIBLE AUTH SUCCESS (HEADERS)');
        console.log('🔍 =================================');
        return next();
      } else {
        console.log('❌ Custom Headers: User not found or inactive');
      }
    } else {
      console.log('⚠️ No custom headers found');
    }

    // ========================================
    // STEP 3: No Valid Authentication Found
    // ========================================
    console.log('❌ =================================');
    console.log('❌ AUTHENTICATION FAILED');
    console.log('❌ =================================');
    console.log('❌ Summary:', {
      authHeader_present: !!authHeader,
      token_extracted: !!token,
      custom_email_header: !!userEmail,
      custom_role_header: !!userRole,
      user_found: !!user
    });

    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      hint: 'Use either Bearer token or x-user-email/x-user-role headers',
      debug: {
        authHeader_received: !!authHeader,
        token_extracted: !!token,
        custom_headers: {
          email: !!userEmail,
          role: !!userRole
        },
        timestamp: new Date().toISOString()
      },
      methods: {
        production: 'Authorization: Bearer <token>',
        testing: 'x-user-email: admin@example.com OR x-user-role: admin'
      }
    });

  } catch (error) {
    console.error('💥 =================================');
    console.error('💥 FLEXIBLE AUTH ERROR');
    console.error('💥 =================================');
    console.error('💥 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Keep existing middlewares for backward compatibility
export const mockAuth = (userRole, userEmail) => {
  return async (req, res, next) => {
    console.log('🔧 MOCK AUTH called with:', { userRole, userEmail });
    try {
      let user;
      
      if (userEmail) {
        user = await User.findOne({ email: userEmail })
          .populate('site', 'name code')
          .populate('secteur', 'name code')
          .populate('service', 'name code');
      } else {
        user = await User.findOne({ role: userRole, isActive: true })
          .populate('site', 'name code')
          .populate('secteur', 'name code')
          .populate('service', 'name code');
      }

      if (!user) {
        console.log('❌ MOCK AUTH: User not found');
        return res.status(401).json({
          success: false,
          message: `Utilisateur ${userRole || userEmail} introuvable`
        });
      }

      req.user = user;
      
      req.userInfo = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        site: user.site?.name,
        secteur: user.secteur?.name,
        service: user.service?.name
      };

      console.log('✅ MOCK AUTH successful:', req.userInfo);
      next();
    } catch (error) {
      console.error('❌ MOCK AUTH error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur authentification simulée',
        error: error.message
      });
    }
  };
};

export const authFromHeader = async (req, res, next) => {
  console.log('🔧 AUTH FROM HEADER called');
  try {
    const userEmail = req.headers['x-user-email'];
    const userRole = req.headers['x-user-role'];

    console.log('🔧 Headers received:', { userEmail, userRole });

    if (!userEmail && !userRole) {
      return res.status(401).json({
        success: false,
        message: 'En-tête d\'authentification requis (x-user-email ou x-user-role)'
      });
    }

    let user;
        
    if (userEmail) {
      user = await User.findOne({ email: userEmail, isActive: true })
        .populate('site', 'name code')
        .populate('secteur', 'name code')
        .populate('service', 'name code');
    } else {
      user = await User.findOne({ role: userRole, isActive: true })
        .populate('site', 'name code')
        .populate('secteur', 'name code')
        .populate('service', 'name code');
    }

    if (!user) {
      console.log('❌ AUTH FROM HEADER: User not found');
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    req.user = user;
    req.userInfo = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      site: user.site?.name,
      secteur: user.secteur?.name,
      service: user.service?.name
    };

    console.log('✅ AUTH FROM HEADER successful:', req.userInfo);
    next();
  } catch (error) {
    console.error('❌ AUTH FROM HEADER error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur authentification',
      error: error.message
    });
  }
};

export default {
  mockAuth,
  authFromHeader,
  flexibleAuth
};