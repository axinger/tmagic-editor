/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Vue from 'vue';

import Core from '@tmagic/core';
import { DataSourceManager } from '@tmagic/data-source';
import { getUrlParam } from '@tmagic/utils';

import components from '../.tmagic/comp-entry';
import datasources from '../.tmagic/datasource-entry';
import plugins from '../.tmagic/plugin-entry';

import request from './utils/request';
import AppComponent from './App.vue';
import { getLocalConfig } from './utils';

import '@tmagic/utils/resetcss.css';

Vue.use(request);

Object.keys(components).forEach((type: string) => {
  Vue.component(`magic-ui-${type}`, components[type]);
});

Object.entries(datasources).forEach(([type, ds]: [string, any]) => {
  DataSourceManager.registe(type, ds);
});

Object.values(plugins).forEach((plugin: any) => {
  Vue.use(plugin);
});

const app = new Core({
  ua: window.navigator.userAgent,
  config: ((getUrlParam('localPreview') ? getLocalConfig() : window.magicDSL) || [])[0] || {},
  curPage: getUrlParam('page'),
});

app.setDesignWidth(app.env.isWeb ? window.document.documentElement.getBoundingClientRect().width : 375);

Vue.prototype.app = app;

const magicApp = new Vue({
  provide: {
    app,
  },

  render: (h) => h(AppComponent),
});

magicApp.$mount('#app');
