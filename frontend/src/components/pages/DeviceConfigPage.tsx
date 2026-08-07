import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Key, Hash, Code, Trash2, Copy, Check, AlertTriangle, Shield, Eye, EyeOff, ChevronDown, ChevronUp, User, Database, Mail } from 'lucide-react';
import { toast } from 'sonner';
import backend from '../utils/backend';
import { isDemoMode } from '../utils/demoData';

// Get base API URL (without /api suffix for constructing full URLs)
const getApiBase = () => {
  const viteBase = (import.meta as any)?.env?.VITE_API_BASE;
  if (viteBase) {
    // VITE_API_BASE already includes /api, so strip it for base URL
    return viteBase.replace(/\/api\/?$/, '');
  }
  return 'https://do-sensor-backend.onrender.com';
};

const API_BASE_URL = getApiBase();

const fetchDeviceConfig = async () => {
  if (isDemoMode()) {
    return {
      deviceId: 'DO-KGP-2026-017',
      apiKey: 'demo_do_kgp_7F3A9C2E1B84',
      userId: 'research-operator-01',
      userEmail: 'research.operator@example.org',
      createdAt: '2026-01-15T09:30:00.000Z'
    };
  }
  const token = backend.getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/auth/device-config`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const errorData = await response.text();
    console.error('API Error:', response.status, errorData);
    throw new Error(`Failed to fetch device config: ${response.status}`);
  }
  return response.json();
};

const fetchStorageInfo = async () => {
  if (isDemoMode()) return { totalReadings: 48240, estimatedSizeGB: 0.0182 };
  const token = backend.getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/readings/storage-info`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    return { totalReadings: 0, estimatedSizeGB: 0 };
  }
  return response.json();
};

const deleteAccount = async () => {
  if (isDemoMode()) return { ok: true, message: 'Demo account reset' };
  const token = backend.getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Delete API Error:', response.status, errorData);
    throw new Error(`Failed to delete account: ${response.status}`);
  }
  return response.json();
};

interface DeviceConfig {
  deviceId: string;
  apiKey: string;
  userId: string;
  userEmail: string;
  createdAt: string;
}

