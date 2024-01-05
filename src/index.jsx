import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, getConfig,
} from '@edx/frontend-platform';

import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';
import { useParams } from "react-router";

// import { GymHeader as Header, messages as headerMessages } from '../frontend-component-header/src';
import { GymHeader as Header, messages as headerMessages } from '@edx/frontend-component-header';
import Footer, { messages as footerMessages } from '@edx/frontend-component-footer';

import appMessages from './i18n';
import CourseAbout from './course-about/CourseAbout';

import './index.scss';

var current = Date.now();
const config = getConfig();
const settings = `${config.MARKETING_SITE_BASE_URL}/feeds/config.json`;
const css = `${config.MARKETING_SITE_BASE_URL}/css/mfe.css?${current}`;
const title = `Course About | ${getConfig().SITE_NAME}`;

subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider>
      <Helmet>
        <title>{title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="shortcut icon" href={getConfig().FAVICON_URL} type="image/x-icon" />
        <link rel="stylesheet" href={css} />
      </Helmet>
      <Header secondaryNav="courses" />
      <CourseAbout />
      <Footer />
    </AppProvider>,
    document.getElementById('root'),
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  ReactDOM.render(<ErrorPage message={error.message} />, document.getElementById('root'));
});

initialize({
  messages: [
    appMessages,
    headerMessages,
    footerMessages,
  ],
});
