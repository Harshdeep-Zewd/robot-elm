import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check, Layers } from 'lucide-react';
import { EngineeringObject } from '../types/elm';

interface SearchableItemSelectProps {
  items: EngineeringObject[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  placeholder?: string;
  excludeId?: number;
  style?: React.CSSProperties;
}

export const SearchableItemSelect: React.FC<SearchableItemSelectProps> = ({
  items,
  selectedId,
  onSelect,
  placeholder = 'Search requirement or test case...',
  excludeId,
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find(i => i.id === selectedId);

  // Filter items based on excludeId and searchQuery
  const filteredItems = items.filter(item => {
    if (excludeId !== undefined && item.id === excludeId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.object_key && item.object_key.toLowerCase().includes(q)) ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.type && item.type.toLowerCase().includes(q)) ||
      (item.tracker_name && item.tracker_name.toLowerCase().includes(q))
    );
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (item: EngineeringObject) => {
    onSelect(item.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery('');
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        ...style
      }}
    >
      {/* Trigger Button / Display */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          backgroundColor: 'var(--bg-dark)',
          border: isOpen ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
          borderRadius: '6px',
          cursor: 'pointer',
          minHeight: '36px',
          gap: '8px',
          transition: 'border-color 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          {selectedItem ? (
            <>
              <span
                className="mono"
                style={{
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}
              >
                [{selectedItem.object_key}]
              </span>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {selectedItem.title}
              </span>
              {selectedItem.type && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    flexShrink: 0
                  }}
                >
                  {selectedItem.type}
                </span>
              )}
            </>
          ) : (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedItem && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={14}
            style={{
              color: 'var(--text-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease'
            }}
          />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            zIndex: 1100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '300px'
          }}
        >
          {/* Search Box Header */}
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-dark)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Search size={14} color="var(--accent-cyan)" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search by ID, title, or type..."
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                padding: '2px 4px'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Items List */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '4px'
            }}
          >
            {filteredItems.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem'
                }}
              >
                No requirements or items match &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                      transition: 'background-color 0.1s ease',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                      <span
                        className="mono"
                        style={{
                          color: 'var(--accent-cyan)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          flexShrink: 0
                        }}
                      >
                        [{item.object_key}]
                      </span>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          color: 'var(--text-muted)',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}
                      >
                        {item.type || 'ITEM'}
                      </span>
                      {isSelected && <Check size={14} color="var(--accent-cyan)" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
