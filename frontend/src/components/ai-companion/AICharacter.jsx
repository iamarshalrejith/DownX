
import React from "react";
import "./AICharacter.css";

const AICharacter = ({ state = "idle" }) => {
  return (
    <div className={`character-scene character-${state}`}>
      <div className="character-glow" />

      <div className="character">
        <div className="character-antenna">
          <span />
        </div>

        <div className="character-head">
          <div className="character-eye eye-left" />
          <div className="character-eye eye-right" />
          <div className="character-mouth" />
          <div className="character-cheek cheek-left" />
          <div className="character-cheek cheek-right" />
        </div>

        <div className="character-body">
          <div className="character-badge">DX</div>
        </div>

        <div className="character-arm arm-left" />
        <div className="character-arm arm-right" />
        <div className="character-shadow" />
      </div>

      {state === "thinking" && (
        <div className="thinking-bubbles">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
};

export default AICharacter;
