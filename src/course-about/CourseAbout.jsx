import React, { forwardRef, useState, useEffect, useContext, useRef } from "react";
import { AppContext } from '@edx/frontend-platform/react';

import dompurify from 'dompurify';

import axios from "axios";
import TabItemComponent from "./TabItem";

import { getConfig } from "@edx/frontend-platform";
import { useParams } from "react-router";

const ROOT_URL = getConfig().MARKETING_SITE_BASE_URL;
const LMS_BASE_URL = getConfig().LMS_BASE_URL;
const LEARNING_BASE_URL = getConfig().LEARNING_BASE_URL;
const LOGIN_URL = getConfig().LOGIN_URL;
const STUDIO_BASE_URL = getConfig().STUDIO_BASE_URL;

const CourseAbout = ({ GymSettings }) => {
  const params = useParams();
  const [data, setData] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [active, setActive] = useState(1);
  const [courseId, setCourseId] = useState();
  const [enrolled, setEnrolled] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");

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

  let date = (str) => {
    let unformatData = new Date(str);
    const options = {
      day: "numeric",
      month: "short",
    };
    return unformatData.toLocaleDateString("en-US", options);
  };

  // Tab Navigation Clicks
  const handleTabClick = (id, section_id) => {
    setActive(id);
  
    const sectionElement = document.getElementById(section_id);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Enrollment
  const handleEnroll = async () => {

    if (!authenticatedUser) {
      // If not authenticated, redirect to login
      let redirection = `${LEARNING_BASE_URL}/learning/course/${courseId}/home`
      window.location.href = `${LOGIN_URL}?next=${encodeURIComponent(redirection)}`;
      return;
    }

    const responseBody = new URLSearchParams({
      'course_id': courseId,
      'enrollment_action': 'enroll'
    });
    
    const csrftoken = getCookie('csrftoken');

    try {
      const response = await fetch(`${LMS_BASE_URL}/change_enrollment`, {
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
      //...
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (courseId) {
      const encodedCourseId = encodeURIComponent(courseId);
      fetch(`${LMS_BASE_URL}/api/enrollment/v1/enrollment/${encodedCourseId}`, {
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
          fetch(`${LMS_BASE_URL}/api/course_home/v1/outline/${encodedCourseId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'include'
          })
          .then(res => {
            if(res.redirected) {
              setEnrollMessage("Enrollment Closed");
              return {};
            } else {
              return res.json();
            }
          })
          .then(outlineData => {
            // If "can_enroll" is false, set enroll message
            if (outlineData.enroll_alert && !outlineData.enroll_alert.can_enroll) {
              setEnrollMessage("Enrollment Closed");
            }
          })
        }
    
        // Otherwise, parse the text as JSON and continue
        const data = JSON.parse(text);
    
        if (Object.keys(data).length !== 0) { // Check if the object is not empty
          if (data.is_active) {
            setEnrolled(true);
            // setCourseLink(data.course_target);
            // setShowCourseLink(true);
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
      const Course = `${LMS_BASE_URL}/api/courses/v1/courses/${courseId}`;
      const Enrollment = `${LMS_BASE_URL}/api/enrollment/v1/course/${courseId}`;
  
      const update_data = async function () {
        const [firstResponse, secondResponse] = await Promise.all([
          axios.get(Course),
          axios.get(Enrollment),
        ]);
        setData(firstResponse.data);
        setCourseDetails(secondResponse.data);
      };
      update_data();
    }
  }, [courseId]);

  // Flag to toggle between LMS data and data sourced from static site JSON
  const CUSTOM_OVERVIEW = true;

  const gymCourseId = data?.org + '-' + data?.number;
  const GymCourseData = GymSettings?.courses[gymCourseId];

  const courseType = data?.number < 100 ? 'Gym Short' : (data?.number >= 700 ? 'Workshop' : 'Full Course');

  const courseTitle = CUSTOM_OVERVIEW ? (GymCourseData?.title ?? null) : data?.name;

  const courseImg = CUSTOM_OVERVIEW ? (GymCourseData?.img ? GymSettings?.urls.root + GymCourseData?.img : null) : data?.media?.image?.large;

  const courseImgAlt = `Image for ${courseTitle}`;

  const CTA = () => {
    return (
      <div className="course-cta">
        {
          enrollMessage ? (
            <button className="btn" disabled="true">
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
          <a className="btn" href={`${LEARNING_BASE_URL}/learning/course/${courseId}/home`}>
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
      <header className="course-header layout-1fr-2fr bg-mono-300 full-bleed">
        {courseImg && (
          <figure style={figureStyle}>
            <img src={courseImg} alt={courseImgAlt} />
          </figure>
        )}
        <div className="course-title">
          {courseTitle && (
            <h1>{courseTitle}</h1>
          )}
          <p>{courseType}</p>
          <CTA />
        </div>
      </header>
    )
  }

  const GymOverview = () => {

    const courseDate = GymCourseData?.date ?? null;
    const courseLive = GymCourseData?.live ?? false;
    const courseTopic = GymCourseData?.topic ?? null;

    const instructorSlug = GymCourseData?.instructor ?? null;
    const bio = GymSettings?.bios[instructorSlug] ?? null;
    const instructorBlurb = {__html: bio?.extended_description ? bio?.extended_description : bio?.description};
    const instructorImg = `${ROOT_URL}${bio?.img}`;
    const headings = GymSettings?.messages?.mfe?.course_about?.headings;
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
        <p dangerouslySetInnerHTML={desc}/>
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
        <div className="iframe-video-holder ratio-16-9">
          <iframe width="100%" height="425" frameBorder="0" src={video_src} allow="encrypted-media" allowFullScreen title={`${courseTitle} Preview`} />
        </div>
      );
    }

    return (
    <>

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

    </>
  )};

  // debug/logging
  useEffect(() => {
    if (data) {
      console.log(`data: `,data);
    }
  
    if (GymCourseData) {
      console.log(`GymCourseData: `, GymCourseData);
    }
  }, [data, GymCourseData]);


  const short_desc = { __html: dompurify.sanitize(data?.short_description) };
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

  return (
    
    <div className="course-about">
      <CourseHeader />

      <GymOverview />

      <hr />

      <div className="unused hide">
        <div className="description" dangerouslySetInnerHTML={short_desc} />
        <span className="info-tab">
          <div className="text-block">
            <strong className="text-block-header"> Effort</strong>
            <br />
            <strong className="text-block-footer">{data?.effort} per week</strong>
          </div>
        </span>
        <span className="info-tab">
          <div className="text-block">
            <strong className="text-block-header">{courseDetails?.pacing_type}</strong>
            <br />
            {
              courseDetails?.pacing_type === "Instructor Paced" ? 
              <strong className="text-block-footer">Learn together with instructor</strong> 
              : 
              <strong className="text-block-footer">Go at your own speed</strong>
            }
          </div>
        </span>
        {/* Course Pricing */}
        {courseDetails?.course_modes && <span className="course-details">
          {courseDetails?.course_modes[0]?.min_price === 0 ? (
            <span className="info-tab">
              <div className="text-block">
                <strong className="text-block-header">Free!</strong>
                <br />
                <strong className="text-block-footer">100% free course</strong>
              </div>
            </span>
          ) : (
            courseDetails?.course_modes[0]?.min_price +
            courseDetails?.course_modes[0]?.currency
          )}
        </span>}
        {/* Course Dates */}
        <span className="info-tab">
          <div className="text-block">
            <strong className="text-block-header">Start Date: {date(data?.start)}</strong>
            <br />
            <strong className="text-block-footer">End Date: {date(data?.end)}</strong>
          </div>
        </span>
      </div>
      
      <div className="tabs-nav hide">
        {overviewSections && overviewSectionsArray.map(({id}, index) => {
          const section_id = id;
          const title = id.replaceAll('course-', '');

          return (
            <TabItemComponent
              key={title}
              title={title}
              onItemClicked={() => handleTabClick(index, section_id)}
              isActive={active === index}
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
    
      <CourseOverview ref={overviewRef} />

    </div>
  );
};


export default CourseAbout;