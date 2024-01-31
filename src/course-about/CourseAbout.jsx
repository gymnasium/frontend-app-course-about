import React, { useState, useEffect, useContext } from "react";
import { AppContext } from '@edx/frontend-platform/react';

import dompurify from 'dompurify';

import axios from "axios";
import TabItemComponent from "./TabItem";

import { getConfig } from "@edx/frontend-platform";
import { useParams } from "react-router";

const config = getConfig();

import TabsComponent from "./Tabs";

const tabItems = [
  {
    id: 1,
    title: "Preview",
    section_class: "course-preview",
    section_id: "course-preview",
  },
  {
    id: 2,
    title: "About",
    section_class: "course-about",
    section_id: "course-about",
  },
  {
    id: 3,
    title: "Outline",
    section_class: "course-outline",
    section_id: "course-outline",
  },
  {
    id: 4,
    title: "Prerequisites",
    section_class: "course-prerequisites",
    section_id: "course-prerequisites",
  },
  {
    id: 5,
    title: "Software",
    section_class: "course-software",
    section_id: "course-software",
  },
  {
    id: 6,
    title: "Audience",
    section_class: "course-audience",
    section_id: "course-audience",
  },
  {
    id: 7,
    title: "Instructor",
    section_class: "course-instructor",
    section_id: "course-instructor",
  },
];

const CourseAbout = () => {
  const params = useParams();
  const [data, setData] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [active, setActive] = useState(1);
  const [courseId, setCourseId] = useState();
  const [enrolled, setEnrolled] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");

  // TODO: use .env files for these
  const url = "http://local.overhang.io:8000"
  const mfeLearning = "http://apps.local.overhang.io:2000"
  const appsurl = "http://apps.local.overhang.io:3000"

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
      let redirection = `${config.LEARNING_BASE_URL}/learning/courses/${courseId}/home`
      window.location.href = `${config.LOGIN_URL}?next=${encodeURIComponent(redirection)}`;
      return;
    }

    const body = new URLSearchParams({
      'course_id': courseId,
      'enrollment_action': 'enroll'
    });
    
    const csrftoken = getCookie('csrftoken');

    try {
      const response = await fetch(`${url}/change_enrollment`, {
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
      fetch(`${url}/api/enrollment/v1/enrollment/${encodedCourseId}`, {
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
          fetch(`${url}/api/course_home/v1/outline/${encodedCourseId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'include'
          })
          .then(res => {
            if(res.redirected) {
              setEnrollMessage("You can't enroll");
              return {};
            } else {
              return res.json();
            }
          })
          .then(outlineData => {
            // If "can_enroll" is false, set enroll message
            if (outlineData.enroll_alert && !outlineData.enroll_alert.can_enroll) {
              setEnrollMessage("You can't enroll");
            }
          })
        }
    
        // Otherwise, parse the text as JSON and continue
        const data = JSON.parse(text);
    
        if (Object.keys(data).length !== 0) { // Check if the object is not empty
          if(data.is_active){
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
      const Course =
        getConfig().LMS_BASE_URL + "/api/courses/v1/courses/" + courseId;
  
      const Enrollment =
        getConfig().LMS_BASE_URL + "/api/enrollment/v1/course/" + courseId;
  
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

  const toggleButtons = document.querySelectorAll('.toggle-button');

  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const answer = button.parentElement.nextElementSibling;
      answer.classList.toggle('show-answer');
      button.textContent = answer.classList.contains('show-answer') ? '-' : '+';
    });
  });

  //syllabus

  const sectionButtons = document.querySelectorAll('.section-button');
  const sections = document.querySelectorAll('.section');
  
  sectionButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all sections
      sections.forEach(section => {
        section.classList.remove('active');
      });
      
      // Add active class to corresponding section
      const sectionId = button.dataset.section;
      const section = document.getElementById(sectionId);
      section.classList.add('active');

      // Remove active class from all buttons
      sectionButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      button.classList.add('active');

    });
  });
    

  //customers section

  let currentIndex = 0;
  const cards = document.querySelectorAll(".card");
  const numCards = cards.length;

  let prevbutton = document.getElementById("prev")
  if(prevbutton){
      prevbutton.addEventListener("click", () => {
      cards[currentIndex].style.display = "none";
      currentIndex--;
      if (currentIndex < 0) {
          currentIndex = numCards - 1;
      }
      cards[currentIndex].style.display = "block";
    });
  }

  let nextbutton = document.getElementById("next")
  if(nextbutton){
    nextbutton.addEventListener("click", () => {
      cards[currentIndex].style.display = "none";
      currentIndex++;
      if (currentIndex >= numCards) {
          currentIndex = 0;
      }
      cards[currentIndex].style.display = "block";
    });
  }

  const desc = { __html: dompurify.sanitize(data?.short_description) };

  const overview = { __html: dompurify.sanitize(data?.overview) };

  const allData = data;

  return (
    <div className="course-about">
      <div className="course-intro">
        <div className="course-title">
          <span className="course-id">{data?.org}-{data?.number}</span>
          <h2 className="course-name">{data?.name}</h2>
        </div>
        <div className="description" dangerouslySetInnerHTML={desc} />
      </div>
      <div className="course-info-banner">
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
          {courseDetails?.course_modes[0].min_price == 0 ? (
            <span className="info-tab">
              <div className="text-block">
                <strong className="text-block-header">Free!</strong>
                <br />
                <strong className="text-block-footer">100% free course</strong>
              </div>
            </span>
          ) : (
            courseDetails?.course_modes[0].min_price +
            courseDetails?.course_modes[0].currency
          )}
        </span> */}
        <span className="info-tab">
          <div className="text-block">
            <strong className="text-block-header">Start: {date(data?.start)}</strong>
            <br />
            <strong className="text-block-footer">End: {date(data?.end)}</strong>
          </div>
        </span>
        {
          enrollMessage ? (
            <button className="btn" disabled="true">
              {enrollMessage}
            </button>
          ) : (
            !enrolled && (
              <button className="btn" onClick={handleEnroll}>
                Enroll
              </button>
            )
          )
        }
        {enrolled && (
          <a className="btn" href={`${mfeLearning}/learning/course/${courseId}/home`}>
            View Course
          </a>
        )}
      </div>
      <figure className="course-image-figure">
        <img
          className="course-image"
          src={data?.media.image.large}
          alt={data?.course_name}
        />
      </figure>
      <div className="course-info-banner2">
        <div className="tabs">
          {tabItems.map(({ id, title, section_id }) => (
            <TabItemComponent
                key={title}
                title={title}
                onItemClicked={() => handleTabClick(id, section_id)}
                isActive={active === id}
            />
          ))}
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
      </div>

      <div className="course-preview">
        {tabItems.map(({ id, section_class }) => {
          return active === id ? (
            <div
              key={id}
              className={`about-course-tabs`}
              dangerouslySetInnerHTML={overview}
            ></div>
          ) : (
            ""
          );
        })}
      </div>
    </div>
  );
};

export default CourseAbout;