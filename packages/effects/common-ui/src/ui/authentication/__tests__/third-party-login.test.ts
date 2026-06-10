import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import ThirdPartyLogin from '../third-party-login.vue';

describe('third-party-login.vue', () => {
  it('renders only enabled providers', () => {
    const wrapper = mount(ThirdPartyLogin, {
      props: {
        providers: [
          { code: 'github', enabled: true },
          { code: 'google', enabled: false },
        ],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(1);
    expect(wrapper.text()).toContain('authentication.thirdPartyLogin');
  });

  it('emits login when provider is clicked', async () => {
    const wrapper = mount(ThirdPartyLogin, {
      props: {
        providers: [{ code: 'github', enabled: true }],
      },
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('login')?.[0]?.[0]).toMatchObject({
      code: 'github',
    });
  });
});
