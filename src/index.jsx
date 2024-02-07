import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, getConfig,
} from '@edx/frontend-platform';

import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';
import { useParams } from "react-router";

import appMessages from './i18n';
import CourseAbout from './course-about/CourseAbout';

import './index.scss';

// import GymSettings, { GymFooter, GymHeader } from 'gym-frontend-components';
// const timestamp = Date.now();
// const settings = await GymSettings;
// const root = settings.urls.root; // should be same as marketing URL
const config = getConfig();
// const css = `${root}${settings.css.mfe}?${timestamp}`;
const title = `Course About | ${config).SITE_NAME}`;

subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider>
      <Helmet>
        <title>{title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="shortcut icon" href={config.FAVICON_URL} type="image/x-icon" />
        {/* <link rel="stylesheet" href={css} /> */}
      </Helmet>
      {/* <GymHeader secondaryNav="courses" /> */}
      <main>
        <div className="container">
          <CourseAbout />
        </div>
      </main>
      {/* <GymFooter /> */}
    </AppProvider>,
    document.getElementById('root'),
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  ReactDOM.render(<ErrorPage message={error.message} />, document.getElementById('root'));
});

initialize({
  messages: [
    appMessages
  ],
});
