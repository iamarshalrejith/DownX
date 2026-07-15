/**
 * visualPinDisplay.js
 *
 * The four visual-PIN values are unchanged from the original system —
 * still the same strings stored in Student.visualPin and compared
 * server-side. This file only maps each stored value to how it's
 * displayed: a react-icons icon inside a colored ring badge, instead
 * of the emoji glyph itself. Shared by StudentLoginPage.jsx and
 * StudentManagementPage.jsx so both stay in sync.
 */

import { FiStar, FiZap, FiDroplet, FiFeather } from "react-icons/fi";

export const VISUAL_PIN_VALUES = ["🌟", "🔥", "💧", "🍀"];

export const VISUAL_PIN_DISPLAY = {
  "🌟": {
    label: "Star",
    Icon: FiStar,
    ring: "ring-brand",
    icon: "text-brand",
    bg: "bg-brand-light",
  },
  "🔥": {
    label: "Flash",
    Icon: FiZap,
    ring: "ring-accent",
    icon: "text-accent-dark",
    bg: "bg-accent-light",
  },
  "💧": {
    label: "Drop",
    Icon: FiDroplet,
    ring: "ring-success",
    icon: "text-success",
    bg: "bg-success-light",
  },
  "🍀": {
    label: "Leaf",
    Icon: FiFeather,
    ring: "ring-warn",
    icon: "text-warn",
    bg: "bg-warn-light",
  },
};