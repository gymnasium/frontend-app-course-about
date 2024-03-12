import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR,
  APP_READY,
  getConfig,
  initialize,
  subscribe,
} from '@edx/frontend-platform';

import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Redirect,
  Route,
  useParams
} from "react-router-dom";
import { Helmet } from 'react-helmet';

import appMessages from './i18n';

import GymSettings, { GymFooter, GymHeader } from '@edx/gym-frontend';

import CourseAbout from './course-about/CourseAbout';

import './index.scss';

subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider>
      <GymHeader secondaryNav="courses" />
      <main>
        <div className="container">
          {/* TODO: add routes */}
          <CourseAbout GymSettings={GymSettings} />
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
