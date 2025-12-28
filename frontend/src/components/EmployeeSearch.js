import React, { useState, useEffect, useRef } from 'react';

const EmployeeSearch = ({ employees, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (employees) {
      const sorted = [...employees].sort((a, b) => a.localeCompare(b));
      if (searchTerm.trim() === '') {
        setFilteredEmployees(sorted);
      } else {
        const filtered = sorted.filter(emp =>
          emp.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEmployees(filtered);
      }
    }
  }, [searchTerm, employees]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    const handleKeyDown = (event) => {
      if (!showDropdown) return;
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredEmployees.length - 1 ? prev + 1 : prev
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (event.key === 'Enter' && highlightedIndex >= 0) {
        event.preventDefault();
        handleEmployeeSelect(filteredEmployees[highlightedIndex]);
      } else if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown, filteredEmployees, highlightedIndex]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (filteredEmployees.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleEmployeeSelect = (employee) => {
    onSelect(employee);
    setSearchTerm(employee);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const highlightMatch = (text) => {
    if (!searchTerm.trim()) return text;
    
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-200 font-semibold px-0.5 rounded">
          {text.substring(index, index + searchTerm.length)}
        </span>
        {text.substring(index + searchTerm.length)}
      </>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder="Type employee name..."
        className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setShowDropdown(true)}
      />
      
      {showDropdown && filteredEmployees.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          <div className="p-1">
            {filteredEmployees.map((employee, index) => (
              <div
                key={index}
                className={`px-2 py-1.5 text-xs cursor-pointer rounded ${
                  highlightedIndex === index ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleEmployeeSelect(employee)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {highlightMatch(employee)}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showDropdown && filteredEmployees.length === 0 && searchTerm.trim() !== '' && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-2 py-3 text-xs text-gray-500 text-center">
            No employees found matching "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSearch;