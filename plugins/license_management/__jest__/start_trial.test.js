import { StartTrial } from '../public/sections/license_dashboard/start_trial';
import { createMockLicense, getComponent } from './util';

describe('StartTrial component when trial is allowed', () => {
  test('display for basic license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('basic'),
        trialStatus: { canStartTrial: true }
      },
      StartTrial
    );
    expect(rendered.html()).toMatchSnapshot();
  });
  test('should display for gold license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('gold'),
        trialStatus: { canStartTrial: true }
      },
      StartTrial
    );
    expect(rendered.html()).toMatchSnapshot();
  });

  test('should not display for trial license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('trial'),
        trialStatus: { canStartTrial: true }
      },
      StartTrial
    );
    expect(rendered.html()).toBeNull();
  });
  test('should not display for active platinum license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('platinum'),
        trialStatus: { canStartTrial: true }
      },
      StartTrial
    );
    expect(rendered.html()).toBeNull();
  });
  test('should display for expired platinum license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('platinum', 0),
        trialStatus: { canStartTrial: true }
      },
      StartTrial
    );
    expect(rendered.html()).toMatchSnapshot();
  });
});

describe('StartTrial component when trial is not available', () => {
  test('should not display for basic license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('basic'),
        trialStatus: { canStartTrial: false }
      },
      StartTrial
    );
    expect(rendered.html()).toBeNull();
  });
  test('should not display for gold license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('gold'),
        trialStatus: { canStartTrial: false }
      },
      StartTrial
    );
    expect(rendered.html()).toBeNull();
  });
  test('should not display for platinum license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('platinum'),
        trialStatus: { canStartTrial: false }
      },
      StartTrial
    );
    expect(rendered.html()).toBeNull();
  });

  test('should not display for trial license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('gold'),
        trialStatus: { canStartTrial: false }
      },
      StartTrial
    );
    expect(rendered.html()).toBeNull();
  });
});
