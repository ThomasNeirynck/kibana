import { PLUGIN } from '../../../common/constants';
import { Notifier } from 'ui/notify/notifier';

export class XPackUpgradeLicenseService {
  constructor(xpackInfoService, kbnUrlService, $timeout) {
    this.xpackInfoService = xpackInfoService;
    this.kbnUrlService = kbnUrlService;
    this.$timeout = $timeout;

    this.notifier = new Notifier({ location: 'Upgrade' });
  }

  get showLinks() {
    return Boolean(this.xpackInfoService.get(`features.${PLUGIN.ID}.showLinks`));
  }

  get enableLinks() {
    return Boolean(this.xpackInfoService.get(`features.${PLUGIN.ID}.enableLinks`));
  }

  get isAvailable() {
    return Boolean(this.xpackInfoService.get(`features.${PLUGIN.ID}.isAvailable`));
  }

  get message() {
    return this.xpackInfoService.get(`features.${PLUGIN.ID}.message`);
  }

  notifyAndRedirect() {
    this.notifier.error(this.xpackInfoService.get(`features.${PLUGIN.ID}.message`));
    this.kbnUrlService.redirect('/management');
  }

  /**
   * @param opts Object options
   * @param opts.onValid Function To execute when license is valid. Optional; default = noop
   * @param opts.onInvalid Function To execute when license is invalid. Optional; default = noop
   */
  checkValidity() {
    return new Promise((resolve, reject) => {
      this.$timeout(() => {
        if (this.isAvailable) {
          return resolve();
        }

        this.notifyAndRedirect();
        return reject();
      }, 10); // To allow latest XHR call to update license info
    });
  }
}
