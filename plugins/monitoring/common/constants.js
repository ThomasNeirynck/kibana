/**
 * The Monitoring API version is the expected API format that we export and expect to import.
 * @type {string}
 */
export const MONITORING_SYSTEM_API_VERSION = '6';
/**
 * The name of the Kibana System ID used to publish and lookup Kibana stats through the Monitoring system.
 * @type {string}
 */
export const KIBANA_SYSTEM_ID = 'kibana';
/**
 * The name of the Kibana System ID used to lookup Kibana stats through the Monitoring system.
 * @type {string}
 */
export const LOGSTASH_SYSTEM_ID = 'logstash';
/**
 * The type name used within the Monitoring index to publish Kibana stats.
 * @type {string}
 */
export const KIBANA_STATS_TYPE = 'kibana_stats';
/**
 * The type name used within the Monitoring index to publish Kibana stats.
 * @type {string}
 */
export const KIBANA_SETTINGS_TYPE = 'kibana_settings';

/*
 * Values for column sorting in table options
 * @type {number} 1 or -1
 */
export const SORT_ASCENDING = 1;
export const SORT_DESCENDING = -1;

/*
 * config options for welcome banner / allow phone home
 * @type {string}
 */
export const CONFIG_SHOW_BANNER = 'xPackMonitoring:showBanner';
export const CONFIG_ALLOW_REPORT = 'xPackMonitoring:allowReport';

/*
 * Chart colors
 * @type {string}
 */
export const CHART_LINE_COLOR = '#d2d2d2';
export const CHART_TEXT_COLOR = '#9c9c9c';

/*
 * Number of cluster alerts to show on overview page
 * @type {number}
 */
export const CLUSTER_ALERTS_SEARCH_SIZE = 3;

/*
 * Format for moment-duration-format timestamp-to-duration template if the time diffs are gte 1 month
 * @type {string}
 */
export const FORMAT_DURATION_TEMPLATE_LONG = 'M [months] d [days]';

/*
 * Format for moment-duration-format timestamp-to-duration template if the time diffs are lt 1 month
 * @type {string}
 */
export const FORMAT_DURATION_TEMPLATE_SHORT = ' d [days] h [hrs] m [min]';


/*
 * Simple unique values for Timestamp to duration flags. These are used for
 * determining if calculation should be formatted as "time until" (now to
 * timestamp) or "time since" (timestamp to now)
 */
export const CALCULATE_DURATION_SINCE = 'since';
export const CALCULATE_DURATION_UNTIL = 'until';

/**
 * Representative of an invalid license to be used when a license cannot be trusted.
 * @type {Object}
 */
export const INVALID_LICENSE = { type: 'invalid', status: 'inactive' };

/**
 * In order to show ML Jobs tab in the Elasticsearch section / tab navigation, license must be supported
 */
export const ML_SUPPORTED_LICENSES = [ 'trial', 'platinum' ];

/**
 * The amount of time, in milliseconds, to wait between reports when enabled.
 *
 * Currently 24 hours.
 * @type {Number}
 */
export const REPORT_INTERVAL_MS = 86400000;

/**
 * Metadata service URLs for the different cloud services that have constant URLs (e.g., unlike GCP, which is a constant prefix).
 *
 * @type {Object}
 */
export const CLOUD_METADATA_SERVICES = {
  // We explicitly call out the version, 2016-09-02, rather than 'latest' to avoid unexpected changes
  AWS_URL: 'http://169.254.169.254/2016-09-02/dynamic/instance-identity/document',

  // 2017-04-02 is the first GA release of this API
  AZURE_URL: 'http://169.254.169.254/metadata/instance?api-version=2017-04-02',

  // GCP documentation shows both 'metadata.google.internal' (mostly) and '169.254.169.254' (sometimes)
  // To bypass potential DNS changes, the IP was used because it's shared with other cloud services
  GCP_URL_PREFIX: 'http://169.254.169.254/computeMetadata/v1/instance'
};

/**
 * Constants used by Logstash monitoring code
 */
export const LOGSTASH = {

  /**
   * Constants used by Logstash Pipeline Viewer code
   */
  PIPELINE_VIEWER: {
    GRAPH: {
      EDGES: {
        SVG_CLASS: 'lspvEdge'
      },
      VERTICES: {
        BORDER_RADIUS_PX: 4,
        WIDTH_PX: 320,
        HEIGHT_PX: 80,

        /**
         * Vertical distance between vertices, as measured from top-border-to-top-border
         */
        VERTICAL_DISTANCE_PX: 20,

        DISPLAY_ID_MAX_LENGTH_CHARS: 15
      }
    }
  }
};
