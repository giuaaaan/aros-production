"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Palette, 
  Type, 
  Image, 
  Layout,
  Upload,
  Eye,
  RefreshCcw,
  Save,
  Undo
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandingConfig {
  // General
  appName: string;
  tagline: string;
  favicon: string;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  
  // Logo
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
  
  // Typography
  fontFamily: string;
  fontSize: string;
  
  // Layout
  sidebarWidth: number;
  borderRadius: string;
  
  // Features
  showPoweredBy: boolean;
  customCss: string;
}

const defaultConfig: BrandingConfig = {
  appName: "AROS",
  tagline: "Admin Console",
  favicon: "/favicon.ico",
  primaryColor: "#22C55E",
  secondaryColor: "#3B82F6",
  accentColor: "#F59E0B",
  backgroundColor: "#0A0A0A",
  logoUrl: "/logo.svg",
  logoWidth: 40,
  logoHeight: 40,
  fontFamily: "Inter",
  fontSize: "16px",
  sidebarWidth: 256,
  borderRadius: "0.5rem",
  showPoweredBy: true,
  customCss: "",
};

const fontOptions = [
  { value: "Inter", label: "Inter (Default)" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Poppins", label: "Poppins" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
];

const borderRadiusOptions = [
  { value: "0rem", label: "None (0px)" },
  { value: "0.25rem", label: "Small (4px)" },
  { value: "0.5rem", label: "Medium (8px)" },
  { value: "0.75rem", label: "Large (12px)" },
  { value: "1rem", label: "Extra Large (16px)" },
];

export default function BrandingPage() {
  const [config, setConfig] = useState<BrandingConfig>(defaultConfig);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleChange = (key: keyof BrandingConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (confirm("Reset all branding to defaults?")) {
      setConfig(defaultConfig);
    }
  };

  const handleSave = async () => {
    // API call to save config
    console.log("Saving branding config:", config);
    alert("Branding settings saved!");
  };

  return (
    <div>
      <Header
        title="White-Label Branding"
        description="Customize the look and feel of your admin dashboard"
      />
      <div className="p-6 space-y-6">
        {/* Preview Toggle */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Live Preview</p>
                <p className="text-sm text-muted-foreground">
                  See changes in real-time
                </p>
              </div>
            </div>
            <Switch
              checked={previewMode}
              onCheckedChange={setPreviewMode}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" className="gap-2">
                  <Layout className="w-4 h-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="colors" className="gap-2">
                  <Palette className="w-4 h-4" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="logo" className="gap-2">
                  <Image className="w-4 h-4" />
                  Logo
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-2">
                  <Type className="w-4 h-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Basic branding information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="appName">Application Name</Label>
                      <Input
                        id="appName"
                        value={config.appName}
                        onChange={(e) => handleChange("appName", e.target.value)}
                        placeholder="Your App Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={config.tagline}
                        onChange={(e) => handleChange("tagline", e.target.value)}
                        placeholder="Your tagline"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon">Favicon URL</Label>
                      <Input
                        id="favicon"
                        value={config.favicon}
                        onChange={(e) => handleChange("favicon", e.target.value)}
                        placeholder="/favicon.ico"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="poweredBy">Show "Powered By"</Label>
                        <p className="text-sm text-muted-foreground">
                          Display attribution in the footer
                        </p>
                      </div>
                      <Switch
                        id="poweredBy"
                        checked={config.showPoweredBy}
                        onCheckedChange={(checked) => handleChange("showPoweredBy", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="colors" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Scheme</CardTitle>
                    <CardDescription>
                      Customize the color palette
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="primaryColor"
                            value={config.primaryColor}
                            onChange={(e) => handleChange("primaryColor", e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={config.primaryColor}
                            onChange={(e) => handleChange("primaryColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="secondaryColor"
                            value={config.secondaryColor}
                            onChange={(e) => handleChange("secondaryColor", e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={config.secondaryColor}
                            onChange={(e) => handleChange("secondaryColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accentColor">Accent Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="accentColor"
                            value={config.accentColor}
                            onChange={(e) => handleChange("accentColor", e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={config.accentColor}
                            onChange={(e) => handleChange("accentColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="backgroundColor">Background Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="backgroundColor"
                            value={config.backgroundColor}
                            onChange={(e) => handleChange("backgroundColor", e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => handleChange("backgroundColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logo" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Logo Configuration</CardTitle>
                    <CardDescription>
                      Upload and configure your logo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="logoUrl"
                          value={config.logoUrl}
                          onChange={(e) => handleChange("logoUrl", e.target.value)}
                          placeholder="/logo.svg"
                          className="flex-1"
                        />
                        <Button variant="outline" className="gap-2">
                          <Upload className="w-4 h-4" />
                          Upload
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="logoWidth">Width (px)</Label>
                        <Input
                          id="logoWidth"
                          type="number"
                          value={config.logoWidth}
                          onChange={(e) => handleChange("logoWidth", parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logoHeight">Height (px)</Label>
                        <Input
                          id="logoHeight"
                          type="number"
                          value={config.logoHeight}
                          onChange={(e) => handleChange("logoHeight", parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="p-8 border-2 border-dashed rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Logo preview will appear here
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>
                      Typography and layout customization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <select
                        id="fontFamily"
                        value={config.fontFamily}
                        onChange={(e) => handleChange("fontFamily", e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm"
                      >
                        {fontOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Base Font Size</Label>
                      <Input
                        id="fontSize"
                        value={config.fontSize}
                        onChange={(e) => handleChange("fontSize", e.target.value)}
                        placeholder="16px"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="borderRadius">Border Radius</Label>
                      <select
                        id="borderRadius"
                        value={config.borderRadius}
                        onChange={(e) => handleChange("borderRadius", e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm"
                      >
                        {borderRadiusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sidebarWidth">Sidebar Width (px)</Label>
                      <Input
                        id="sidebarWidth"
                        type="number"
                        value={config.sidebarWidth}
                        onChange={(e) => handleChange("sidebarWidth", parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customCss">Custom CSS</Label>
                      <textarea
                        id="customCss"
                        value={config.customCss}
                        onChange={(e) => handleChange("customCss", e.target.value)}
                        placeholder="/* Enter custom CSS here */"
                        className="w-full min-h-[120px] p-3 rounded-md border border-input bg-transparent text-sm font-mono"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 mt-6">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <Undo className="w-4 h-4" />
                Reset to Default
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  See how your branding looks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="rounded-lg overflow-hidden border"
                  style={{ backgroundColor: config.backgroundColor }}
                >
                  {/* Mock Header */}
                  <div 
                    className="p-4 flex items-center gap-3"
                    style={{ backgroundColor: `${config.primaryColor}20` }}
                  >
                    <div 
                      className="rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ 
                        backgroundColor: config.primaryColor,
                        width: config.logoWidth,
                        height: config.logoHeight,
                      }}
                    >
                      {config.appName.charAt(0)}
                    </div>
                    <div>
                      <p 
                        className="font-bold"
                        style={{ 
                          color: config.primaryColor,
                          fontFamily: config.fontFamily,
                        }}
                      >
                        {config.appName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {config.tagline}
                      </p>
                    </div>
                  </div>
                  
                  {/* Mock Content */}
                  <div className="p-4 space-y-3">
                    <div 
                      className="h-8 rounded flex items-center px-3 text-white text-sm"
                      style={{ 
                        backgroundColor: config.primaryColor,
                        borderRadius: config.borderRadius,
                      }}
                    >
                      Primary Button
                    </div>
                    <div 
                      className="h-8 rounded flex items-center px-3 text-white text-sm"
                      style={{ 
                        backgroundColor: config.secondaryColor,
                        borderRadius: config.borderRadius,
                      }}
                    >
                      Secondary Button
                    </div>
                    <div 
                      className="h-8 rounded flex items-center px-3 text-white text-sm"
                      style={{ 
                        backgroundColor: config.accentColor,
                        borderRadius: config.borderRadius,
                      }}
                    >
                      Accent Element
                    </div>
                    <p 
                      className="text-sm pt-2"
                      style={{ fontFamily: config.fontFamily }}
                    >
                      Sample text with {config.fontFamily} font
                    </p>
                  </div>
                  
                  {/* Mock Footer */}
                  {config.showPoweredBy && (
                    <div className="p-3 text-center text-xs text-muted-foreground border-t">
                      Powered by {config.appName}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
