"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Loader2, Save, RotateCcw, ChevronDown } from "lucide-react";
import { Select } from "@/components/ui/Select";
import toast from "react-hot-toast";
import styles from "./ThemeManagement.module.css";

interface ThemeSettings {
  id?: string;
  primaryPurple?: string | null;
  primaryIndigo?: string | null;
  primaryDark?: string | null;
  primaryDeep?: string | null;
  accentCyan?: string | null;
  accentTeal?: string | null;
  starGold?: string | null;
  starGoldDark?: string | null;
  crystalPurple?: string | null;
  crystalBright?: string | null;
  bgDark?: string | null;
  bgDarkSecondary?: string | null;
  bgDarkHover?: string | null;
  textPrimary?: string | null;
  textSecondary?: string | null;
  statusSuccess?: string | null;
  statusWarning?: string | null;
  statusError?: string | null;
  galaxyBackgroundEnabled?: boolean | null;
  plainBackgroundColor?: string | null;
  gradientColor1?: string | null;
  gradientColor2?: string | null;
  gradientColor3?: string | null;
}

// Default values from globals.css
const DEFAULT_THEME: Record<string, string> = {
  primaryPurple: "#8b5cf6",
  primaryIndigo: "#6366f1",
  primaryDark: "#4c1d95",
  primaryDeep: "#5b21b6",
  accentCyan: "#06b6d4",
  accentTeal: "#0ea5e9",
  starGold: "#fbbf24",
  starGoldDark: "#f59e0b",
  crystalPurple: "#a78bfa",
  crystalBright: "#c084fc",
  bgDark: "#0f172a",
  bgDarkSecondary: "#1e1b4b",
  bgDarkHover: "rgba(0, 0, 0, 0.3)",
  textPrimary: "#ffffff",
  textSecondary: "#cbd5e1",
  statusSuccess: "#10b981",
  statusWarning: "#f59e0b",
  statusError: "#ef4444",
};

// Color groups - clicking a group shows multiple related color pickers
const COLOR_GROUPS = [
  {
    key: "button",
    label: "Button",
    colors: [
      { key: "primaryPurple", label: "Primary", cssVar: "--color-primary-purple" },
      { key: "primaryIndigo", label: "Indigo", cssVar: "--color-primary-indigo" },
      { key: "primaryDark", label: "Dark", cssVar: "--color-primary-dark" },
      { key: "primaryDeep", label: "Deep", cssVar: "--color-primary-deep" },
    ],
  },
  {
    key: "text",
    label: "Text",
    colors: [
      { key: "textPrimary", label: "Primary", cssVar: "--color-text-primary" },
      { key: "textSecondary", label: "Secondary", cssVar: "--color-text-secondary" },
    ],
  },
  {
    key: "accent",
    label: "Accent",
    colors: [
      { key: "accentCyan", label: "Cyan", cssVar: "--color-accent-cyan" },
      { key: "accentTeal", label: "Teal", cssVar: "--color-accent-teal" },
    ],
  },
  {
    key: "gold",
    label: "Gold",
    colors: [
      { key: "starGold", label: "Gold", cssVar: "--color-star-gold" },
      { key: "starGoldDark", label: "Dark", cssVar: "--color-star-gold-dark" },
    ],
  },
  {
    key: "status",
    label: "Status",
    colors: [
      { key: "statusSuccess", label: "Success", cssVar: "--color-status-success" },
      { key: "statusWarning", label: "Warning", cssVar: "--color-status-warning" },
      { key: "statusError", label: "Error", cssVar: "--color-status-error" },
    ],
  },
  {
    key: "container",
    label: "Container",
    colors: [
      { key: "bgDark", label: "Dark", cssVar: "--color-bg-dark" },
      { key: "bgDarkSecondary", label: "Secondary", cssVar: "--color-bg-dark-secondary" },
      { key: "bgDarkHover", label: "Hover", cssVar: "--color-bg-dark-hover" },
    ],
  },
];

