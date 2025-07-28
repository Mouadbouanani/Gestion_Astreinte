import Joi from 'joi';

// Schémas de validation communs
const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('ID MongoDB invalide');
const emailSchema = Joi.string().email().lowercase().trim();
const phoneSchema = Joi.string().pattern(/^(\+212|0)[5-7][0-9]{8}$/).message('Numéro de téléphone marocain invalide');
const passwordSchema = Joi.string().min(8).max(128);

// Validation pour l'authentification
export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: emailSchema.required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false)
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données de connexion invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour la création d'utilisateur
export const validateUserCreation = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: emailSchema.required(),
    phone: phoneSchema.required(),
    password: passwordSchema.required(),
    role: Joi.string().valid('admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur').required(),
    site: objectIdSchema.required(),
    secteur: objectIdSchema.when('role', {
      is: Joi.valid('chef_secteur', 'ingenieur', 'chef_service', 'collaborateur'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    service: objectIdSchema.when('role', {
      is: Joi.valid('chef_service', 'collaborateur'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    isActive: Joi.boolean().default(true)
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données utilisateur invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour la mise à jour d'utilisateur
export const validateUserUpdate = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(2).max(50),
    email: emailSchema,
    phone: phoneSchema,
    role: Joi.string().valid('admin', 'chef_secteur', 'ingenieur', 'chef_service', 'collaborateur'),
    site: objectIdSchema,
    secteur: objectIdSchema,
    service: objectIdSchema,
    isActive: Joi.boolean()
  }).min(1); // Au moins un champ doit être fourni

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données de mise à jour invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour la création de site
export const validateSiteCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().valid(
      'Casablanca', 'Jorf Lasfar', 'Khouribga', 'Boucraâ',
      'Youssoufia', 'Safi', 'Benguerir', 'Laâyoune'
    ).required(),
    code: Joi.string().valid('CAS', 'JLF', 'KHO', 'BOU', 'YOU', 'SAF', 'BEN', 'LAA').required(),
    address: Joi.string().trim().min(10).max(200).required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    }).optional(),
    timezone: Joi.string().default('Africa/Casablanca'),
    isActive: Joi.boolean().default(true)
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données de site invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour la création de secteur
export const validateSecteurCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().valid(
      'Traitement', 'Extraction', 'Maintenance', 'Logistique', 
      'Qualité', 'Production', 'Sécurité', 'Environnement'
    ).required(),
    code: Joi.string().trim().uppercase().min(2).max(10).required(),
    site: objectIdSchema.required(),
    chefSecteur: objectIdSchema.required(),
    description: Joi.string().trim().max(500).optional(),
    isActive: Joi.boolean().default(true)
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données de secteur invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour la création de service
export const validateServiceCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    code: Joi.string().trim().uppercase().min(2).max(20).required(),
    secteur: objectIdSchema.required(),
    chefService: objectIdSchema.required(),
    collaborateurs: Joi.array().items(objectIdSchema).default([]),
    description: Joi.string().trim().max(500).optional(),
    minPersonnel: Joi.number().integer().min(1).max(10).required(),
    isActive: Joi.boolean().default(true)
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données de service invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour la création de planning
export const validatePlanningCreation = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().valid('service', 'secteur').required(),
    periode: Joi.object({
      debut: Joi.date().iso().required(),
      fin: Joi.date().iso().greater(Joi.ref('debut')).required()
    }).required(),
    site: objectIdSchema.required(),
    secteur: objectIdSchema.required(),
    service: objectIdSchema.when('type', {
      is: 'service',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    gardes: Joi.array().items(
      Joi.object({
        date: Joi.date().iso().required(),
        utilisateur: objectIdSchema.required(),
        heureDebut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('18:00'),
        heureFin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('08:00'),
        commentaire: Joi.string().max(200).optional()
      })
    ).default([]),
    metadata: Joi.object({
      algorithmeUtilise: Joi.string().valid('manuel', 'rotation_equitable', 'charge_minimale').default('rotation_equitable'),
      parametres: Joi.object({
        respecterIndisponibilites: Joi.boolean().default(true),
        equilibrerCharge: Joi.boolean().default(true),
        inclureChefService: Joi.boolean().default(true),
        prioriteAnciennete: Joi.boolean().default(false)
      }).default({})
    }).default({})
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données de planning invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour la création d'indisponibilité
export const validateIndisponibiliteCreation = (req, res, next) => {
  const schema = Joi.object({
    utilisateur: objectIdSchema.required(),
    dateDebut: Joi.date().iso().required(),
    dateFin: Joi.date().iso().min(Joi.ref('dateDebut')).required(),
    motif: Joi.string().valid(
      'conge_annuel', 'conge_maladie', 'conge_maternite', 'conge_paternite',
      'formation', 'mission', 'urgence_familiale', 'autre'
    ).required(),
    description: Joi.string().max(500).when('motif', {
      is: 'autre',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    priorite: Joi.string().valid('normale', 'urgente', 'critique').default('normale')
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données d\'indisponibilité invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour la création d'escalade
export const validateEscaladeCreation = (req, res, next) => {
  const schema = Joi.object({
    incident: Joi.string().trim().min(10).max(1000).required(),
    typeIncident: Joi.string().valid(
      'panne_equipement', 'arret_production', 'incident_securite',
      'probleme_qualite', 'urgence_maintenance', 'autre'
    ).default('autre'),
    priorite: Joi.string().valid('basse', 'normale', 'haute', 'critique').default('normale'),
    site: objectIdSchema.required(),
    secteur: objectIdSchema.required(),
    service: objectIdSchema.required(),
    declenchePar: Joi.string().valid('systeme_automatique', 'operateur', 'surveillance', 'client').default('systeme_automatique'),
    declarant: Joi.object({
      nom: Joi.string().trim().max(100),
      telephone: phoneSchema,
      email: emailSchema,
      fonction: Joi.string().trim().max(100)
    }).optional()
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données d\'escalade invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.validatedData = value;
  next();
};

// Validation pour les paramètres de requête de pagination
export const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().trim().max(100).optional(),
    filter: Joi.object().optional()
  });

  const { error, value } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Paramètres de pagination invalides',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.pagination = value;
  next();
};

// Validation pour les paramètres de date
export const validateDateRange = (req, res, next) => {
  const schema = Joi.object({
    dateDebut: Joi.date().iso().required(),
    dateFin: Joi.date().iso().min(Joi.ref('dateDebut')).required()
  });

  const { error, value } = schema.validate({
    dateDebut: req.query.dateDebut || req.body.dateDebut,
    dateFin: req.query.dateFin || req.body.dateFin
  });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Plage de dates invalide',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.dateRange = value;
  next();
};

export default {
  validateLogin,
  validateUserCreation,
  validateUserUpdate,
  validateSiteCreation,
  validateSecteurCreation,
  validateServiceCreation,
  validatePlanningCreation,
  validateIndisponibiliteCreation,
  validateEscaladeCreation,
  validatePagination,
  validateDateRange
};
