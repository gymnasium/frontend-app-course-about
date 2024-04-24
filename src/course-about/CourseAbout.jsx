import React, { forwardRef, useState, useEffect, useContext, useRef } from "react";
import { AppContext } from '@edx/frontend-platform/react';
import { Helmet } from 'react-helmet';

import dompurify from 'dompurify';

import axios from "axios";
import TabItemComponent from "./TabItem";

import { ensureConfig, getConfig } from "@edx/frontend-platform";
import { useParams } from "react-router";

ensureConfig(['LEARNING_BASE_URL','LMS_BASE_URL','MARKETING_SITE_BASE_URL','STUDIO_BASE_URL']);

const getSiteName = () => getConfig().SITE_NAME;
const getBaseUrl = () => getConfig().MARKETING_SITE_BASE_URL;
const getLmsBaseUrl = () => getConfig().LMS_BASE_URL;
const getLearningBaseUrl = () => getConfig().LEARNING_BASE_URL;
const getLoginUrl = () => getConfig().LOGIN_URL;
const getStudioBaseUrl = () => getConfig().STUDIO_BASE_URL;
const getCourseData = () => getConfig().GYM_COURSES;
const getBios = () => getConfig().GYM_BIOS;
const getMsg = () => getConfig().GYM_MSG;
const getMeta = () => getConfig().GYM_META;

