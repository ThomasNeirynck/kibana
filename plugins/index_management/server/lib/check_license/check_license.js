export function checkLicense(xpackLicenseInfo) {
  const pluginName = 'Index Management';

  // If, for some reason, we cannot get the license information
  // from Elasticsearch, assume worst case and disable
  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    return {
      isAvailable: false,
      showLinks: true,
      enableLinks: false,
      message: `You cannot use ${pluginName} because license information is not available at this time.`
    };
  }

  const VALID_LICENSE_MODES = [
    'trial',
    'standard',
    'gold',
    'platinum'
  ];

  const isLicenseModeValid = xpackLicenseInfo.license.isOneOf(VALID_LICENSE_MODES);
  const isLicenseActive = xpackLicenseInfo.license.isActive();
  const licenseType = xpackLicenseInfo.license.getType();

  // License is not valid
  if (!isLicenseModeValid) {
    return {
      isAvailable: false,
      showLinks: false,
      message: `Your ${licenseType} license does not support ${pluginName}. Please upgrade your license.`
    };
  }

  // License is valid but not active
  if (!isLicenseActive) {
    return {
      isAvailable: false,
      showLinks: true,
      enableLinks: false,
      message: `You cannot use ${pluginName} because your ${licenseType} license has expired.`
    };
  }

  // License is valid and active
  return {
    isAvailable: true,
    showLinks: true,
    enableLinks: true
  };
}
