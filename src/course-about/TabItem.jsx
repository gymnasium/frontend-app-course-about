import React from "react";

const TabItemComponent = ({
  title = "",
  onItemClicked = () => console.error("You passed no action to the component"),
  isActive = false,
}) => {
  return (
    <button
      className={isActive ? "tabitem" : "tabitem tabitem--inactive"}
      onClick={onItemClicked}
    >
      {title}
    </button>
  );
};

export default TabItemComponent;