const CourseAbout = ({ timestamp }) => {
  const params = useParams();
  const [data, setData] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [tabActive, setTabActive] = useState(1);
  const [courseId, setCourseId] = useState();
  const [courseEndDate, setCourseEndDate] = useState();
  const [enrolled, setEnrolled] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");
  const [courseClosed, setCourseClosed ] = useState(false);

  const { authenticatedUser } = useContext(AppContext);

  // Use REGEX to get course id? Seems like there should be a different way of doing this
  useEffect(() => {
    const url = window.location.pathname;
    const regex = /(course-v1:[^/]+)/;
    const match = url.match(regex);
    setCourseId(match[1]);
  }, []);

  // Read Cookie
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // pretty date
  const prettyDate = (str) => {
    let unformatData = new Date(str);
    const options = {
      day: "numeric",
      month: "short",
    };
    return unformatData.toLocaleDateString("en-US", options);
  };

  const today = new Date().toJSON();

  // compare dates
  const datePassed = (d1, d2) => {
    let date1 = new Date(d1).getTime();
    let date2 = new Date(d2).getTime();
  
    if (date1 < date2) {
      return false;
    } else if (date1 >= date2) {
      console.log(`the date has passed.`);
      return true;
    }
  };

  // Tab Navigation Clicks
  const handleTabClick = (id, section_id) => {
    setTabActive(id);
  
    const sectionElement = document.getElementById(section_id);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Enrollment
  const handleEnroll = async () => {

    if (!authenticatedUser) {
      // If not authenticated, redirect to login
      let redirection = `${getLearningBaseUrl()}/learning/course/${courseId}/home`
      window.location.href = `${getLoginUrl()}?next=${encodeURIComponent(redirection)}`;
      return;
    }

    const responseBody = new URLSearchParams({
      'course_id': courseId,
      'enrollment_action': 'enroll'
    });
    
    const csrftoken = getCookie('csrftoken');

    try {
      const response = await fetch(`${getLmsBaseUrl()}/change_enrollment`, {
        method: 'POST',
        headers: {
          'Accept': 'text/plain, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'x-csrftoken': csrftoken
        },
        body: responseBody,
        credentials: 'include'
      });
      if (response.ok) { 
        setEnrolled(true);
      }
      //...do more stuff here?
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {

    if (courseId) {
      const encodedCourseId = encodeURIComponent(courseId);
      fetch(`${getLmsBaseUrl()}/api/enrollment/v1/enrollment/${encodedCourseId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      })
      .then(response => response.text()) // Extract the text from the response
      .then(text => {
        // If the response text is empty, set enrolled to false and return
        if (!text) {
          setEnrolled(false);
          
          // Make another API request to check for enrollment closure or possibility
          fetch(`${getLmsBaseUrl()}/api/course_home/v1/outline/${encodedCourseId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'include'
          })
          .then(res => {

            if (res.redirected) {
              setEnrollMessage("Enrollment Closed");

              return {};
            } else {
              console.log(`res.json(): `, res.json());
              return res.json();
            }
          })
          .then(outlineData => {
            console.log(`response outlineData:`, outlineData);
            // If "can_enroll" is false, set enroll message
            if (outlineData.enroll_alert && !outlineData.enroll_alert.can_enroll) {
              setEnrollMessage("Enrollment Closed");
            }
          });
        }
    
        // Otherwise, parse the text as JSON and continue
        const responseData = JSON.parse(text);

        console.log(`response data: `, responseData);

        if (Object.keys(responseData).length !== 0) { // Check if the object is not empty
          // This checks if the user is enrolled in the course already
          if (responseData.is_active) {
            setEnrolled(true);
          }
        } else {
          setEnrolled(false);
        }
      })
      .catch(error => {
        console.error('Error occurred:', error);
      });
    }
  }, [courseId, data]);

  useEffect(() => {

    if (courseId) {
      const Course = `${getLmsBaseUrl()}/api/courses/v1/courses/${courseId}`;
      const Enrollment = `${getLmsBaseUrl()}/api/enrollment/v1/course/${courseId}`;

      const updateData = async function () {
        const [firstResponse, secondResponse] = await Promise.all([
          axios.get(Course),
          axios.get(Enrollment),
        ]);

        setData(firstResponse.data);
        setCourseDetails(secondResponse.data);
      };
      updateData();
    }
  }, [courseId]);

  // Flag to toggle between LMS data and data sourced from static site JSON
  // TODO: set this in .env files?
  const CUSTOM_OVERVIEW = true;

  const gymCourseId = data?.org + '-' + data?.number;
  const GymCourseData = getCourseData()[gymCourseId];

  const courseStartDate = GymCourseData?.date ? prettyDate(GymCourseData?.date) : prettyDate(data?.start);

  const courseLive = GymCourseData?.live ?? false;
  const retiredMessage = GymCourseData?.retired_message ? {__html: GymCourseData?.retired_message[1]} : null;
  const courseRetired = GymCourseData?.retired_message ? true : false;
  const courseTopic = GymCourseData?.topic ?? null;

  const courseType = data?.number < 100 ? 'Gym Short' : (data?.number >= 700 ? 'Workshop' : 'Full Course');
  const courseTitle = CUSTOM_OVERVIEW ? (GymCourseData?.title ?? 'Course About') : data?.name;
  const metaTitle = `${courseTitle} | ${getSiteName()}`;
  const shortDesc = CUSTOM_OVERVIEW ? (GymCourseData?.description ?? getMeta()?.meta.description) : dompurify.sanitize(data?.short_description);
  const metaImg = GymCourseData?.live ? `${getBaseUrl()}/img/og/courses/gym-${data?.number}.png` : `${getBaseUrl()}/img/og/gym-brand.png`;
  const metaUrl = `${getBaseUrl()}${window.location.pathname}`; 
  const courseImg = CUSTOM_OVERVIEW ? (GymCourseData?.img ? `${getBaseUrl()}${GymCourseData?.img}` : null) : data?.media?.image?.large;
  const courseImgAlt = `Image for ${courseTitle}`;

  const CTA = () => {
    return (
      <div className="course-cta">
        {
          enrollMessage ? (
            <button className="btn" disabled="disabled">
              {enrollMessage}
            </button>
          ) : (
            !enrolled && (
              <button className="btn" onClick={handleEnroll}>
                Get Started
              </button>
            )
          )
        }
        {enrolled && (
          <a className="btn" href={`${getLearningBaseUrl()}/learning/course/${courseId}/home`}>
            Go to Class
          </a>
        )}
      </div>
  )}

  const CourseHeader = () => {
    // TODO: this is a fancy approach that could be simplified by using a custom bg-color class name or similar.
    const figureStyle = {
      borderImageSource: 'url(' + courseImg + ')',
    };

    return (
      <header className="course-header grid-col-1-2 layout-1fr-2fr bg-mono-300 full-bleed">
        {courseImg && (
          <figure style={figureStyle}>
            <img src={courseImg} alt={courseImgAlt} />
          </figure>
        )}
        <div className="course-metabar">
          {courseTitle && (
            <div className="course-title">
              <h1>{courseTitle}</h1>
            </div>
          )}

          <div className="course-type">
            <p>{courseType}</p>
          </div>

          {courseRetired && (
            <div className="course-messaging">
              <p dangerouslySetInnerHTML={retiredMessage}></p>
            </div>
          )}

          <CTA />
        </div>
      </header>
    )
  }

  // forwardRef((props, ref)
  const GymOverview = forwardRef((props, ref) => {

    const instructorSlug = GymCourseData?.instructor ?? null;
    const bio = getBios()[instructorSlug] ?? null;
    const instructorBlurb = {__html: bio?.extended_description ? bio?.extended_description : bio?.description};
    const instructorImg = `${getBaseUrl()}${bio?.img}`;
    const headings = getMsg()?.mfe?.course_about?.headings;
    const intro = { __html: GymCourseData?.intro };
    const about = { __html: GymCourseData?.about };
    const outline = GymCourseData?.outline ??  null;
    const requirements = GymCourseData?.requirements ?? null;
    const prerequisites = GymCourseData?.prerequisites ?? null;
    const audience = GymCourseData?.audience ?? null;
    const video_src = GymCourseData?.preview_video_src ?? null;

    // Outline Items
    const outlineItems = outline?.map((item, index) => {
      const desc = {__html: item?.description};
      return <li key={`item-${index}`}>
        <h3>{item?.label}</h3>
        <p dangerouslySetInnerHTML={desc} />
      </li>
    });

    // Process input, whether a simple string or array
    function renderSectionData(input) {
      if (input) {
        // If the input is a raw HTML string
        if (typeof input === 'string') {
          const desc = {__html: input };
          return <div dangerouslySetInnerHTML={desc} />;

        } else if (typeof input === 'object') {
          // Generate lists only if the array has more than one item
          if (input.length > 1) {
            const listItems = input.map((item, index) => {
              const desc = { __html: item.label };
              return <li key={`item-${index}`} dangerouslySetInnerHTML={desc} />;
            });
            return <ul>{listItems}</ul>;
          } else {
            const desc = { __html: input[0].label };
            return <p dangerouslySetInnerHTML={desc} />;
          }
        }
        
      } else {
        return false;
      }
    }

    function PreviewVideo() {
      return (
        <div className="embed-responsive embed-responsive-16by9 iframe-video-holder ratio-16-9">
          <iframe width="100%" height="425" frameBorder="0" src={video_src} allow="encrypted-media" allowFullScreen title={`${courseTitle} Preview`} />
        </div>
      );
    }

    return (
    <>
      <div className="content">
        {intro && (
          <section className="course-intro">
            <p dangerouslySetInnerHTML={intro}/>
          </section>
        )}

        {video_src && (
          <section className="course-preview">
            <h2>{headings.preview}</h2>
            <PreviewVideo />
          </section>
        )}

        {about && (
          <section className="course-about">
            <h2>{courseTitle}</h2>
            <div dangerouslySetInnerHTML={about} />
          </section>
        )}

        {outlineItems && (
        <section className="course-outline">
          <h2>{headings.outline}</h2>
          <ul>{outlineItems}</ul>
        </section>
        )}

        {prerequisites && (
        <section className="course-prerequisites">
          <h2>{headings.prerequisites}</h2>
          {renderSectionData(prerequisites)}
        </section>
        )}

        {requirements && (
        <section className="course-requirements">
          <h2>{headings.requirements}</h2>
          {renderSectionData(requirements)}
        </section>
        )}
      </div>

      <aside>
        {audience && (
        <section className="course-audience">
          <h2>{headings?.audience}</h2>
          {renderSectionData(audience)}
        </section>
        )}

        {bio && (
        <section className="course-bio">
          <h2>{headings?.instructor}</h2>
          <img src={instructorImg} alt={`Image of ${bio?.name}`} />
          <h3>{bio?.name}</h3>
          <div dangerouslySetInnerHTML={instructorBlurb} />
        </section>
        )}
      </aside>

    </>
    )
  });

  // debug/logging
  useEffect(() => {
    if (data) {
      console.log(`data: `,data);
      // console.log(`lms dates: `, prettyDate(data?.start), prettyDate(data?.end));
    }
  
    if (GymCourseData) {
      console.log(`GymCourseData: `, GymCourseData);
      // console.log(`11ty dates: `, prettyDate(GymCourseData?.date));
    }
  }, [data, GymCourseData]);


  // Default LMS based overview data
  
  const overview = { __html: data?.overview };
  const overviewRef = useRef(null);
  const overviewSections = overviewRef?.current?.querySelectorAll('[id]');
  const overviewSectionsArray = overviewSections && Array.from(overviewSections);

  const CourseOverview = forwardRef((props, ref) => {
    return <div
        {...props} ref={ref}
        id={`course-overview`}
        className={`course-overview`}
        dangerouslySetInnerHTML={overview}
      ></div>
  });

  // Are we using the custom data?
  const Overview = CUSTOM_OVERVIEW ? GymOverview : CourseOverview;


  // These sections are currently unused
  const Unused = () => {
    const pacing = courseDetails?.pacing_type ?? null;
  
    const effort = GymCourseData?.completion_duration ? GymCourseData?.completion_duration : (`${courseDetails?.effort} per week` ?? null);

    return (
      <>

        <footer className="unused hide">
          <hr/>
          <div className="course-short-description" dangerouslySetInnerHTML={ { __html: shortDesc } } />
          {effort && (
            <div className="course-effort">
              <p><strong>Effort</strong>: {effort}</p>
            </div>
          )}
          
          {pacing && (
            <div className="course-pacing">
              <p><strong>Pacing: </strong> {pacing}</p>
            </div>
          )}
          
          {/* Course Pricing */}
          {courseDetails?.course_modes && 
            <div className="course-pricing">
              <p><strong>Pricing: </strong>
              <span>{courseDetails?.course_modes[0]?.min_price === 0 ? (
                'FREE'
              ) : (
                courseDetails?.course_modes[0]?.min_price +
                courseDetails?.course_modes[0]?.currency
              )}
              </span>
              </p>
            </div>
          }

          {/* Course Dates */}
          <div className="course-dates">
            <ul>
              <li><strong>Start Date:</strong> {courseStartDate}</li>
              {courseEndDate && (
                <li><strong>End Date:</strong> {courseEndDate}</li>
              )}
            </ul>
          </div>

          <div className="tabs-nav">
            {overviewSections && overviewSectionsArray.map(({id}, index) => {
              const section_id = id;
              const title = id.replaceAll('course-', '');

              return (
                <TabItemComponent
                  key={title}
                  title={title}
                  onItemClicked={() => handleTabClick(index, section_id)}
                  isActive={tabActive === index}
                />
              )
              })}

            <div className="tabitem">
              {enrollMessage ? (
              <button id="enroll-button" className="tabitem" disabled="true">
                {enrollMessage}
              </button>
              ) : (
              <button onClick={handleEnroll} id="enroll-button" className="tabitem" disabled={enrolled}>
              {enrolled ? 'You are already enrolled' : 'Enroll now'}
              </button>
              )}
            </div>
          </div>

        </footer>
      </>
    );
  }

  return (
    <>
    <Helmet>
      <title>{metaTitle}</title>
      <meta property="og:site_name" content={metaTitle} />
      <meta name="twitter:title" property="og:title" content={courseTitle} />
      <meta name="twitter:image:alt" property="og:image:alt" content={courseTitle} />
      <meta name="description" content={shortDesc} />
      <meta name="twitter:description" property="og:description" content={shortDesc} />
      <meta name="twitter:image" property="og:image" content={metaImg} />
      <meta name="twitter:url" property="og:url" content={metaUrl} />
      <link rel="shortcut icon" href={`${getBaseUrl()}/favicon.svg`} type="image/x-icon" />
      <link rel="stylesheet" href={`${getBaseUrl()}/css/mfe-course-about.css?${timestamp}`} />
    </Helmet>
    <article className="course-about grid-sidebar">
      <CourseHeader />

      <Overview ref={overviewRef} />

      <Unused />
    </article>
    </>
  );
};


export default CourseAbout;