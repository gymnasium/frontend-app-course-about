import { Button } from "@edx/paragon";
import React, { useState } from "react";
import TabItemComponent from "./TabItem";

const tabItems = [
  {
    id: 1,
    title: "Preview",
    section_class: "course-preview",
  },
  {
    id: 2,
    title: "About",
    section_class: "course-about",
  },
  {
    id: 3,
    title: "Outline",
    section_class: "course-outline",
  },
  {
    id: 4,
    title: "Prerequisites",
    section_class: "course-prerequisites",
  },
  {
    id: 5,
    title: "Software",
    section_class: "course-software",
  },
  {
    id: 6,
    title: "Audience",
    section_class: "course-audience",
  },
  {
    id: 7,
    title: "Instructor",
    section_class: "course-instructor",
  },
];

const TabsComponent = () => {
  const [active, setActive] = useState(0);

  return (
    <>
      <div className="tabs">
        {tabItems.map(({ id, icon, title }) => (
          <TabItemComponent
            key={title}
            icon={icon}
            title={title}
            onItemClicked={() => setActive(id)}
            isActive={active === id}
          />
        ))}
      </div>
      <div className="content">
        {tabItems.map(({ id, content }) => {
          return active === id ? content : "";
        })}
      </div>
    </>
  );
};

export default TabsComponent;