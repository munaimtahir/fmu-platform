/** Product and institution identity for the configured deployment. */
export const branding = {
  platformProvider: import.meta.env.VITE_PLATFORM_PROVIDER || 'Vexel',
  platformName: import.meta.env.VITE_PLATFORM_NAME || 'Vexel MedSIMS',
  institutionName: import.meta.env.VITE_INSTITUTION_NAME || 'Example Medical College',
  institutionShortName: import.meta.env.VITE_INSTITUTION_SHORT_NAME || 'Example Medical College',
  institutionLogo: import.meta.env.VITE_INSTITUTION_LOGO || '',
  institutionAddress: import.meta.env.VITE_INSTITUTION_ADDRESS || '',
  institutionEmail: import.meta.env.VITE_INSTITUTION_EMAIL || 'registrar@examplemedical.edu',
  institutionEmailDomain: import.meta.env.VITE_INSTITUTION_EMAIL_DOMAIN || 'examplemedical.edu',
  institutionPhone: import.meta.env.VITE_INSTITUTION_PHONE || '',
  institutionWebsite: import.meta.env.VITE_INSTITUTION_WEBSITE || '',
  institutionPrimaryColor: import.meta.env.VITE_INSTITUTION_PRIMARY_COLOR || '#2563EB',
  institutionSecondaryColor: import.meta.env.VITE_INSTITUTION_SECONDARY_COLOR || '#0F172A',
  regulatoryAuthority: import.meta.env.VITE_REGULATORY_AUTHORITY || '',
  institutionType: import.meta.env.VITE_INSTITUTION_TYPE || 'Medical College',
  publicAppDomain: import.meta.env.VITE_PUBLIC_APP_DOMAIN || window.location.hostname,
} as const
