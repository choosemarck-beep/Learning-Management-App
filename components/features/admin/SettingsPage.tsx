"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Key, 
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./SettingsPage.module.css";

interface SettingsPageProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const [activeSection, setActiveSection] = useState<string>("account");
  const [isLoading, setIsLoading] = useState(false);
  
  // Account Settings
  const [accountData, setAccountData] = useState({
    name: user.name,
    email: user.email,
  });

  // Password Settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30, // minutes
  });

  const handleSaveAccount = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to update account
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      toast.success("Account settings updated successfully");
    } catch (error) {
      toast.error("Failed to update account settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save system settings
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      toast.success("System settings updated successfully");
    } catch (error) {
      toast.error("Failed to update system settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save security settings
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      toast.success("Security settings updated successfully");
    } catch (error) {
      toast.error("Failed to update security settings");
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "system", label: "System", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "integrations", label: "Integrations", icon: Key },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Settings</h2>
        <nav className={styles.nav}>
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`${styles.navItem} ${activeSection === section.id ? styles.active : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={18} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className={styles.content}>
        {/* Account Settings */}
        {activeSection === "account" && (
          <Card>
            <CardHeader>
              <h3 className={styles.sectionTitle}>Account Settings</h3>
              <p className={styles.sectionDescription}>
                Manage your account information and profile details.
              </p>
            </CardHeader>
            <CardBody>
              <div className={styles.form}>
                <div className={styles.formField}>
                  <Input
                    label="Full Name"
                    name="name"
                    type="text"
                    value={accountData.name}
                    onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className={styles.formField}>
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    placeholder="Enter your email address"
                  />
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSaveAccount}
                    isLoading={isLoading}
                  >
                    <Save size={18} />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Password Settings */}
        {activeSection === "password" && (
          <Card>
            <CardHeader>
              <h3 className={styles.sectionTitle}>Password Settings</h3>
              <p className={styles.sectionDescription}>
                Change your password to keep your account secure.
              </p>
            </CardHeader>
            <CardBody>
              <div className={styles.form}>
                <div className={styles.formField}>
                  <div className={styles.passwordInputWrapper}>
                    <Input
                      label="Current Password"
                      name="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className={styles.formField}>
                  <div className={styles.passwordInputWrapper}>
                    <Input
                      label="New Password"
                      name="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className={styles.formField}>
                  <div className={styles.passwordInputWrapper}>
                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleChangePassword}
                    isLoading={isLoading}
                  >
                    <Lock size={18} />
                    Change Password
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* System Settings */}
        {activeSection === "system" && (
          <Card>
            <CardHeader>
              <h3 className={styles.sectionTitle}>System Settings</h3>
              <p className={styles.sectionDescription}>
                Configure your notification preferences and system preferences.
              </p>
            </CardHeader>
            <CardBody>
              <div className={styles.form}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Email Notifications</label>
                    <p className={styles.settingDescription}>
                      Receive email notifications for important events and updates.
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={systemSettings.emailNotifications}
                      onChange={(e) => setSystemSettings({ ...systemSettings, emailNotifications: e.target.checked })}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Push Notifications</label>
                    <p className={styles.settingDescription}>
                      Receive push notifications in your browser.
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={systemSettings.pushNotifications}
                      onChange={(e) => setSystemSettings({ ...systemSettings, pushNotifications: e.target.checked })}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Weekly Reports</label>
                    <p className={styles.settingDescription}>
                      Receive weekly summary reports via email.
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={systemSettings.weeklyReports}
                      onChange={(e) => setSystemSettings({ ...systemSettings, weeklyReports: e.target.checked })}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSaveSystemSettings}
                    isLoading={isLoading}
                  >
                    <Save size={18} />
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Security Settings */}
        {activeSection === "security" && (
          <Card>
            <CardHeader>
              <h3 className={styles.sectionTitle}>Security Settings</h3>
              <p className={styles.sectionDescription}>
                Manage your account security and authentication settings.
              </p>
            </CardHeader>
            <CardBody>
              <div className={styles.form}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Two-Factor Authentication</label>
                    <p className={styles.settingDescription}>
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorEnabled}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: e.target.checked })}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
                <div className={styles.formField}>
                  <label className={styles.settingLabel}>Session Timeout (minutes)</label>
                  <Input
                    name="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) || 30 })}
                    min={5}
                    max={1440}
                  />
                  <p className={styles.helperText}>
                    Automatically log out after this many minutes of inactivity.
                  </p>
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSaveSecuritySettings}
                    isLoading={isLoading}
                  >
                    <Save size={18} />
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Integration Settings */}
        {activeSection === "integrations" && (
          <Card>
            <CardHeader>
              <h3 className={styles.sectionTitle}>Integration Settings</h3>
              <p className={styles.sectionDescription}>
                Manage API keys, webhooks, and third-party integrations.
              </p>
            </CardHeader>
            <CardBody>
              <div className={styles.form}>
                <div className={styles.infoBox}>
                  <p className={styles.infoText}>
                    Integration settings are managed by system administrators.
                    Contact your administrator to configure API keys and webhooks.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

