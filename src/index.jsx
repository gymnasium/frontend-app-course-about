import React from "react";
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR,
  APP_READY,
  initialize,
  subscribe,
} from '@edx/frontend-platform';

import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import appMessages from './i18n';

import { GymFooter, GymHeader } from '@edx/gym-frontend';

import App from './App';

import './index.scss';

subscribe(APP_READY, () => {
  ReactDOM.render(
    <BrowserRouter basename="/courses">
      <GymHeader secondaryNav="courses" />
      <main>
        <div className="container">
          <Routes>
            <Route path="*" element={<App />} />
          </Routes>
        </div>
      </main>
      <GymFooter />
    </BrowserRouter>,
    document.getElementById('root'),
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  ReactDOM.render(
    <AppProvider>
      <GymHeader secondaryNav="courses" />
      <main>
        <div className="container">
          {/* TODO: add routes? */}
          <ErrorPage message={error.message} />
        </div>
      </main>
      <GymFooter />
    </AppProvider>,
    document.getElementById('root')
  );
});

initialize({
  messages: [
    appMessages
  ],
});
