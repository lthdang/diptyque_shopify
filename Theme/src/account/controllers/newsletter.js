/**
 * controllers/newsletter.js — Newsletter controller
 */

'use strict';

export class DiptyqueNewsletterController {
  /**
   * @param {import('../api/newsletter').DiptyqueNewsletterApi} api
   * @param {import('../ui/newsletter').DiptyqueNewsletterRenderer} renderer
   */
  constructor(api, renderer) {
    this._api = api;
    this._renderer = renderer;
    this._token = null;

    this._renderer.on('newsletter:submit', (payload) => this._onSubmit(payload));
  }

  async load(accessToken) {
    this._token = accessToken;
    this._renderer.renderLoading();

    try {
      const prefs = await this._api.fetchPreferences(accessToken);
      this._renderer.render(prefs);
    } catch (err) {
      console.error('[NewsletterController] Failed to load preferences', err);
      this._renderer.render({});
      this._renderer.showError('保存状況を読み込めませんでした。');
    }
  }

  async _onSubmit(payload) {
    this._renderer.setSubmitState(true);

    try {
      await this._api.updatePreferences(payload);
      this._renderer.showSuccess('ご登録ありがとうございます。');
    } catch (err) {
      console.error('[NewsletterController] Update failed', err);
      this._renderer.showError('保存に失敗しました。もう一度お試しください。');
    } finally {
      this._renderer.setSubmitState(false);
    }
  }
}
