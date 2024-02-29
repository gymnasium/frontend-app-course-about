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

const CourseAbout = () => {
  const params = useParams();
  const [data, setData] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [active, setActive] = useState(1);
  const [courseId, setCourseId] = useState();
  const [enrolled, setEnrolled] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");

  const { authenticatedUser } = useContext(AppContext);

  useEffect(() => {
    const url = window.location.pathname;
    const regex = /courses\/(course-v1:[^/]+)\/about/;
    const match = url.match(regex);
    setCourseId(match[1]);
  }, []);

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

  // Tab Navigation Clicks
  const handleTabClick = (id, section_id) => {
    setActive(id);
  
    const sectionElement = document.getElementById(section_id);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const handleEnroll = async () => {

    if (!authenticatedUser) {
      // If not authenticated, redirect to login
      let redirection = `${LEARNING_BASE_URL}/learning/courses/${courseId}/home`
      window.location.href = `${LOGIN_URL}?next=${encodeURIComponent(redirection)}`;
      return;
    }

    const body = new URLSearchParams({
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
        body: body,
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

  let date = (str) => {
    let unformatData = new Date(str);
    const options = {
      day: "numeric",
      month: "short",
    };
    return unformatData.toLocaleDateString("en-US", options);
  };

  // debug/logging
  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  
  ///static/daveporter.jpg
  // http://local.edly.io:8000/asset-v1:GYM+102+0+type@asset+block@daveporter.jpg

  const instructor_img = data?.short_description;
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
      <header id="course-header" className="course-header layout-1fr-2fr bg-mono-300 full-bleed">
        <figure className="course-image-figure">
          <img
            className="course-image"
            src={data?.media.image.large}
            alt={data?.course_name}
          />
        </figure>
        <div className="course-title">
        <span className="course-id hide">{data?.org}-{data?.number}</span>
          <h1 className="course-name">{data?.name}</h1>
          <p>{ data?.number < 100 ? 'Gym Short' : 'Full Course'  }</p>
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
        </div>
        
      </header>
      

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
        {/* <span className="course-details">
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
        </span> */}
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