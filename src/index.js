/**!
 * Katnip Editor (extension)
 * @fileoverview Katnip Editor in extension form
 * @author Miyo Sho <https://github.com/yuri-kiss/>
 * @license MPL-2.0-only
 * Copyright (C) 2025 Miyo sho
 * https://github.com/yuri-kiss/
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 */
(function(Scratch, ReduxStore) {
  alert(`"Katnip" extension is a W.I.P and may break at any time!`);
  if (!Scratch.extensions.unsandboxed) {
    throw new Error(`"Katnip" must be ran unsandboxed!`);
  }
  const vm = Scratch.vm, runtime = vm.runtime;
  const extId = '0znzwKatnipTWMixin';
  class Katnip {
    /**
     * @param {?WebSocket} socket Katnip Websocket
     */
    constructor(socket) {
      /** @type {WebSocket} */
      this._ws = socket ?? new WebSocket('ws://localhost:57120');
      /** @type {[Function, Function][]>} */
      this._replyQue = [];
      this.ready = false;
      this.failed = false;
      this.closed = false;
      this._ws.onerror = (error) => {
        this.ready = false;
        this.failed = true;
        this.closed = true;
        console.error('Failed to connect to Katnip Server', this._ws.url, error);
      };
      this._ws.onopen = () => {
        this.ready = true;
        this.closed = false;
        console.log('Connected to Katnip Server', this._ws.url);
      };
      this._ws.onclose = () => {
        this.ready = false;
        this.closed = true;
        this._replyQue.forEach(r => r[1]())
        console.warn('Connection to Katnip Server was closed', this._ws.url);
      };
      this._ws.onmessage = (message) => this.onMessage(message);
    }
    /**
     * @param {object | string}
     */
    _sendWithReply(message) {
      return new Promise((resolve, reject) => {
        this._replyQue.push([resolve, reject]);
        this._ws.send(typeof message === 'object' ? JSON.stringify(message) : message);
      });
    }
    /**
     * @param {MessageEvent} param0 
     */
    onMessage({ data }) {
      try {
        data = JSON.parse(data);
      } catch(error) {
        console.error('Recieved invalid JSON from server', data, error);
        return;
      }
      if (this._replyQue[0]) {
        this._replyQue.shift()[0](data);
      }
    }
  }
  class extension {
    constructor() {
      this.katnip = new Katnip();
    }
    getInfo() {
      return {
        id: extId,
        blocks: [],
      }
    }
  }
  runtime[`ext_${extId}`] = new extension();
})(Scratch, globalThis.ReduxStore);