export default function DeviceConfigPage({ onSignOut }: { onSignOut: () => void }) {
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ totalReadings: number; estimatedSizeGB: number }>({ totalReadings: 0, estimatedSizeGB: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedDeviceId, setCopiedDeviceId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSampleCode, setShowSampleCode] = useState(false);

  useEffect(() => {
    loadDeviceConfig();
  }, []);

  const loadDeviceConfig = async () => {
    try {
      setLoading(true);
      const data = await fetchDeviceConfig();
      console.log('Device config loaded:', data);
      setDeviceConfig(data);
      
      // Load storage info
      const storage = await fetchStorageInfo();
      setStorageInfo(storage);
    } catch (error: any) {
      console.error('Error fetching device config:', error);
      toast.error('Failed to load device configuration: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'apiKey' | 'deviceId' | 'code') => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          textArea.remove();
          throw err;
        }
      }
      
      // Set the appropriate copied state
      if (type === 'apiKey') {
        setCopiedApiKey(true);
        setTimeout(() => setCopiedApiKey(false), 2000);
      } else if (type === 'deviceId') {
        setCopiedDeviceId(true);
        setTimeout(() => setCopiedDeviceId(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      
      toast.success(`${type === 'apiKey' ? 'API Key' : type === 'deviceId' ? 'Device ID' : 'Sample Code'} copied to clipboard`);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      toast.success('Account deleted successfully. Signing you out...');
      setTimeout(() => {
        onSignOut();
      }, 1500);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const getSampleCode = () => {
    if (!deviceConfig) return '';
    
    const baseUrl = API_BASE_URL || 'https://do-sensor-backend.onrender.com';
    
    return `# DO Sensor Sample Code
# Replace the values below with your credentials

import requests
import time

# Your unique credentials
API_KEY = "${deviceConfig.apiKey}"
DEVICE_ID = "${deviceConfig.deviceId}"
BASE_URL = "${baseUrl}/api"

# Send sensor reading
def send_reading(do_concentration, temperature, pressure, do_saturation):
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    data = {
        "sensor_id": DEVICE_ID,
        "do_concentration": do_concentration,
        "temperature": temperature,
        "pressure": pressure,
        "do_saturation": do_saturation,
        "captured_at": int(time.time())
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/readings",
            headers=headers,
            json=data
        )
        
        if response.status_code == 201:
            print("✅ Reading sent successfully")
            return response.json()
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return None

# Example usage
if __name__ == "__main__":
    # Sample sensor values
    result = send_reading(
        do_concentration=7.5,
        temperature=25.3,
        pressure=1013.25,
        do_saturation=85.2
    )
    
    if result:
        print(f"Reading ID: {result['id']}")`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!deviceConfig) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Device Configuration Not Available</CardTitle>
              <CardDescription>Unable to load device configuration. Please try again.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadDeviceConfig}>Retry</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-primary p-2 rounded-lg">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Device Configuration</h1>
            <p className="text-muted-foreground text-xs mt-1">Manage your device credentials</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* User Email Section */}
            <Card 
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Mail className="h-4 w-4" />
                  <span>Account Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <p className="text-xs text-muted-foreground">
                  The email address associated with your account
                </p>
                <div className="flex space-x-2">
                  <Input
                    id="userEmail"
                    value={deviceConfig.userEmail || 'N/A'}
                    readOnly
                    className="font-mono text-xs bg-muted flex-1 h-8"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Device ID Section */}
            <Card 
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Hash className="h-4 w-4" />
                  <span>Device ID</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <p className="text-xs text-muted-foreground">
                  Your unique device identifier - use this to identify your sensor
                </p>
                <div className="flex space-x-2">
                  <Input
                    id="deviceId"
                    value={deviceConfig.deviceId}
                    readOnly
                    className="font-mono text-xs bg-muted flex-1 h-8"
                  />
                  <Button
                    onClick={() => copyToClipboard(deviceConfig.deviceId, 'deviceId')}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title="Copy Device ID"
                  >
                    {copiedDeviceId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Key Section */}
            <Card 
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Key className="h-4 w-4" />
                  <span>API Key</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <p className="text-xs text-muted-foreground">
                  Your secret API key - keep this secure and never share it publicly
                </p>
                <div className="flex space-x-2">
                  <Input
                    id="apiKey"
                    value={deviceConfig.apiKey}
                    readOnly
                    className="font-mono text-xs bg-muted flex-1 h-8"
                    type={showApiKey ? "text" : "password"}
                  />
                  <Button
                    onClick={() => setShowApiKey(!showApiKey)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title={showApiKey ? "Hide API Key" : "Show API Key"}
                  >
                    {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(deviceConfig.apiKey, 'apiKey')}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title="Copy API Key"
                  >
                    {copiedApiKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Database Storage Section */}
            <Card 
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Database className="h-4 w-4" />
                  <span>Database Storage</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <p className="text-xs text-muted-foreground">
                  Current storage usage for your sensor data
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Readings</p>
                    <p className="text-lg font-semibold text-foreground">{storageInfo.totalReadings.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Storage Used</p>
                    <p className="text-lg font-semibold text-foreground">{storageInfo.estimatedSizeGB.toFixed(2)} GB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delete Account Section */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={deleting}
                  size="default"
                  className="w-full flex items-center justify-center space-x-2 h-9"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">{deleting ? 'Deleting...' : 'Delete Account'}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <div className="space-y-6">
                  <div>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center space-x-3 text-xl font-bold">
                        <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                        <span>Delete Account</span>
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription className="space-y-4 mt-4">
                      <p className="text-base font-semibold text-foreground">
                        Are you absolutely sure?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This will permanently delete your account and all associated data:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Your user account and profile</li>
                        <li>All sensor data and readings</li>
                        <li>Device credentials (API Key & Device ID)</li>
                        <li>All configurations and settings</li>
                        <li>Calibration history and logs</li>
                      </ul>
                      <p className="text-sm font-semibold text-red-600 pt-2">
                        This action cannot be undone!
                      </p>
                    </AlertDialogDescription>
                  </div>
                  
                  <AlertDialogFooter className="gap-3 flex-row justify-between">
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold flex-1"
                    >
                      Delete Account
                    </AlertDialogAction>
                    <AlertDialogCancel className="flex-1 font-semibold">
                      Cancel
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Sample Code Section */}
            <Card 
              style={{ 
                backgroundColor: 'var(--color-status-box)',
                borderColor: 'var(--color-status-box-border)'
              }}
            >
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Code className="h-4 w-4" />
                    <span>Sample Code</span>
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={() => copyToClipboard(getSampleCode(), 'code')}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      title="Copy Sample Code"
                    >
                      {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button
                      onClick={() => setShowSampleCode(!showSampleCode)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      {showSampleCode ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {showSampleCode && (
                <CardContent className="space-y-2 px-4 pb-4">
                  <p className="text-xs text-muted-foreground">
                    Example code to integrate your sensor with the dashboard
                  </p>
                  <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs font-mono max-h-72 border border-gray-800">
                    <code>{getSampleCode()}</code>
                  </pre>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
    </div>
  );
}
