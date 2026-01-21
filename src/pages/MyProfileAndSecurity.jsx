import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Contact, 
  Lock, 
  Smartphone, 
  Laptop, 
  Monitor, 
  X, 
  CheckCircle,
  Smartphone as PhoneIcon 
} from "lucide-react";

export default function MyProfileAndSecurity() {
  return (
    <main className="my-profile">
      {/* Page Heading */}
      <div className="my-profile__header">
        <h1 className="my-profile__title">My Profile & Security Settings</h1>
        <p className="my-profile__subtitle">Manage your personal information, security credentials, and active device sessions.</p>
      </div>

      {/* Profile Header Card */}
      <Card variant="default">
        <CardContent className="my-profile__profile-card">
          <div className="my-profile__user-info">
            <div className="my-profile__avatar-wrapper">
              <Avatar size={96} className="border-4 border-white dark:border-zinc-800 shadow-lg">
                <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSwfIaw5G90-tsAI_PeXfhcA2Z7zLyxC8_Pzw_j6HGVHE8G-8Asjyn4qsIJRyMxDQoVVLJAPbFTSQxt1Waw3Muya0NgeWdbs36ns-xoiG00qheiHtU3_JU61CRTY0jrv4_nuJ3f8yNvf3sAGc-Y089pN1z8hQToQuo-YiAhqN-vOZgs_uMZMsX0HvVj6cHfuHJz8hTsy7n6uUdIZtmTH26fOGhAAq8ZEI77ZyxR5c7pPMpSAiMWiASDZVIRFF4B5O49AC3oHUGaQ" alt="Alex Morgan" />
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
              <button className="my-profile__avatar-edit">
                <Camera size={16} />
              </button>
            </div>
            
            <div className="my-profile__details">
              <h3 className="my-profile__name">Alex Morgan</h3>
              <p className="my-profile__email">alex.morgan@company.com</p>
              <div className="my-profile__badges">
                <Badge variant="subtle-primary" shape="pill">Global Administrator</Badge>
                <Badge variant="subtle-success" shape="pill">Active Account</Badge>
              </div>
            </div>
          </div>

          <div>
            <Button variant="primary">Update Profile</Button>
          </div>
        </CardContent>
      </Card>

      <div className="my-profile__grid">
        {/* Personal Info Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Contact className="text-primary w-5 h-5" />
              Personal Information
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">First Name</label>
                  <Input defaultValue="Alex" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Last Name</label>
                  <Input defaultValue="Morgan" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Email Address</label>
                <Input defaultValue="alex.morgan@company.com" disabled className="text-muted-foreground cursor-not-allowed bg-muted/50" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Phone Number</label>
                <Input type="tel" defaultValue="+1 (555) 012-3456" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Department</label>
                <Select defaultValue="executive">
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Executive Management</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Product Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Password Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Lock className="text-primary w-5 h-5" />
              Security Settings
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Current Password</label>
                <Input type="password" placeholder="••••••••••••" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">New Password</label>
                <Input type="password" placeholder="Min. 12 characters" />
                
                <div className="my-profile__strength-meter">
                  <div className="my-profile__strength-segment my-profile__strength-segment--active"></div>
                  <div className="my-profile__strength-segment my-profile__strength-segment--active"></div>
                  <div className="my-profile__strength-segment my-profile__strength-segment--active"></div>
                  <div className="my-profile__strength-segment"></div>
                </div>
                <p className="my-profile__strength-text">Strong Password</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Confirm New Password</label>
                <Input type="password" />
              </div>

              <div className="my-profile__2fa-card">
                <div className="my-profile__2fa-content">
                  <Smartphone className="text-primary w-6 h-6" />
                  <div>
                    <p className="text-sm font-bold">Two-Factor Auth</p>
                    <p className="text-xs text-muted-foreground">Authenticator App enabled</p>
                  </div>
                </div>
                <button className="text-primary text-xs font-bold hover:underline">Manage</button>
              </div>

              <Button variant="primary" className="w-full mt-2">Update Password</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Management */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Monitor className="text-primary w-5 h-5" />
              Active Sessions
            </h2>
            <Button variant="destructive" size="sm" className="h-8 text-xs">
              Sign out of all other sessions
            </Button>
          </div>

          <div className="session-list">
            {/* Current Session */}
            <div className="session-list__item">
              <div className="session-list__info-wrapper">
                <div className="session-list__icon session-list__icon--current">
                  <Laptop size={20} />
                </div>
                <div className="session-list__details">
                  <div className="session-list__device-name">
                    Chrome on macOS Monterey
                    <Badge variant="subtle-success" size="sm" className="px-1.5 py-0.5 text-[10px] h-auto">Current</Badge>
                  </div>
                  <p className="session-list__location">San Francisco, USA • 192.168.1.1</p>
                </div>
              </div>
            </div>

            {/* Other Session 1 */}
            <div className="session-list__item">
              <div className="session-list__info-wrapper">
                <div className="session-list__icon">
                  <Smartphone size={20} />
                </div>
                <div className="session-list__details">
                  <p className="session-list__device-name">Safari on iPhone 15 Pro</p>
                  <p className="session-list__location">San Francisco, USA • 2 hours ago</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-destructive transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Other Session 2 */}
            <div className="session-list__item">
              <div className="session-list__info-wrapper">
                <div className="session-list__icon">
                  <Monitor size={20} />
                </div>
                <div className="session-list__details">
                  <p className="session-list__device-name">Firefox on Windows 11</p>
                  <p className="session-list__location">Seattle, USA • 3 days ago</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-destructive transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
