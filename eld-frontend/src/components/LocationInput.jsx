import { useState, useRef } from "react";
import { searchLocations } from "../services/locationSearch";

export default function LocationInput({value,placeholder,onSelect}) {

const [suggestions, setSuggestions] = useState([]);
const [isFocused, setIsFocused] = useState(false);
const timeoutRef = useRef(null);

const handleChange = (e) => {

  const value = e.target.value;

  onSelect(value);

  clearTimeout(timeoutRef.current);

  if (value.length < 3) {

    setSuggestions([]);

    return;
  }

  timeoutRef.current = setTimeout(
    async () => {

      try {

        const results =
          await searchLocations(value);

        setSuggestions(results);

      } catch {

        setSuggestions([]);

      }

    },
    500
  );
};


return (
  <div className="autocomplete-container">

    <input
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() =>
        setTimeout(() => {
          setIsFocused(false);
          setSuggestions([]);
        }, 150)
      }
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setSuggestions([]);
          setIsFocused(false);
        }
      }}
    />

    {isFocused &&
      suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onClick={() => {
                onSelect(item.display_name);
                setSuggestions([]);
                setIsFocused(false);
              }}
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}

  </div>
);
}