import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR,
  APP_READY,
  ensureConfig,
  getConfig,
  initialize,
  subscribe,
} from '@edx/frontend-platform';

ensureConfig(['MARKETING_SITE_BASE_URL']);

import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom';
import {
  Route,
  Routes
} from "react-router-dom";

import appMessages from './i18n';

import { GymFooter, GymHeader } from '@edx/gym-frontend';

import CourseAbout from './course-about/CourseAbout';

import './index.scss';

subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider>
      <GymHeader secondaryNav="courses" />
      <main>
        <div className="container">
          {/* TODO: better routes */}
          <Routes>
            <Route path="*" element={<CourseAbout />} />
          </Routes>
        </div>
      </main>
      <GymFooter />
    </AppProvider>,
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
