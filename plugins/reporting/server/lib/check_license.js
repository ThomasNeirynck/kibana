const messages = {
  getUnavailable: () => {
    return 'You cannot use Reporting because license information is not available at this time.';
  },
  getExpired: (license) => {
    return `You cannot use Reporting because your ${license.getType()} license has expired.`;
  }
};

const makeManagementFeature = (exportTypes) => {
  return {
    id: 'management',
    checkLicense: (license) => {
      if (!license) {
        return {
          showLinks: true,
          enableLinks: false,
          message: messages.getUnavailable(),
        };
      }

      if (!license.isActive()) {
        return {
          showLinks: true,
          enableLinks: false,
          message: messages.getExpired(license),
        };
      }

      return {
        showLinks: true,
        enableLinks: true,
        jobTypes: exportTypes
          .filter(exportType => license.isOneOf(exportType.validLicenses))
          .map(exportType => exportType.jobType)
      };
    }
  };
};

const makeExportTypeFeature = (exportType) => {
  return {
    id: exportType.id,
    checkLicense: (license) => {
      if (!license) {
        return {
          showLinks: true,
          enableLinks: false,
          message: messages.getUnavailable(),
        };
      }

      if (!license.isOneOf(exportType.validLicenses)) {
        return {
          showLinks: false,
          enableLinks: false,
          message: `Your ${license.getType()} license does not support ${exportType.name} Reporting. Please upgrade your license.`
        };
      }

      if (!license.isActive()) {
        return {
          showLinks: true,
          enableLinks: false,
          message: messages.getExpired(license),
        };
      }

      return {
        showLinks: true,
        enableLinks: true,
      };
    }
  };
};

export function checkLicenseFactory(exportTypesRegistry) {
  return function checkLicense(xpackLicenseInfo) {
    const license = xpackLicenseInfo === null || !xpackLicenseInfo.isAvailable() ? null : xpackLicenseInfo.license;

    const exportTypes = Array.from(exportTypesRegistry.getAll());
    const reportingFeatures = [...exportTypes.map(makeExportTypeFeature), makeManagementFeature(exportTypes)];

    return reportingFeatures.reduce((result, feature) => {
      result[feature.id] = feature.checkLicense(license);
      return result;
    }, {});
  };
}
