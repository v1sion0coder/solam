// Server code shared by Windows and the phone: Premium, comments, shared playlists, stats, news and support.
(function setup(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SolamSocial = factory();
})(typeof self !== 'undefined' ? self : this, () => {
  const FREE = { active: false, until: null, status: null, provider: null };
  const DEFAULT_SETTINGS = { checkoutUrl: null, manageUrl: null, price: '$3.99', bankOn: false, discordId: DISCORD_APP_ID };
  const COMMENT_FIELDS = 'id,track_key,user_id,author,body,created_at';
  const PLAYLIST_FIELDS = 'id,owner,name,tracks,updated_at,shared_playlist_members(user_id)';
  const DISCORD_APP_ID = '1567638503913816176';
  const CHECKOUT_LINK = /^https:\/\/[a-z0-9-]+\.lemonsqueezy\.com\//;
  const uuid = (value) => {
    const text = String(value);
    if (!/^[0-9a-f-]{36}$/i.test(text)) throw new Error('Bad id');
    return text;
  };

  function createSocial({ raw, json, validToken, requireToken, userId, list }) {
    const optionalToken = () => validToken().catch(() => null);
    const toPlaylist = (row) => ({ id: row.id, shared: true, isOwner: row.owner === userId(), name: row.name, tracks: row.tracks || [], members: row.shared_playlist_members?.length || 1 });

    return {
      // Older servers don't have these tables yet, so they simply report that Premium isn't on sale.
      async appSettings() {
        // A server that hasn't been updated yet has no Discord column, and its other settings still count.
        const settings = 'premium_checkout_url,premium_manage_url,premium_price,bank_enabled';
        const rows = await raw(`/rest/v1/app_settings?id=eq.1&select=${settings},discord_app_id`).catch(() => raw(`/rest/v1/app_settings?id=eq.1&select=${settings}`)).catch(() => null);
        if (!rows?.[0]) return { ...DEFAULT_SETTINGS };
        const checkoutUrl = CHECKOUT_LINK.test(rows[0].premium_checkout_url || '') ? rows[0].premium_checkout_url : null;
        const manageUrl = CHECKOUT_LINK.test(rows[0].premium_manage_url || '') ? rows[0].premium_manage_url : null;
        return { checkoutUrl, manageUrl, price: rows[0].premium_price || DEFAULT_SETTINGS.price, bankOn: rows[0].bank_enabled === true, discordId: rows[0].discord_app_id || DISCORD_APP_ID };
      },
      saveDiscordId: async (id) => json('/rest/v1/app_settings?id=eq.1', 'PATCH', { discord_app_id: String(id || '').trim() || null }, {}, await requireToken()),
      async askAi(messages, context) {
        const token = await validToken().catch(() => null);
        if (!token) throw new Error('not-signed-in');
        try {
          return await json('/functions/v1/solam-ai', 'POST', { messages, context }, {}, token);
        } catch (error) {
          if (error.status === 429) throw new Error('ai-limit');
          if (error.status === 401) throw new Error('not-signed-in');
          if (error.status === 404) throw new Error('ai-not-ready');
          throw new Error(/^ai-/.test(error.message) ? error.message : 'ai-failed');
        }
      },
      async saveAppSettings({ checkoutUrl, manageUrl, price }) {
        await json('/rest/v1/app_settings?id=eq.1', 'PATCH', { premium_checkout_url: checkoutUrl || null, premium_manage_url: manageUrl || null, premium_price: String(price || DEFAULT_SETTINGS.price).slice(0, 20) }, {}, await requireToken());
      },
      async premiumState() {
        const token = await optionalToken();
        if (!token) return { ...FREE };
        const rows = await raw(`/rest/v1/premium_members?user_id=eq.${userId()}&select=active_until,status,provider`, { token }).catch(() => null);
        const row = rows?.[0];
        if (!row) return { ...FREE };
        return { active: new Date(row.active_until).getTime() > Date.now(), until: row.active_until, status: row.status, provider: row.provider };
      },
      async paymentDetails() {
        const rows = await raw('/rest/v1/payment_details?id=eq.1&select=iban,account_name,amount', { token: await requireToken() });
        return rows?.[0] || null;
      },
      async saveBankDetails({ iban, accountName, amount, enabled }) {
        const token = await requireToken();
        const clean = String(iban || '').replace(/\s+/g, '').toUpperCase();
        const sum = Number(String(amount).replace(',', '.'));
        if (enabled && (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(clean) || !String(accountName || '').trim() || !(sum > 0))) throw new Error('bank-details-incomplete');
        await json('/rest/v1/payment_details?id=eq.1', 'PATCH', { iban: clean || null, account_name: String(accountName || '').trim().slice(0, 70) || null, amount: sum > 0 ? sum : 3.99 }, {}, token);
        await json('/rest/v1/app_settings?id=eq.1', 'PATCH', { bank_enabled: enabled === true, premium_price: sum > 0 ? `€${sum.toFixed(2)}` : DEFAULT_SETTINGS.price }, {}, token);
      },
      async myPremiumRequest() {
        const token = await optionalToken();
        if (!token) return null;
        const rows = await raw(`/rest/v1/premium_requests?user_id=eq.${userId()}&status=eq.pending&select=id,code,paid_at&order=created_at.desc&limit=1`, { token }).catch(() => null);
        return rows?.[0] || null;
      },
      async startPremiumRequest() {
        const rows = await json('/rest/v1/premium_requests', 'POST', {}, { Prefer: 'return=representation' }, await requireToken());
        return rows?.[0] || null;
      },
      markPremiumPaid: async (id) => json('/rest/v1/rpc/mark_premium_paid', 'POST', { request: uuid(id) }, {}, await requireToken()),
      premiumRequests: async () => json('/rest/v1/rpc/list_premium_requests', 'POST', {}, {}, await requireToken()),
      decidePremiumRequest: async (id, approve, days) => json('/rest/v1/rpc/decide_premium_request', 'POST', { request: uuid(id), approve: approve === true, days: Number(days) }, {}, await requireToken()),
      grantPremium: async (email, days) => json('/rest/v1/rpc/grant_premium', 'POST', { target_email: String(email), days: Number(days) }, {}, await requireToken()),

      newTracks: () => list('status=eq.approved&order=created_at.desc&limit=12'),
      async trackById(id) {
        return (await list(`status=eq.approved&id=eq.${uuid(id)}`))[0] || null;
      },
      async followedNew(artistIds, since) {
        const ids = artistIds.map(uuid);
        if (!ids.length) return [];
        return list(`status=eq.approved&user_id=in.(${ids.join(',')})&created_at=gt.${encodeURIComponent(new Date(since).toISOString())}&order=created_at.desc&limit=20`);
      },
      async uploadResults(since) {
        const token = await requireToken();
        return list(`user_id=eq.${userId()}&status=neq.pending&reviewed_at=gt.${encodeURIComponent(new Date(since).toISOString())}&order=reviewed_at.desc&limit=20`, token);
      },
      async artistStats(id) {
        const rows = await json('/rest/v1/rpc/artist_stats', 'POST', { artist: uuid(id) });
        return rows?.[0] || null;
      },
      async setFollow(id, following) {
        const token = await requireToken();
        if (following) await json('/rest/v1/artist_follows', 'POST', { artist_id: uuid(id) }, { Prefer: 'resolution=ignore-duplicates' }, token);
        else await raw(`/rest/v1/artist_follows?artist_id=eq.${uuid(id)}&user_id=eq.${userId()}`, { method: 'DELETE', token });
      },

      comments: (key) => raw(`/rest/v1/comments?track_key=eq.${encodeURIComponent(String(key))}&select=${COMMENT_FIELDS}&order=created_at.desc&limit=100`),
      async addComment(key, author, body) {
        const text = String(body || '').trim();
        if (!text) throw new Error('comment-empty');
        const rows = await json('/rest/v1/comments', 'POST', { track_key: String(key).slice(0, 300), author: String(author || 'Listener').trim().slice(0, 40), body: text.slice(0, 500) }, { Prefer: 'return=representation' }, await requireToken());
        return rows?.[0] || null;
      },
      deleteComment: async (id) => raw(`/rest/v1/comments?id=eq.${uuid(id)}`, { method: 'DELETE', token: await requireToken() }),

      async sendSupport({ contact, body, version }) {
        const text = String(body || '').trim();
        if (text.length < 5) throw new Error('message-too-short');
        const token = await optionalToken();
        await json('/rest/v1/support_messages', 'POST', { contact: String(contact || '').trim().slice(0, 200) || null, body: text.slice(0, 2000), app_version: String(version || '').slice(0, 40) }, {}, token || undefined);
      },
      supportMessages: async () => raw('/rest/v1/support_messages?select=id,contact,body,app_version,created_at&order=created_at.asc&limit=100', { token: await requireToken() }),
      clearSupport: async (id) => raw(`/rest/v1/support_messages?id=eq.${uuid(id)}`, { method: 'DELETE', token: await requireToken() }),

      news: () => raw('/rest/v1/news?select=id,title,body,created_at&order=created_at.desc&limit=20'),
      postNews: async (title, body) => json('/rest/v1/news', 'POST', { title: String(title).trim().slice(0, 120), body: String(body || '').trim().slice(0, 1000) }, {}, await requireToken()),
      removeNews: async (id) => raw(`/rest/v1/news?id=eq.${uuid(id)}`, { method: 'DELETE', token: await requireToken() }),

      async sharedPlaylists() {
        const token = await optionalToken();
        if (!token) return [];
        const rows = await raw(`/rest/v1/shared_playlists?select=${PLAYLIST_FIELDS}&order=updated_at.desc&limit=100`, { token }).catch(() => []);
        return (rows || []).map(toPlaylist);
      },
      async shareNewPlaylist(name, tracks) {
        const rows = await json('/rest/v1/shared_playlists', 'POST', { name: String(name).slice(0, 60), tracks: [] }, { Prefer: 'return=representation' }, await requireToken());
        const created = rows?.[0];
        if (!created) throw new Error('Something went wrong');
        const token = await requireToken();
        for (const track of tracks.slice(0, 500)) await json('/rest/v1/rpc/playlist_add', 'POST', { playlist: created.id, track }, {}, token);
        return created.id;
      },
      joinPlaylist: async (id) => json('/rest/v1/rpc/join_playlist', 'POST', { playlist: uuid(id) }, {}, await requireToken()),
      playlistAdd: async (id, track) => json('/rest/v1/rpc/playlist_add', 'POST', { playlist: uuid(id), track }, {}, await requireToken()),
      playlistRemove: async (id, key) => json('/rest/v1/rpc/playlist_remove', 'POST', { playlist: uuid(id), track_key: String(key) }, {}, await requireToken()),
      leavePlaylist: async (id) => raw(`/rest/v1/shared_playlist_members?playlist_id=eq.${uuid(id)}&user_id=eq.${userId()}`, { method: 'DELETE', token: await requireToken() }),
      deleteSharedPlaylist: async (id) => raw(`/rest/v1/shared_playlists?id=eq.${uuid(id)}`, { method: 'DELETE', token: await requireToken() }),
    };
  }

  return { createSocial };
});