// Background type options
const BACKGROUND_TYPES = [
  { value: "plain", label: "Plain" },
  { value: "galaxy", label: "Galaxy" },
  { value: "gradient", label: "Moving Gradient" },
];

export const ThemeManagement: React.FC = () => {
  const [settings, setSettings] = useState<ThemeSettings | null>(null);
  const [localTheme, setLocalTheme] = useState<Record<string, string>>({});
  const [previewTheme, setPreviewTheme] = useState<Record<string, string>>({});
  const [galaxyEnabled, setGalaxyEnabled] = useState<boolean>(true);
  const [plainBgColor, setPlainBgColor] = useState<string>("#000000");
  const [gradientColor1, setGradientColor1] = useState<string>("#0f172a");
  const [gradientColor2, setGradientColor2] = useState<string>("#1e1b4b");
  const [gradientColor3, setGradientColor3] = useState<string>("#4c1d95");
  const [backgroundType, setBackgroundType] = useState<string>("galaxy");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const colorPickerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const buttonPositions = useRef<Record<string, { top: number; left: number }>>({});

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openColorPicker) {
        const buttonRef = colorPickerRefs.current[openColorPicker];
        const dropdownRef = dropdownRefs.current[openColorPicker];
        const target = event.target as Node;
        
        // Check if click is outside both the button container and the dropdown
        const isClickOnButton = buttonRef && buttonRef.contains(target);
        const isClickOnDropdown = dropdownRef && dropdownRef.contains(target);
        
        if (!isClickOnButton && !isClickOnDropdown) {
          setOpenColorPicker(null);
          delete buttonPositions.current[openColorPicker];
        }
      }
    };

    if (openColorPicker) {
      // Use a small delay to prevent immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 200);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openColorPicker]);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  useEffect(() => {
    // Apply theme changes directly to document root so the actual page updates in real-time
    const root = document.documentElement;
    COLOR_GROUPS.forEach((group) => {
      group.colors.forEach((color) => {
        const value = previewTheme[color.key] || localTheme[color.key] || DEFAULT_THEME[color.key];
        if (value) {
          // Set CSS variable on document root - this updates the actual page
          root.style.setProperty(color.cssVar, value);
        }
      });
    });
  }, [previewTheme, localTheme]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/theme");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        // Initialize local theme with current settings or defaults
        const initialTheme: Record<string, string> = {};
        Object.keys(DEFAULT_THEME).forEach((key) => {
          initialTheme[key] = data.data[key] || DEFAULT_THEME[key];
        });
        setLocalTheme(initialTheme);
        setPreviewTheme(initialTheme);
        // Initialize background settings
        const galaxyEnabled = data.data.galaxyBackgroundEnabled !== false;
        setGalaxyEnabled(galaxyEnabled);
        // Use saved plain background color or default to black
        const savedPlainBgColor = data.data.plainBackgroundColor || "#000000";
        setPlainBgColor(savedPlainBgColor);
        // Initialize gradient colors from settings or use defaults
        setGradientColor1(data.data.gradientColor1 || DEFAULT_THEME.bgDark);
        setGradientColor2(data.data.gradientColor2 || DEFAULT_THEME.bgDarkSecondary);
        setGradientColor3(data.data.gradientColor3 || DEFAULT_THEME.primaryDark);
        // Set background type - check if gradient colors exist to determine if gradient was previously used
        // If gradient colors are set, assume gradient was selected, otherwise use galaxy/plain logic
        const hasGradientColors = data.data.gradientColor1 || data.data.gradientColor2 || data.data.gradientColor3;
        const bgType = hasGradientColors && !galaxyEnabled ? "gradient" : (galaxyEnabled ? "galaxy" : "plain");
        setBackgroundType(bgType);
        // If plain is selected, apply the background color immediately
        if (bgType === "plain") {
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            document.body.style.backgroundColor = savedPlainBgColor;
            document.documentElement.style.backgroundColor = savedPlainBgColor;
            const layoutElement = document.querySelector('[class*="layout"]');
            if (layoutElement) {
              (layoutElement as HTMLElement).style.backgroundColor = savedPlainBgColor;
            }
          }, 0);
        } else if (bgType === "gradient") {
          // Apply gradient immediately
          setTimeout(() => {
            const root = document.documentElement;
            root.setAttribute("data-galaxy-enabled", "false");
            root.setAttribute("data-background-type", "gradient");
            document.body.style.background = `linear-gradient(45deg, ${data.data.gradientColor1 || DEFAULT_THEME.bgDark}, ${data.data.gradientColor2 || DEFAULT_THEME.bgDarkSecondary}, ${data.data.gradientColor3 || DEFAULT_THEME.primaryDark})`;
            document.body.style.backgroundSize = "400% 400%";
            document.body.style.animation = "gradientShift 15s ease infinite";
            document.documentElement.style.background = `linear-gradient(45deg, ${data.data.gradientColor1 || DEFAULT_THEME.bgDark}, ${data.data.gradientColor2 || DEFAULT_THEME.bgDarkSecondary}, ${data.data.gradientColor3 || DEFAULT_THEME.primaryDark})`;
            document.documentElement.style.backgroundSize = "400% 400%";
            document.documentElement.style.animation = "gradientShift 15s ease infinite";
          }, 0);
        }
      } else {
        setTimeout(() => {
          toast.error(data.error || "Failed to load theme settings");
        }, 0);
      }
    } catch (error) {
      console.error("Error fetching theme settings:", error);
      setTimeout(() => {
        toast.error("Failed to load theme settings");
      }, 0);
      // Use defaults if fetch fails
      setLocalTheme({ ...DEFAULT_THEME });
      setPreviewTheme({ ...DEFAULT_THEME });
      setGalaxyEnabled(true);
      setPlainBgColor("#000000");
      setGradientColor1(DEFAULT_THEME.bgDark);
      setGradientColor2(DEFAULT_THEME.bgDarkSecondary);
      setGradientColor3(DEFAULT_THEME.primaryDark);
      setBackgroundType("galaxy");
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setLocalTheme((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPreviewTheme((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleResetAll = () => {
    setLocalTheme({ ...DEFAULT_THEME });
    setPreviewTheme({ ...DEFAULT_THEME });
    setHasChanges(true);
  };

  const handleSaveClick = () => {
    if (!hasChanges) return;
    setIsPasswordModalOpen(true);
    setPassword("");
    setPasswordError("");
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    try {
      setIsSaving(true);
      setPasswordError("");

      // Build update object with only changed values (compared to defaults)
      const updateData: Record<string, string | null | boolean> = {};
      Object.keys(DEFAULT_THEME).forEach((key) => {
        const currentValue = localTheme[key];
        const defaultValue = DEFAULT_THEME[key];
        if (currentValue !== defaultValue) {
          updateData[key] = currentValue;
        } else {
          // Set to null to use default
          updateData[key] = null;
        }
      });
      
      // Add background settings
      updateData.galaxyBackgroundEnabled = backgroundType === "galaxy";
      updateData.plainBackgroundColor = plainBgColor;
      updateData.gradientColor1 = gradientColor1;
      updateData.gradientColor2 = gradientColor2;
      updateData.gradientColor3 = gradientColor3;

      const response = await fetch("/api/admin/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updateData, password }),
      });

      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          toast.success("Theme saved successfully");
        }, 0);
        setSettings(data.data);
        setHasChanges(false);
        setIsPasswordModalOpen(false);
        setPassword("");
        // Reload page to apply theme globally
        window.location.reload();
      } else {
        setPasswordError(data.error || "Failed to save theme");
      }
    } catch (error) {
      console.error("Error saving theme:", error);
      setPasswordError("Failed to save theme. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={20} className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Card className={styles.sectionCard}>
        <CardHeader className={styles.cardHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleRow}>
              <h2 className={styles.sectionTitle}>Theme</h2>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className={styles.resetButton}
                  title="Reset All"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className={styles.saveButton}
                  disabled={!hasChanges}
                  title="Save Theme"
                >
                  {isSaving ? (
                    <Loader2 size={18} className={styles.spinner} />
                  ) : (
                    <Save size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className={styles.themeContainer}>
            {/* Background Dropdown + Button & Text Color Pickers in a Row */}
            <div className={styles.simpleColorRow}>
              {/* Background Dropdown */}
              <div className={styles.simpleColorItem}>
                <div className={styles.backgroundDropdownWrapper}>
                  <Select
                    value={backgroundType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setBackgroundType(newType);
                      setHasChanges(true);
                      
                      const root = document.documentElement;
                      if (newType === "galaxy") {
                        setGalaxyEnabled(true);
                        root.setAttribute("data-galaxy-enabled", "true");
                        document.body.style.backgroundColor = "";
                        document.documentElement.style.backgroundColor = "";
                      } else if (newType === "plain") {
                        setGalaxyEnabled(false);
                        root.setAttribute("data-galaxy-enabled", "false");
                        // Apply the saved plain background color
                        const bgColor = plainBgColor || "#000000";
                        document.body.style.backgroundColor = bgColor;
                        document.documentElement.style.backgroundColor = bgColor;
                        // Also apply to admin layout if it exists
                        const layoutElement = document.querySelector('[class*="layout"]');
                        if (layoutElement) {
                          (layoutElement as HTMLElement).style.backgroundColor = bgColor;
                        }
                      } else if (newType === "gradient") {
                        setGalaxyEnabled(false);
                        root.setAttribute("data-galaxy-enabled", "false");
                        root.setAttribute("data-background-type", "gradient");
                        // Apply animated gradient background using custom gradient colors
                        document.body.style.background = `linear-gradient(45deg, ${gradientColor1}, ${gradientColor2}, ${gradientColor3})`;
                        document.body.style.backgroundSize = "400% 400%";
                        document.body.style.animation = "gradientShift 15s ease infinite";
                        document.documentElement.style.background = `linear-gradient(45deg, ${gradientColor1}, ${gradientColor2}, ${gradientColor3})`;
                        document.documentElement.style.backgroundSize = "400% 400%";
                        document.documentElement.style.animation = "gradientShift 15s ease infinite";
                      }
                    }}
                    className={styles.backgroundSelect}
                  >
                    {BACKGROUND_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Color Group Pickers */}
              {COLOR_GROUPS.map((group) => {
                const isOpen = openColorPicker === group.key;
                // Get the first color as the main swatch color
                const mainColor = group.colors[0];
                const mainValue = localTheme[mainColor.key] || DEFAULT_THEME[mainColor.key];
                
                return (
                  <div key={group.key} className={styles.simpleColorItem} ref={(el) => { colorPickerRefs.current[group.key] = el; }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const button = e.currentTarget;
                        const rect = button.getBoundingClientRect();
                        buttonPositions.current[group.key] = {
                          top: rect.bottom + 4,
                          left: rect.left + rect.width / 2,
                        };
                        setOpenColorPicker(isOpen ? null : group.key);
                      }}
                      className={styles.simpleColorButton}
                      title={group.label}
                    >
                      <span className={styles.simpleColorLabel}>{group.label}</span>
                    </button>
                    {mounted && isOpen && buttonPositions.current[group.key] && createPortal(
                      <div 
                        ref={(el) => { 
                          if (el) {
                            dropdownRefs.current[group.key] = el;
                          }
                        }}
                        className={styles.colorPickerDropdown}
                        style={{
                          top: `${buttonPositions.current[group.key].top}px`,
                          left: `${buttonPositions.current[group.key].left}px`,
                          transform: 'translateX(-50%)',
                          position: 'fixed',
                        }}
                      >
                        <div className={styles.colorPickerContent}>
                          {group.colors.map((color) => {
                            const value = localTheme[color.key] || DEFAULT_THEME[color.key];
                            return (
                              <div key={color.key} className={styles.groupedColorPicker}>
                                <label className={styles.groupedColorLabel}>{color.label}</label>
                                <input
                                  type="color"
                                  value={value}
                                  onChange={(e) => handleColorChange(color.key, e.target.value)}
                                  className={styles.colorInput}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>
                );
              })}

              {/* Plain Background Color Picker - Always visible to avoid layout shifts */}
              <div className={styles.simpleColorItem} ref={(el) => { colorPickerRefs.current["plainBgColor"] = el; }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const button = e.currentTarget;
                      const rect = button.getBoundingClientRect();
                      buttonPositions.current["plainBgColor"] = {
                        top: rect.bottom + 4,
                        left: rect.left + rect.width / 2,
                      };
                      setOpenColorPicker(openColorPicker === "plainBgColor" ? null : "plainBgColor");
                    }}
                    className={styles.simpleColorButton}
                    title="Plain Background Color"
                    disabled={backgroundType !== "plain"}
                    style={{ 
                      opacity: backgroundType !== "plain" ? 0.5 : 1,
                      cursor: backgroundType !== "plain" ? "not-allowed" : "pointer"
                    }}
                  >
                    <span className={styles.simpleColorLabel}>Background</span>
                  </button>
                  {mounted && openColorPicker === "plainBgColor" && buttonPositions.current["plainBgColor"] && createPortal(
                    <div 
                      ref={(el) => { 
                        if (el) {
                          dropdownRefs.current["plainBgColor"] = el;
                        }
                      }}
                      className={styles.colorPickerDropdown}
                      style={{
                        top: `${buttonPositions.current["plainBgColor"].top}px`,
                        left: `${buttonPositions.current["plainBgColor"].left}px`,
                        transform: 'translateX(-50%)',
                        position: 'fixed',
                      }}
                    >
                      <div className={styles.colorPickerContent}>
                        <input
                          type="color"
                          value={plainBgColor}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            setPlainBgColor(newColor);
                            setHasChanges(true);
                            // Only apply background color if "Plain" is selected
                            if (backgroundType === "plain") {
                              document.body.style.backgroundColor = newColor;
                              document.documentElement.style.backgroundColor = newColor;
                              // Also apply to admin layout if it exists
                              const layoutElement = document.querySelector('[class*="layout"]');
                              if (layoutElement) {
                                (layoutElement as HTMLElement).style.backgroundColor = newColor;
                              }
                            }
                          }}
                          className={styles.colorInput}
                        />
                      </div>
                    </div>,
                    document.body
                  )}
                </div>

              {/* Gradient Color Picker - Only shows when "Moving Gradient" is selected, inline with other buttons */}
              {backgroundType === "gradient" && (
                <div className={styles.simpleColorItem} ref={(el) => { colorPickerRefs.current["gradientColors"] = el; }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const button = e.currentTarget;
                      const rect = button.getBoundingClientRect();
                      buttonPositions.current["gradientColors"] = {
                        top: rect.bottom + 4,
                        left: rect.left + rect.width / 2,
                      };
                      setOpenColorPicker(openColorPicker === "gradientColors" ? null : "gradientColors");
                    }}
                    className={styles.simpleColorButton}
                    title="Gradient Colors"
                  >
                    <span className={styles.simpleColorLabel}>Gradient</span>
                  </button>
                  {mounted && openColorPicker === "gradientColors" && buttonPositions.current["gradientColors"] && createPortal(
                    <div 
                      ref={(el) => { 
                        if (el) {
                          dropdownRefs.current["gradientColors"] = el;
                        }
                      }}
                      className={styles.colorPickerDropdown}
                      style={{
                        top: `${buttonPositions.current["gradientColors"].top}px`,
                        left: `${buttonPositions.current["gradientColors"].left}px`,
                        transform: 'translateX(-50%)',
                        position: 'fixed',
                      }}
                    >
                      <div className={styles.colorPickerContent}>
                        <div className={styles.groupedColorPicker}>
                          <label className={styles.groupedColorLabel}>Color 1</label>
                          <input
                            type="color"
                            value={gradientColor1}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              setGradientColor1(newColor);
                              setHasChanges(true);
                              // Apply gradient immediately
                              const root = document.documentElement;
                              root.setAttribute("data-background-type", "gradient");
                              document.body.style.background = `linear-gradient(45deg, ${newColor}, ${gradientColor2}, ${gradientColor3})`;
                              document.body.style.backgroundSize = "400% 400%";
                              document.body.style.animation = "gradientShift 15s ease infinite";
                              document.documentElement.style.background = `linear-gradient(45deg, ${newColor}, ${gradientColor2}, ${gradientColor3})`;
                              document.documentElement.style.backgroundSize = "400% 400%";
                              document.documentElement.style.animation = "gradientShift 15s ease infinite";
                            }}
                            className={styles.colorInput}
                          />
                        </div>
                        <div className={styles.groupedColorPicker}>
                          <label className={styles.groupedColorLabel}>Color 2</label>
                          <input
                            type="color"
                            value={gradientColor2}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              setGradientColor2(newColor);
                              setHasChanges(true);
                              // Apply gradient immediately
                              const root = document.documentElement;
                              root.setAttribute("data-background-type", "gradient");
                              document.body.style.background = `linear-gradient(45deg, ${gradientColor1}, ${newColor}, ${gradientColor3})`;
                              document.body.style.backgroundSize = "400% 400%";
                              document.body.style.animation = "gradientShift 15s ease infinite";
                              document.documentElement.style.background = `linear-gradient(45deg, ${gradientColor1}, ${newColor}, ${gradientColor3})`;
                              document.documentElement.style.backgroundSize = "400% 400%";
                              document.documentElement.style.animation = "gradientShift 15s ease infinite";
                            }}
                            className={styles.colorInput}
                          />
                        </div>
                        <div className={styles.groupedColorPicker}>
                          <label className={styles.groupedColorLabel}>Color 3</label>
                          <input
                            type="color"
                            value={gradientColor3}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              setGradientColor3(newColor);
                              setHasChanges(true);
                              // Apply gradient immediately
                              const root = document.documentElement;
                              root.setAttribute("data-background-type", "gradient");
                              document.body.style.background = `linear-gradient(45deg, ${gradientColor1}, ${gradientColor2}, ${newColor})`;
                              document.body.style.backgroundSize = "400% 400%";
                              document.body.style.animation = "gradientShift 15s ease infinite";
                              document.documentElement.style.background = `linear-gradient(45deg, ${gradientColor1}, ${gradientColor2}, ${newColor})`;
                              document.documentElement.style.backgroundSize = "400% 400%";
                              document.documentElement.style.animation = "gradientShift 15s ease infinite";
                            }}
                            className={styles.colorInput}
                          />
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              )}
            </div>
            
            <div className={styles.previewNote}>
              <span>Changes apply to this page in real-time. Click "Save" to apply globally.</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Password Confirmation Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsPasswordModalOpen(false);
            setPassword("");
            setPasswordError("");
          }
        }}
        title="Confirm Password"
        showCloseButton={!isSaving}
      >
        <div className={styles.passwordModal}>
          <p className={styles.passwordPrompt}>
            Enter your admin password to save theme changes:
          </p>
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            placeholder="Password"
            error={passwordError}
            disabled={isSaving}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSaving) {
                handlePasswordSubmit();
              }
            }}
          />
          <div className={styles.passwordActions}>
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPassword("");
                setPasswordError("");
              }}
              className={styles.cancelButton}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePasswordSubmit}
              className={styles.submitButton}
              disabled={isSaving || !password.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className={styles.spinner} />
                  <span>Saving...</span>
                </>
              ) : (
                "Confirm & Save"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
