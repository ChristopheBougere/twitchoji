import React from 'react';
import ReactDOM from 'react-dom';

import './styles.css';

import { ENTRY_POINT_VIEWER, ENTRY_POINT_CONFIG, ENTRY_POINT_LIVE_CONFIG } from './constants/entry-points';

import Viewer from './containers/Viewer';
import Config from './containers/Config';
import LiveConfig from './containers/LiveConfig';

/** @namespace window.entryPoint */
if (window.entryPoint === ENTRY_POINT_VIEWER) {
  ReactDOM.render(<Viewer />, document.getElementById('root'));
} else if (window.entryPoint === ENTRY_POINT_CONFIG) {
  ReactDOM.render(<Config />, document.getElementById('root'));
} else if (window.entryPoint === ENTRY_POINT_LIVE_CONFIG) {
  ReactDOM.render(<LiveConfig />, document.getElementById('root'));
}
